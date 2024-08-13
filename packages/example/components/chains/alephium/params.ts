import { ONE_ALPH, DUST_AMOUNT } from '@alephium/web3'

export default {
  signAndSubmitTransferTx: (from: string, to: string) => [
    {
      id: 'signAndSubmitTransferTx-native',
      name: 'Native',
      value: JSON.stringify({
        signerAddress: from,
        destinations: [
          {
            address: to,
            amount: ONE_ALPH.toString(),
          },
        ],
      }),
    },
    {
      id: 'signAndSubmitTransferTx-token-638b022292ea665dc9c946eec02ef9602926dc0e6db17143baebce898e34a302',
      name: 'Token',
      value: JSON.stringify({
        signerAddress: from,
        destinations: [
          {
            address: to,
            amount: DUST_AMOUNT.toString(),
            tokens: [{ id: '638b022292ea665dc9c946eec02ef9602926dc0e6db17143baebce898e34a302', amount: '10' }],
          },
        ],
      }),
    },
  ],
  signAndSubmitDeployContractTx: (from: string) => {
    return [
      {
        id: 'signAndSubmitDeployContractTx-test',
        name: 'Deploy test contract',
        value: JSON.stringify({
          signerAddress: from,
          bytecode: '000117010100000004d362d46012b413c40de0b6b3a7640000a90000',
        }),
      },
    ];
  },
  signAndSubmitExecuteScriptTx: (from: string) => {
    return [
      {
        id: 'signAndSubmitExecuteScriptTx-call-test-contract',
        name: 'call test contract',
        value: JSON.stringify({
          signerAddress: from,
          bytecode: '01010300000007b413c40de0b6b3a7640000a20c0c1440206c3b1f6262ffad9a4cb1e78f03f17f3593837505a69edbc18a59cf23c1f1c4020100',
        }),
      },
    ];
  },
  signAndSubmitUnsignedTx: (from: string) => {
    return [
      {
        id: 'signAndSubmitUnsignedTx-native',
        name: 'Native with body',
        value: JSON.stringify({
          signerAddress: from,
          unsignedTx: '010203',
        }),
      },
    ];
  },
  signUnsignedTx: (from: string) => {
    return [
      {
        id: 'signUnsignedTx-native',
        name: 'Native with body',
        value: JSON.stringify({
          signerAddress: from,
          unsignedTx: '010203',
        }),
      },
    ];
  },
  signMessage: (from: string) => {
    return [
      {
        id: 'signMessage-default-alephium',
        name: 'Default with Alephium',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'alephium',
        }),
      },
      {
        id: 'signMessage-default-sha256',
        name: 'Default with Sha256',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'sha256',
        }),
      },
      {
        id: 'signMessage-default-blake2b',
        name: 'Default with Blake2b',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'blake2b',
        }),
      },
      {
        id: 'signMessage-default-identity',
        name: 'Default with Identity',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'identity',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-alephium',
        name: 'Bip340 Schnorr with Alephium',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'alephium',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-sha256',
        name: 'Bip340 Schnorr with Sha256',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'sha256',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-blake2b',
        name: 'Bip340 Schnorr with Blake2b',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'blake2b',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-identity',
        name: 'Bip340 Schnorr with Identity',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'identity',
        }),
      },
    ];
  },
};
