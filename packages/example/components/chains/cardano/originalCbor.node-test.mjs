import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import test from 'node:test';
import { blake2b } from '@noble/hashes/blake2b';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { decode, encode } from 'cborg';
import nacl from 'tweetnacl';
import {
  createSigningDraft,
  signAndVerifyOriginalBody,
  verifyOriginalBody,
} from './originalCbor.ts';

const tags = [];
tags[258] = (value) => value;

function setup() {
  const keys = nacl.sign.keyPair.fromSeed(randomBytes(32));
  const address = new Uint8Array([0x61, ...blake2b(keys.publicKey, { dkLen: 28 })]);
  const changeAddress = bytesToHex(address);
  const input = (
    hash = '22'.repeat(32),
    index = 0,
    amount = BigInt(3000000),
    outputAddress = address,
  ) =>
    bytesToHex(
      encode([
        [hexToBytes(hash), index],
        [outputAddress, amount],
      ]),
    );
  const state = {
    address: changeAddress,
    networkId: 1,
    utxos: [input()],
    signCalls: 0,
    submitCalls: 0,
  };
  const makeWitness = (hash, signer = keys, tagged = true) => {
    const signature = nacl.sign.detached(hexToBytes(hash), signer.secretKey);
    return `a100${tagged ? 'd90102' : ''}${bytesToHex(encode([[signer.publicKey, signature]]))}`;
  };
  const wallet = {
    getUtxos: () => Promise.resolve(state.utxos),
    getChangeAddress: () => Promise.resolve(state.address),
    getNetworkId: () => Promise.resolve(state.networkId),
    signTx: (txHex, partialSign) => {
      state.signCalls += 1;
      assert.equal(partialSign, false);
      const body = hexToBytes(txHex.slice(2, -6));
      return Promise.resolve(makeWitness(bytesToHex(blake2b(body, { dkLen: 32 }))));
    },
    submitTx: () => {
      state.submitCalls += 1;
      throw new Error('Must never broadcast');
    },
  };
  return { wallet, state, input, makeWitness, changeAddress, address };
}

for (const taggedInputs of [false, true]) {
  for (const mapOutputs of [false, true]) {
    test(`real UTXO construction and signing: taggedInputs=${taggedInputs}, mapOutputs=${mapOutputs}`, async () => {
      const { wallet, state } = setup();
      const draft = await createSigningDraft(wallet, { taggedInputs, mapOutputs });
      const decoded = decode(hexToBytes(draft.bodyHex), { useMaps: true, tags });
      assert.equal(decoded.get(0).length, 1);
      assert.equal(decoded.get(1)[0] instanceof Map, mapOutputs);
      assert.equal(draft.bodyHex.startsWith('a300d90102'), taggedInputs);
      assert.equal(draft.txHex, `84${draft.bodyHex}a0f5f6`);
      assert.equal(draft.outputLovelace, '2800000');
      assert.equal(draft.feeLovelace, '200000');
      const report = await signAndVerifyOriginalBody(wallet, draft);
      assert.equal(report.pass, true);
      assert.equal(report.signedTxHex, `84${draft.bodyHex}${report.witnessHex}f5f6`);
      const signedTx = decode(hexToBytes(report.signedTxHex), { useMaps: true, tags });
      assert.equal(signedTx[1] instanceof Map, true);
      assert.equal(signedTx[2], true);
      assert.equal(signedTx[3], null);
      assert.equal(report.inputKeySigned, true);
      assert.equal(report.encodingChangesHash, !taggedInputs || mapOutputs);
      assert.equal(report.witnesses[0].validForReencoded, taggedInputs && !mapOutputs);
      assert.equal(state.signCalls, 1);
      assert.equal(state.submitCalls, 0);
    });
  }
}

test('detect the original regression: signature only verifies for the re-encoded hash', async () => {
  const { wallet, makeWitness } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  const report = verifyOriginalBody(draft, makeWitness(draft.reencodedHash));
  assert.equal(report.pass, false);
  assert.equal(report.witnesses[0].validForOriginal, false);
  assert.equal(report.witnesses[0].validForReencoded, true);
  wallet.signTx = () => Promise.resolve(makeWitness(draft.reencodedHash));
  const signed = await signAndVerifyOriginalBody(wallet, draft);
  assert.equal(signed.signedTxHex, undefined);
});

test('a valid signature from an unrelated key does not pass', async () => {
  const { wallet, makeWitness } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  const otherKeys = nacl.sign.keyPair.fromSeed(randomBytes(32));
  const report = verifyOriginalBody(draft, makeWitness(draft.originalHash, otherKeys));
  assert.equal(report.witnesses[0].validForOriginal, true);
  assert.equal(report.inputKeySigned, false);
  assert.equal(report.pass, false);
});

test('also accepts witnesses without a set tag and ignores cached original hash', async () => {
  const { wallet, makeWitness } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  const witness = makeWitness(draft.originalHash, undefined, false);
  const report = verifyOriginalBody({ ...draft, originalHash: '00'.repeat(32) }, witness);
  assert.equal(report.pass, true);
  assert.equal(report.originalHash, draft.originalHash);
});

test('rejects empty, malformed and full-transaction responses', async () => {
  const { wallet } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  assert.throws(() => verifyOriginalBody(draft, 'a0'), /没有支付密钥签名/);
  assert.throws(() => verifyOriginalBody(draft, draft.txHex), /应返回 witness set/);
  assert.throws(() => verifyOriginalBody(draft, 'xx'), /无效/);
  const invalidKey = bytesToHex(encode(new Map([[0, [[new Uint8Array(1), new Uint8Array(64)]]]])));
  assert.throws(() => verifyOriginalBody(draft, invalidKey), /长度/);
});

test('filters token, datum, script, wrong-network and small UTXOs; selection is deterministic', async () => {
  const { wallet, state, input, address } = setup();
  const token = bytesToHex(
    encode([
      [new Uint8Array(32), 0],
      [address, [BigInt(3000000), new Map()]],
    ]),
  );
  const datum = bytesToHex(
    encode([
      [new Uint8Array(32), 0],
      [address, BigInt(3000000), new Uint8Array(32)],
    ]),
  );
  const scriptAddress = new Uint8Array([0x71, ...randomBytes(28)]);
  const testnetAddress = new Uint8Array([0x60, ...address.slice(1)]);
  state.utxos = [
    token,
    datum,
    input(undefined, 0, BigInt(3000000), scriptAddress),
    input(undefined, 0, BigInt(3000000), testnetAddress),
    input(undefined, 0, BigInt(1999999)),
    input('33'.repeat(32)),
    input('22'.repeat(32)),
  ];
  const first = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  state.utxos.reverse();
  const second = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  assert.equal(first.txHex, second.txHex);
  assert.equal(first.input.txHash, '22'.repeat(32));
});

test('reports missing suitable UTXOs without requesting a signature', async () => {
  const { wallet, state } = setup();
  state.utxos = [];
  await assert.rejects(
    () => createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true }),
    /至少/,
  );
  assert.equal(state.signCalls, 0);
});

test('blocks stale account or network before requesting a signature', async () => {
  const { wallet, state } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  state.networkId = 0;
  await assert.rejects(() => signAndVerifyOriginalBody(wallet, draft), /账户或网络已变化/);
  assert.equal(state.signCalls, 0);
});

test('does not accept a signature if the account changes while confirmation is pending', async () => {
  const { wallet, state } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  const sign = wallet.signTx;
  wallet.signTx = (...args) => {
    state.address = `61${'ff'.repeat(28)}`;
    return sign(...args);
  };
  await assert.rejects(() => signAndVerifyOriginalBody(wallet, draft), /账户或网络已变化/);
  assert.equal(state.submitCalls, 0);
});

test('a cancelled request remains an error rather than a passing report', async () => {
  const { wallet } = setup();
  const draft = await createSigningDraft(wallet, { taggedInputs: false, mapOutputs: true });
  wallet.signTx = () => Promise.reject(new Error('User declined'));
  await assert.rejects(() => signAndVerifyOriginalBody(wallet, draft), /User declined/);
});
