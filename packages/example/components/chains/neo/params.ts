export default {
  switchNetwork: [
    {
      id: 'switchNetwork MainNet',
      name: 'switchNetwork MainNet',
      value: 'MainNet',
    },
    {
      id: 'switchNetwork TestNet',
      name: 'switchNetwork TestNet',
      value: 'TestNet',
    },
  ],
  getBalance: [
    {
      id: 'getBalance',
      name: 'Get GAS Balance',
      value: JSON.stringify({
        params: [
          {
            address: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
            contracts: ['d2a4cff31913016155e38e474a2c06d08be276cf'], // GAS contract
          },
        ],
      }),
    },
  ],
  getStorage: [
    {
      id: 'getStorage',
      name: 'Get Storage',
      value: JSON.stringify({
        scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
        key: '746f74616c537570706c79', // totalSupply in hex
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
  verifyMessage: [
    {
      id: 'verifyMessage',
      name: 'Verify Message',
      value: JSON.stringify({
        message: 'Hello OneKey NEO Wallet',
        data: 'abcdef1234567890', // Example signature
        publicKey: '0271d28f45de9f8d3c476f8ffe6c34b3a4ff74b51a78137c4afe22cb22ca39d8c4', // Example public key
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
      id: 'switchWalletNetwork',
      name: 'Switch Wallet Network',
      value: JSON.stringify({
        chainId: 1,
      }),
    },
  ],
};
