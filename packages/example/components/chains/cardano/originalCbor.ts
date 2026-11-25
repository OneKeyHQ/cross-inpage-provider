import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { C } from 'lucid-cardano';
import type { WalletApi } from 'lucid-cardano';

type SigningWallet = Pick<WalletApi, 'getUtxos' | 'getChangeAddress' | 'signTx'>;
export type SigningDraft = {
  txHex: string;
  bodyHex: string;
  originalHash: string;
  reencodedHash: string;
  paymentKeyHash: string;
  changeAddress: string;
};

const bodyHash = (body: string) => bytesToHex(C.hash_blake2b256(hexToBytes(body)));

export async function createSigningDraft(
  wallet: SigningWallet,
  encoding: string,
): Promise<SigningDraft> {
  const [utxos, changeAddress] = await Promise.all([
    wallet.getUtxos(),
    wallet.getChangeAddress(),
  ]);
  const minimum = C.BigNum.from_str('2000000');
  const utxo = (utxos ?? [])
    .map(hex => C.TransactionUnspentOutput.from_bytes(hexToBytes(hex)))
    .find(item => {
      const output = item.output();
      return !output.amount().multiasset() && !output.datum() && !output.script_ref() &&
        [0, 2, 4, 6].includes(output.address().to_bytes()[0] >> 4) &&
        output.amount().coin().compare(minimum) >= 0;
    });
  if (!utxo) throw new Error('需要至少一个不含代币、datum 或脚本的纯 ADA UTXO，金额至少 2 ADA');

  const fee = C.BigNum.from_str('200000');
  const amount = bytesToHex(utxo.output().amount().coin().checked_sub(fee).to_bytes());
  const input = bytesToHex(utxo.input().to_bytes());
  const addressBytes = hexToBytes(changeAddress);
  const addressHeader = C.BigNum.from_str(String(addressBytes.length)).to_bytes();
  // Reuse the CBOR length header with the byte-string major type.
  addressHeader[0] |= 0x40;
  const address = bytesToHex(addressHeader) + changeAddress;
  const encodeBody = (tagged: boolean, map: boolean) => {
    const output = map ? `a200${address}01${amount}` : `82${address}${amount}`;
    // Build the raw body directly; a transaction round trip may change its encoding.
    return `a300${tagged ? 'd90102' : ''}81${input}0181${output}02${bytesToHex(fee.to_bytes())}`;
  };
  const bodyHex = encodeBody(encoding.startsWith('tagged'), encoding.endsWith('map'));
  return {
    txHex: `84${bodyHex}a0f5f6`,
    bodyHex,
    originalHash: bodyHash(bodyHex),
    reencodedHash: bodyHash(encodeBody(true, false)),
    paymentKeyHash: bytesToHex(utxo.output().address().to_bytes().slice(1, 29)),
    changeAddress,
  };
}

export async function signAndVerifyOriginalBody(wallet: SigningWallet, draft: SigningDraft) {
  if ((await wallet.getChangeAddress()).toLowerCase() !== draft.changeAddress.toLowerCase()) {
    throw new Error('账户已变化，请重新生成请求');
  }
  const witnessHex = await wallet.signTx(draft.txHex, false);
  // Older Lucid cannot read tagged vkey sets. Strip only that container tag, never body bytes.
  const untaggedWitness = witnessHex.replace(/^(a[1-9a-f]00)d90102/i, '$1');
  const vkeys = C.TransactionWitnessSet.from_bytes(hexToBytes(untaggedWitness)).vkeys();
  const originalHash = bodyHash(draft.bodyHex);
  const witnesses = Array.from({ length: vkeys?.len() ?? 0 }, (_, index) => {
    const witness = vkeys.get(index);
    const publicKey = witness.vkey().public_key();
    return {
      paymentKeyHash: bytesToHex(publicKey.hash().to_bytes()),
      validForOriginal: publicKey.verify(hexToBytes(originalHash), witness.signature()),
      validForReencoded: publicKey.verify(hexToBytes(draft.reencodedHash), witness.signature()),
    };
  });
  const pass = witnesses.some(w => w.paymentKeyHash === draft.paymentKeyHash && w.validForOriginal) &&
    witnesses.every(w => w.validForOriginal);
  return {
    status: pass ? 'PASS' : 'FAIL',
    originalHash,
    reencodedHash: draft.reencodedHash,
    witnesses,
    witnessHex,
    signedTxHex: pass ? `84${draft.bodyHex}${witnessHex}f5f6` : undefined,
  };
}
