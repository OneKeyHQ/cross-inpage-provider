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
  sendBitcoin: (address: string) => [
    {
      id: 'sendBitcoin',
      name: 'SendBitcoin',
      value: JSON.stringify({
        toAddress: address,
        satoshis: 1000,
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
