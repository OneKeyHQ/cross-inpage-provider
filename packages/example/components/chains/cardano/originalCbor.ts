import { blake2b } from '@noble/hashes/blake2b';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { decode, encode } from 'cborg';
import type { DecodeOptions } from 'cborg';
import type { WalletApi } from 'lucid-cardano';
import nacl from 'tweetnacl';

export type SigningWallet = Pick<
  WalletApi,
  'getUtxos' | 'getChangeAddress' | 'getNetworkId' | 'signTx'
>;
export type CborEncoding = { taggedInputs: boolean; mapOutputs: boolean };

export type SigningDraft = {
  txHex: string;
  bodyHex: string;
  originalHash: string;
  reencodedHash: string;
  changeAddress: string;
  networkId: number;
  input: { txHash: string; index: number; paymentKeyHash: string; lovelace: string };
  outputLovelace: string;
  feeLovelace: string;
  encoding: CborEncoding;
};

const tags: NonNullable<DecodeOptions['tags']> = [];
tags[258] = (value: unknown) => value;

function fromHex(hex: string): Uint8Array {
  if (!hex || hex.length % 2 || !/^[\da-f]+$/i.test(hex)) {
    throw new Error('钱包返回了无效的 CBOR / 地址 hex');
  }
  return hexToBytes(hex);
}

function decodeCbor(hex: string): unknown {
  return decode(fromHex(hex), { useMaps: true, tags });
}

type PureAdaInput = SigningDraft['input'] & { networkId: number };

function readPureAdaInput(hex: string): PureAdaInput | null {
  const decoded = decodeCbor(hex);
  if (!Array.isArray(decoded) || decoded.length !== 2) return null;
  const [input, output] = decoded as unknown[];
  if (!Array.isArray(input) || input.length !== 2) return null;
  const [txHash, index] = input as unknown[];
  let address: unknown;
  let coin: unknown;
  if (Array.isArray(output) && output.length === 2) {
    [address, coin] = output as unknown[];
  } else if (output instanceof Map && output.size === 2) {
    const fields = output as Map<unknown, unknown>;
    address = fields.get(0);
    coin = fields.get(1);
  } else {
    return null;
  }
  if (
    !(txHash instanceof Uint8Array) ||
    txHash.length !== 32 ||
    typeof index !== 'number' ||
    !Number.isSafeInteger(index) ||
    index < 0 ||
    index > 0xffffffff ||
    !(address instanceof Uint8Array) ||
    address.length < 29 ||
    ![0, 2, 4, 6].includes(address[0] >> 4) ||
    !(
      (typeof coin === 'bigint' && coin >= BigInt(0)) ||
      (typeof coin === 'number' && Number.isSafeInteger(coin) && coin >= 0)
    )
  )
    return null;
  // Shelley key-payment address types store the payment key hash immediately after the header.
  return {
    txHash: bytesToHex(txHash),
    index,
    paymentKeyHash: bytesToHex(address.slice(1, 29)),
    lovelace: coin.toString(),
    networkId: address[0] & 15,
  };
}

function encodeBody(
  input: PureAdaInput,
  changeAddress: string,
  amount: bigint,
  fee: bigint,
  encoding: CborEncoding,
): string {
  const inputs = bytesToHex(encode([[fromHex(input.txHash), input.index]]));
  const address = fromHex(changeAddress);
  const output = encoding.mapOutputs
    ? new Map<unknown, unknown>([
        [0, address],
        [1, amount],
      ])
    : [address, amount];
  // Encode the body directly: a Transaction round trip can change the bytes under test.
  return `a300${encoding.taggedInputs ? 'd90102' : ''}${inputs}0181${bytesToHex(
    encode(output),
  )}02${bytesToHex(encode(fee))}`;
}

function bodyHash(bodyHex: string): string {
  return bytesToHex(blake2b(fromHex(bodyHex), { dkLen: 32 }));
}

export async function assertDraftAccount(
  wallet: SigningWallet,
  draft: SigningDraft,
): Promise<void> {
  const [address, networkId] = await Promise.all([
    wallet.getChangeAddress(),
    wallet.getNetworkId(),
  ]);
  if (address.toLowerCase() !== draft.changeAddress || networkId !== draft.networkId) {
    throw new Error('钱包账户或网络已变化，请重新构造样本');
  }
}

export async function createSigningDraft(
  wallet: SigningWallet,
  encoding: CborEncoding,
): Promise<SigningDraft> {
  const [utxos, addressHex, networkId] = await Promise.all([
    wallet.getUtxos(),
    wallet.getChangeAddress(),
    wallet.getNetworkId(),
  ]);
  const changeAddress = addressHex.toLowerCase();
  const address = fromHex(changeAddress);
  if (
    address.length < 29 ||
    ![0, 2, 4, 6].includes(address[0] >> 4) ||
    (address[0] & 15) !== networkId
  ) {
    throw new Error('需要同网络的 Shelley 支付密钥账户');
  }
  const candidates = (utxos ?? [])
    .map(readPureAdaInput)
    .filter(
      (input): input is PureAdaInput =>
        !!input && input.networkId === networkId && BigInt(input.lovelace) >= BigInt(2000000),
    );
  // Deterministic selection lets QA rebuild the same unbroadcast transaction on another app version.
  candidates.sort((a, b) => {
    const difference = BigInt(a.lovelace) - BigInt(b.lovelace);
    if (difference !== BigInt(0)) return difference < BigInt(0) ? -1 : 1;
    if (a.txHash !== b.txHash) return a.txHash < b.txHash ? -1 : 1;
    return a.index - b.index;
  });
  const input = candidates[0];
  if (!input) throw new Error('需要至少一个不含代币、datum 或脚本的纯 ADA UTXO，金额至少 2 ADA');
  const fee = BigInt(200000);
  const amount = BigInt(input.lovelace) - fee;
  const bodyHex = encodeBody(input, changeAddress, amount, fee, encoding);
  const reencodedBody = encodeBody(input, changeAddress, amount, fee, {
    taggedInputs: true,
    mapOutputs: false,
  });
  const draft: SigningDraft = {
    txHex: `84${bodyHex}a0f5f6`,
    bodyHex,
    originalHash: bodyHash(bodyHex),
    reencodedHash: bodyHash(reencodedBody),
    changeAddress,
    networkId,
    input,
    outputLovelace: amount.toString(),
    feeLovelace: fee.toString(),
    encoding,
  };
  await assertDraftAccount(wallet, draft);
  return draft;
}

export function verifyOriginalBody(draft: SigningDraft, witnessHex: string) {
  const decoded = decodeCbor(witnessHex);
  if (!(decoded instanceof Map)) throw new Error('signTx 应返回 witness set，而非完整交易');
  const fields = decoded as Map<unknown, unknown>;
  const verificationKeys = fields.get(0);
  if (!Array.isArray(verificationKeys) || !verificationKeys.length) {
    throw new Error('返回的 witness set 没有支付密钥签名');
  }
  // Hash the raw body again instead of trusting hashes stored in the UI draft.
  const originalHash = bodyHash(draft.bodyHex);
  const witnesses = (verificationKeys as unknown[]).map((item) => {
    if (!Array.isArray(item) || item.length !== 2) throw new Error('无效的 key witness');
    const [publicKey, signature] = item as unknown[];
    if (
      !(publicKey instanceof Uint8Array) ||
      publicKey.length !== 32 ||
      !(signature instanceof Uint8Array) ||
      signature.length !== 64
    )
      throw new Error('无效的公钥或签名长度');
    return {
      paymentKeyHash: bytesToHex(blake2b(publicKey, { dkLen: 28 })),
      validForOriginal: nacl.sign.detached.verify(fromHex(originalHash), signature, publicKey),
      validForReencoded: nacl.sign.detached.verify(
        fromHex(draft.reencodedHash),
        signature,
        publicKey,
      ),
    };
  });
  const inputKeySigned = witnesses.some(
    (witness) => witness.paymentKeyHash === draft.input.paymentKeyHash && witness.validForOriginal,
  );
  return {
    pass: inputKeySigned && witnesses.every((witness) => witness.validForOriginal),
    originalHash,
    reencodedHash: draft.reencodedHash,
    encodingChangesHash: originalHash !== draft.reencodedHash,
    inputKeySigned,
    witnessCount: witnesses.length,
    witnesses,
  };
}

export async function signAndVerifyOriginalBody(wallet: SigningWallet, draft: SigningDraft) {
  await assertDraftAccount(wallet, draft);
  const witnessHex = await wallet.signTx(draft.txHex, false);
  await assertDraftAccount(wallet, draft);
  const report = verifyOriginalBody(draft, witnessHex);
  // This fixture has no existing witnesses or auxiliary data; splice in the returned witness set.
  const signedTxHex = report.pass ? `84${draft.bodyHex}${witnessHex}f5f6` : undefined;
  return { ...report, witnessHex, signedTxHex };
}
