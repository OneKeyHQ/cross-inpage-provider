import { ONE_ALPH, DUST_AMOUNT } from '@alephium/web3';

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
      id: 'signAndSubmitTransferTx-token-722954d9067c5a5ad532746a024f2a9d7a18ed9b90e27d0a3a504962160b5600',
      name: 'Token-USDC-MAIN',
      value: JSON.stringify({
        signerAddress: from,
        destinations: [
          {
            address: to,
            amount: DUST_AMOUNT.toString(),
            tokens: [
              {
                id: '722954d9067c5a5ad532746a024f2a9d7a18ed9b90e27d0a3a504962160b5600',
                amount: '10',
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'signAndSubmitTransferTx-token-556d9582463fe44fbd108aedc9f409f69086dc78d994b88ea6c9e65f8bf98e00',
      name: 'Token-USDT-MAIN',
      value: JSON.stringify({
        signerAddress: from,
        destinations: [
          {
            address: to,
            amount: DUST_AMOUNT.toString(),
            tokens: [
              {
                id: '556d9582463fe44fbd108aedc9f409f69086dc78d994b88ea6c9e65f8bf98e00',
                amount: '10',
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'signAndSubmitTransferTx-Multiple-Native-and-Token-USDT-MAIN',
      name: 'Multiple Native andToken-USDT-MAIN',
      value: JSON.stringify({
        signerAddress: from,
        destinations: [
          {
            address: to,
            amount: DUST_AMOUNT.toString(),
            tokens: [
              {
                id: '556d9582463fe44fbd108aedc9f409f69086dc78d994b88ea6c9e65f8bf98e00',
                amount: '10',
              },
            ],
          },
          {
            address: to,
            amount: ONE_ALPH.toString(),
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
        description: 'Deploy test contract 最少需要 0.1 ALPH',
        value: JSON.stringify({
          signerAddress: from,
          bytecode: '000110010001010105d3eb23039a16000e2c020000',
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
          bytecode:
            '0101030001000d13020d0d144020c3fb9f552e7ab1138023ef0e313cf43483fc7fa35f2bbadc3f997ab17e52a10001001700160013020e2c2f0c7b',
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
        name: 'Default with Sha256（硬件不支持）',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'sha256',
        }),
      },
      {
        id: 'signMessage-default-blake2b',
        name: 'Default with Blake2b（硬件不支持）',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'blake2b',
        }),
      },
      {
        id: 'signMessage-default-identity',
        name: 'Default with Identity（硬件不支持）',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'default',
          message: '010203',
          messageHasher: 'identity',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-alephium',
        name: 'Bip340 Schnorr with Alephium（不支持）',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'alephium',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-sha256',
        name: 'Bip340 Schnorr with Sha256（不支持）',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'sha256',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-blake2b',
        name: 'Bip340 Schnorr with Blake2b（不支持）',
        value: JSON.stringify({
          signerAddress: from,
          signerKeyType: 'bip340-schnorr',
          message: '010203',
          messageHasher: 'blake2b',
        }),
      },
      {
        id: 'signMessage-bip340-schnorr-identity',
        name: 'Bip340 Schnorr with Identity（不支持）',
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
