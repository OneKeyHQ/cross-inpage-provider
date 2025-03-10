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
  getBlock: [
    {
      id: 'getBlock',
      name: 'Get Block',
      value: JSON.stringify({
        blockHeight: 190,
      }),
    },
  ],
  getTransaction: [
    {
      id: 'getTransaction',
      name: 'Get Transaction',
      value: JSON.stringify({
        txid: '0xf48cf9d9b6fc56c69ebda248fd611c1fb529f98e5a9735ca7c10d3ac0099b06d',
      }),
    },
  ],
  getApplicationLog: [
    {
      id: 'getApplicationLog',
      name: 'Get Application Log',
      value: JSON.stringify({
        txid: '0xf48cf9d9b6fc56c69ebda248fd611c1fb529f98e5a9735ca7c10d3ac0099b06d',
      }),
    },
  ],
  addressToScriptHash: [
    {
      id: 'addressToScriptHash',
      name: 'Address To ScriptHash',
      value: JSON.stringify({
        address: 'NQUN2zkzwpypEi6kvGYexy8cQKN2ycyJjF',
      }),
    },
  ],
  scriptHashToAddress: [
    {
      id: 'scriptHashToAddress',
      name: 'ScriptHash To Address',
      value: JSON.stringify({
        scriptHash: 'f0a33d62f32528c25e68951286f238ad24e30032',
      }),
    },
  ],
  send: [
    {
      id: 'send',
      name: 'Send NEO',
      value: (address: string) => JSON.stringify({
        fromAddress: address || '',
        toAddress: 'NNvDHVMwJhhGK5muXDXWGgFUCoGKGmV64x',
        asset: 'GAS',
        amount: '0.00001',
        broadcastOverride: false
      })
    },
  ],
  invoke: [
    {
      id: 'invoke',
      name: 'Invoke Contract',
      value: JSON.stringify({
        scriptHash: '0x1415ab3b409a95555b77bc4ab6a7d9d7be0eddbd',
        operation: 'transfer',
        args: [
            {
                type: "Address",
                value: "NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq",
            },
            {
                type: "Address",
                value: "NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq",
            },
            {
                type: "Integer",
                value: "1",
            },
            {
                type: "Any",
                value: null,
            }
        ],
        fee: '0.0001',
        broadcastOverride: false,
        signers: [
            {
                account: "2cab903ff032ac693f8514581665be534beac39f",
                scopes: 16,
                allowedContracts: ["0x1415ab3b409a95555b77bc4ab6a7d9d7be0eddbd", "0xef4073a0f2b305a38ec4050e4d3d28bc40ea63f5"],
                allowedGroups: []
            }
        ]
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
                scriptHash: "ef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
                operation: "transfer",
                args: [
                    {
                        type: "Address",
                        value: "NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq",
                    },
                    {
                        type: "Address",
                        value: "NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq",
                    },
                    {
                        type: "Integer",
                        value: "1",
                    },
                    {
                        type: "Any",
                        value: null
                    }
                ]
            },
            {
                scriptHash: "ef4073a0f2b305a38ec4050e4d3d28bc40ea63f5",
                operation: "transfer",
                args: [
                    {
                        type: "Address",
                        value: "NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq",
                    },
                    {
                        type: "Address",
                        value: "NPsCvedTnzGcwSYuoxjh7Sec5Zem2vgVmX",
                    },
                    {
                        type: "Integer",
                        value: "1",
                    },
                    {
                        type: "Any",
                        value: null
                    }
                ]
            }
        ],
        fee: '0.001',
        broadcastOverride: true,
        signers: [
            {
                account: "2cab903ff032ac693f8514581665be534beac39f",
                scopes: 1
            }
        ]
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
  signMessageWithoutSaltV2: [
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
