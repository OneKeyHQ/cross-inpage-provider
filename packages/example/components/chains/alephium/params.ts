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
            amount: '20000000',
          },
        ],
      }),
    },
    {
      id: 'signAndSubmitTransferTx-token',
      name: 'Token',
      value: JSON.stringify({
        signerAddress: from,
        destinations: [
          {
            address: to,
            amount: DUST_AMOUNT,
            tokens: [{ id: 'tokenId', amount: 10 }],
          },
        ],
      }),
    },
  ],
  signAndSubmitDeployContractTx: (from: string) => {
    return [
      {
        id: 'signAndSubmitDeployContractTx-native',
        name: 'Native with body',
        value: JSON.stringify({
          signerAddress: from,
          bytecode: '010203',
        }),
      },
    ];
  },
  signAndSubmitExecuteScriptTx: (from: string) => {
    return [
      {
        id: 'signAndSubmitExecuteScriptTx-native',
        name: 'Native with body',
        value: JSON.stringify({
          signerAddress: from,
          bytecode: '010203',
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
