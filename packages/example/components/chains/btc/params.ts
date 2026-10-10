export default {
  switchNetwork: [
    {
      id: 'switchNetwork livenet',
      name: 'switchNetwork livenet',
      value: 'livenet',
    },
    {
      id: 'switchNetwork testnet',
      name: 'switchNetwork testnet',
      value: 'testnet',
    },
  ],
  switchChain: [
    {
      id: 'Bitcoin Mainnet',
      name: 'Bitcoin Mainnet',
      value: 'BITCOIN_MAINNET',
    },
    {
      id: 'Bitcoin Testnet',
      name: 'Bitcoin Testnet',
      value: 'BITCOIN_TESTNET',
    },
    {
      id: 'Bitcoin Testnet4 (Beta)',
      name: '(不支持) Bitcoin Testnet4 (Beta)',
      value: 'BITCOIN_TESTNET4',
    },
    {
      id: 'Bitcoin Signet',
      name: 'Bitcoin Signet',
      value: 'BITCOIN_SIGNET',
    },
    {
      id: 'Fractal Bitcoin Mainnet',
      name: '(不支持) Fractal Bitcoin Mainnet',
      value: 'FRACTAL_BITCOIN_MAINNET',
    },
    {
      id: 'Fractal Bitcoin Testnet',
      name: '(不支持) Fractal Bitcoin Testnet',
      value: 'FRACTAL_BITCOIN_TESTNET',
    },
  ],
  getBitcoinUtxos: [
    {
      id: 'getBitcoinUtxos-no-params',
      name: 'getBitcoinUtxos (no params)',
      value: JSON.stringify({}),
    },
    {
      id: 'getBitcoinUtxos',
      name: 'getBitcoinUtxos (first 20)',
      value: JSON.stringify({
        cursor: 0,
        size: 20,
      }),
    },
  ],
  signMessage: [
    {
      id: 'signMessage ecdsa default',
      name: 'SignMessage ECDSA Default',
      value: JSON.stringify({
        msg: 'Hello World',
      }),
    },
    {
      id: 'signMessage ecdsa',
      name: 'SignMessage ECDSA',
      value: JSON.stringify({
        msg: 'abcdefghijk123456789',
        type: 'ecdsa',
      }),
    },
    {
      id: 'signMessage bip322-simple',
      name: 'SignMessage Bip322-Simple',
      value: JSON.stringify({
        msg: 'hello onekey!',
        type: 'bip322-simple',
      }),
    },
  ],
  deriveContextHash: [
    {
      id: 'deriveContextHash',
      name: 'Valid context',
      description: 'Approve to receive a 64-character lowercase hex secret. Use a test wallet.',
      value: JSON.stringify({
        appName: 'test-app',
        context: 'deadbeef',
      }),
    },
    {
      id: 'deriveContextHash-minimum',
      name: 'Valid minimum lengths',
      description: 'A 1-byte appName and 1-byte context must succeed after approval.',
      value: JSON.stringify({ appName: 'a', context: '00' }),
    },
    {
      id: 'deriveContextHash-maximum',
      name: 'Valid maximum lengths',
      description: 'A 64-byte appName and 1024-byte context must succeed after approval.',
      value: JSON.stringify({ appName: 'a'.repeat(64), context: 'ab'.repeat(1024) }),
    },
    {
      id: 'deriveContextHash-empty-context',
      name: 'Invalid: empty context',
      description: 'Expect -32602 before approval or a device call: context must not be empty.',
      value: JSON.stringify({ appName: 'test-app', context: '' }),
    },
    {
      id: 'deriveContextHash-odd-context',
      name: 'Invalid: odd-length context',
      description: 'Expect -32602 before approval or a device call: hex must have even length.',
      value: JSON.stringify({ appName: 'test-app', context: 'abc' }),
    },
    {
      id: 'deriveContextHash-prefixed-context',
      name: 'Invalid: 0x-prefixed context',
      description: 'Expect -32602 before approval or a device call: no 0x prefix is allowed.',
      value: JSON.stringify({ appName: 'test-app', context: '0xdeadbeef' }),
    },
    {
      id: 'deriveContextHash-uppercase-context',
      name: 'Invalid: uppercase context',
      description: 'Expect -32602 before approval or a device call: hex must be lowercase.',
      value: JSON.stringify({ appName: 'test-app', context: 'DEADBEEF' }),
    },
    {
      id: 'deriveContextHash-non-hex-context',
      name: 'Invalid: non-hex context',
      description: 'Expect -32602 before approval or a device call: context must be hex.',
      value: JSON.stringify({ appName: 'test-app', context: 'gg' }),
    },
    {
      id: 'deriveContextHash-oversized-context',
      name: 'Invalid: 1025-byte context',
      description: 'Expect -32602 before approval or a device call: context exceeds 1024 bytes.',
      value: JSON.stringify({ appName: 'test-app', context: 'ab'.repeat(1025) }),
    },
    {
      id: 'deriveContextHash-empty-app-name',
      name: 'Invalid: empty appName',
      description: 'Expect -32602 before approval or a device call: appName must not be empty.',
      value: JSON.stringify({ appName: '', context: 'deadbeef' }),
    },
    {
      id: 'deriveContextHash-invalid-app-name',
      name: 'Invalid: appName characters',
      description: 'Expect -32602 before approval or a device call: appName allows only [a-z0-9-].',
      value: JSON.stringify({ appName: 'Test_App', context: 'deadbeef' }),
    },
    {
      id: 'deriveContextHash-oversized-app-name',
      name: 'Invalid: 65-byte appName',
      description: 'Expect -32602 before approval or a device call: appName exceeds 64 bytes.',
      value: JSON.stringify({ appName: 'a'.repeat(65), context: 'deadbeef' }),
    },
  ],
  sendBitcoin: (address: string) => [
    {
      id: 'sendBitcoin',
      name: 'SendBitcoin',
      value: JSON.stringify({
        toAddress: address,
        satoshis: 1000,
      }),
    },
    {
      id: 'sendBitcoin-with-memo',
      name: 'SendBitcoin with memo',
      value: JSON.stringify({
        toAddress: address,
        satoshis: 1000,
        options: {
          memo: 'Hello OneKey',
        },
      }),
    },
  ],
  pushTx: [
    {
      id: 'pushTx',
      name: 'PushTx',
      value:
        '02000000000101ed7f3b53b6bfd3b9e72c794ff95549ea774f017e6e62b0ca735ded29dc8dbc7e0000000000fdffffff02f26a000000000000225120145ddbafe27a50b48ff2321ae186132971b44a6757879ad35739e152d009c0f30000000000000000096a5d0614c0a233144101408928d42444aba4eb0edfb578a14dbc848d5a7354ee66d3cb170511d169e3dfcff3a5f326d01c0227acc6edd5d56c943215eea72e128b28d705da8482b18d9a6500000000',
    },
  ],
  signPsbt: [
    {
      id: 'signPsbt',
      name: 'signPsbt',
      value: JSON.stringify({
        psbtHex: '020000000',
        options: {
          autoFinalized: false,
          toSignInputs: [
            {
              index: 0,
              address: 'tb1q8h8....mjxzny',
            },
            {
              index: 1,
              publicKey: 'tb1q8h8....mjxzny',
              sighashTypes: [1],
            },
            {
              index: 2,
              publicKey: '02062...8779693f',
            },
          ],
        },
      }),
    },
  ],
  signPsbts: [
    {
      id: 'signPsbts',
      name: 'signPsbts',
      value: JSON.stringify({
        psbtHexs: ['020000000', '020000000'],
        options: [
          {
            autoFinalized: false,
            toSignInputs: [
              {
                index: 0,
                address: 'tb1q8h8....mjxzny',
              },
              {
                index: 1,
                publicKey: 'tb1q8h8....mjxzny',
                sighashTypes: [1],
              },
              {
                index: 2,
                publicKey: '02062...8779693f',
              },
            ],
          },
          {
            autoFinalized: false,
            toSignInputs: [
              {
                index: 0,
                address: 'tb1q8h8....mjxzny',
              },
              {
                index: 1,
                publicKey: 'tb1q8h8....mjxzny',
                sighashTypes: [1],
              },
              {
                index: 2,
                publicKey: '02062...8779693f',
              },
            ],
          },
        ],
      }),
    },
  ],
  pushPsbt: [
    {
      id: 'signPsbts',
      name: 'signPsbts',
      value: '020000000',
    },
  ],
};
