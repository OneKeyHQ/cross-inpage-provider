export default {
  getStorage: [
    {
      id: 'getStorage',
      name: 'Get Storage',
      value: JSON.stringify({
        scriptHash: '006b26dd0d2aa076b11082847a094772450f05af',
        key: 'token0',
      }),
    },
  ],
  invokeRead: [
    {
      id: 'invokeRead GAS balance',
      name: 'invokeRead GAS balance',
      value: JSON.stringify({
        scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'balanceOf',
        args: [
          {
            type: 'Address',
            value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
          },
        ],
        signers: [
          {
            account: '2cab903ff032ac693f8514581665be534beac39f',
            scopes: 1,
          },
        ],
      }),
    },
  ],
  invokeReadMulti: [
    {
      id: 'invokeReadMulti',
      name: 'Invoke Read Multiple',
      value: JSON.stringify({
        invokeReadArgs: [
          {
            scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
            operation: 'balanceOf',
            args: [
              {
                type: 'Address',
                value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
              },
            ],
          },
          {
            scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
            operation: 'symbol',
            args: [],
          },
        ],
        signers: [
          {
            account: '2cab903ff032ac693f8514581665be534beac39f',
            scopes: 1,
          },
        ],
      }),
    },
  ],
  verifyMessage: [
    {
      id: 'verifyMessage',
      name: 'Verify Message',
      value: JSON.stringify({
        data: "b80f79abe2e471ca7211accce2e2ad36388a10754aa9dddeb0237d5c604ce9b613f6ae3cfd328a01fdccbad9f70abfc50caecd1e3656b1885e2b72d5bda9a5a6",
        message: "Hello world",
        publicKey: "02c6fcfe9e91155521414442d73a005f200c6f92cbc70f2c9085fd89b2a2534459"
      }),
    },
  ],
  verifyMessageV2: [
    {
      id: 'verifyMessageV2',
      name: 'Verify Message V2',
      value: JSON.stringify({
        data: "e376e3d593a18cac008af01e0919a41e9c3e29f546643d92e4e8db58ffa18f1cf1655be099ea707e4432bb82d78fe32fce83a153a5b605515c735b2ec8909cd8",
        message: "Hello world",
        publicKey: "02c6fcfe9e91155521414442d73a005f200c6f92cbc70f2c9085fd89b2a2534459"
      }),
    },
  ],
  getBlock: [
    {
      id: 'getBlock',
      name: 'Get Block',
      value: JSON.stringify({
        blockHeight: 1,
      }),
    },
  ],
  getTransaction: [
    {
      id: 'getTransaction',
      name: 'Get Transaction',
      value: JSON.stringify({
        txid: '0x7da6ae7ff9d0b7af3d32f3a2feb2aa96c2a27ef9d651b4f0c6e32cac65c12aa2',
      }),
    },
  ],
  getApplicationLog: [
    {
      id: 'getApplicationLog',
      name: 'Get Application Log',
      value: JSON.stringify({
        txid: '0x7da6ae7ff9d0b7af3d32f3a2feb2aa96c2a27ef9d651b4f0c6e32cac65c12aa2',
      }),
    },
  ],
  addressToScriptHash: [
    {
      id: 'addressToScriptHash',
      name: 'Address To ScriptHash',
      value: JSON.stringify({
        address: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
      }),
    },
  ],
  scriptHashToAddress: [
    {
      id: 'scriptHashToAddress',
      name: 'ScriptHash To Address',
      value: JSON.stringify({
        scriptHash: '2cab903ff032ac693f8514581665be534beac39f',
      }),
    },
  ],
  send: [
    {
      id: 'send',
      name: 'Send NEO',
      value: JSON.stringify({
        fromAddress: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
        toAddress: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
        asset: 'd2a4cff31913016155e38e474a2c06d08be276cf', // GAS
        amount: '0.00000001',
        fee: '0.0001',
      }),
    },
  ],
  invoke: [
    {
      id: 'invoke',
      name: 'Invoke Contract',
      value: JSON.stringify({
        scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'transfer',
        args: [
          {
            type: 'Address',
            value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
          },
          {
            type: 'Address',
            value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
          },
          {
            type: 'Integer',
            value: '1',
          },
          {
            type: 'String',
            value: '',
          },
        ],
        signers: [
          {
            account: '2cab903ff032ac693f8514581665be534beac39f',
            scopes: 1,
          },
        ],
      }),
    },
  ],
  invokeMultiple: [
    {
      id: 'invokeMultiple',
      name: 'Invoke Multiple',
      value: JSON.stringify({
        invokeArgs: [
          {
            scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
            operation: 'transfer',
            args: [
              {
                type: 'Address',
                value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
              },
              {
                type: 'Address',
                value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
              },
              {
                type: 'Integer',
                value: '1',
              },
              {
                type: 'String',
                value: '',
              },
            ],
          },
        ],
        signers: [
          {
            account: '2cab903ff032ac693f8514581665be534beac39f',
            scopes: 1,
          },
        ],
      }),
    },
  ],
  signMessage: [
    {
      id: 'signMessage',
      name: 'Sign Message',
      value: JSON.stringify({
        message: 'Hello OneKey NEO Wallet',
      }),
    },
  ],
  signMessageV2: [
    {
      id: 'signMessageV2',
      name: 'Sign Message V2',
      value: JSON.stringify({
        message: 'Hello OneKey NEO Wallet',
      }),
    },
  ],
  signMessageWithoutSalt: [
    {
      id: 'signMessageWithoutSalt',
      name: 'Sign Message Without Salt',
      value: JSON.stringify({
        message: 'Hello OneKey NEO Wallet',
      }),
    },
  ],
  signTransaction: [
    {
      id: 'signTransaction',
      name: 'Sign Transaction',
      value: JSON.stringify({
        transaction: {
          version: 0,
          nonce: 1234,
          sender: '2cab903ff032ac693f8514581665be534beac39f',
          systemFee: '0.0001',
          networkFee: '0.0001',
          validUntilBlock: 1000,
          attributes: [],
          script: 'abcdef1234567890',
          witnesses: [],
        },
      }),
    },
  ],
  switchWalletNetwork: [
    {
      id: 'switchNetwork N3 MainNet',
      name: 'switchNetwork N3 MainNet',
      value: JSON.stringify({
        chainId: 3,
      }),
    },
    {
      id: 'switchNetwork N3 TestNet',
      name: 'switchNetwork N3 TestNet',
      value: JSON.stringify({
        chainId: 6,
      }),
    },
    {
      id: 'switchNetwork Neo2 MainNet',
      name: 'switchNetwork Neo2 MainNet',
      value: JSON.stringify({
        chainId: 1,
      }),
    },
    {
      id: 'switchNetwork Neo2 TestNet',
      name: 'switchNetwork Neo2 TestNet',
      value: JSON.stringify({
        chainId: 2,
      }),
    },
    {
      id: 'switchNetwork N3 Private',
      name: 'switchNetwork N3 Private',
      value: JSON.stringify({
        chainId: 0,
      }),
    },
  ],
};
