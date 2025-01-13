export const networks = [
  {
    name: 'Babylon Testnet',
    id: 'bbn-test-5',
    rest: 'https://babylon-testnet-api.nodes.guru',
    denom: 'ubbn',
  },
];

export default {
  enable: [
    {
      id: 'enable',
      name: 'enable',
      value: JSON.stringify('cosmoshub-4'),
    },
    {
      id: 'enable-multiple',
      name: 'enable multiple',
      value: JSON.stringify(['cosmoshub-4', 'juno-1', 'osmosis-1']),
    },
  ],
  signArbitrary: [
    {
      id: 'signArbitrary',
      name: 'signArbitrary',
      value: '010203',
    },
  ],
  signAmino: (fromAddress: string, toAddress: string, denom: string) => [
    {
      id: 'signAmino-msgSend',
      name: 'SignAmino MsgSend',
      value: JSON.stringify({
        fee: {
          amount: [{ amount: '1', denom: denom }],
          gas: '200000',
        },
        msgs: [
          {
            'type': 'cosmos-sdk/MsgSend',
            'value': {
              'from_address': fromAddress,
              'to_address': toAddress,
              'amount': [
                {
                  'amount': '1000',
                  'denom': denom,
                },
              ],
            },
          },
        ],
        'memo': '',
      }),
    },
    {
      id: 'signAmino-executeContract',
      name: 'SignAmino ExecuteContract',
      value: JSON.stringify({
        fee: {
          amount: [{ amount: '1', denom: denom }],
          gas: '200000',
        },
        msgs: [
          {
            'type': 'wasm/MsgExecuteContract',
            'value': {
              'from_address': fromAddress,
              'contract': 'cw1qyqxw2ep3r3jyly4k2jlyj3lq3jly4k2jlyj3lq',
              'msg': {
                transfer: {
                  recipient: toAddress,
                  amount: '1000',
                },
              },
              'funds': [],
            },
          },
        ],
        'memo': '',
      }),
    },
  ],
  signDirect: (fromAddress: string, toAddress: string, denom: string) => [
    {
      id: 'signDirect-msgSend',
      name: 'signDirect MsgSend',
      value: JSON.stringify({
        fee: {
          amount: [{ amount: '1', denom: denom }],
          gas: '200000',
        },
        msgs: [
          {
            'type': '/cosmos.bank.v1beta1.MsgSend',
            'value': {
              'from_address': fromAddress,
              'to_address': toAddress,
              'amount': [
                {
                  'amount': '1000',
                  'denom': denom,
                },
              ],
            },
          },
        ],
        'memo': '',
      }),
    },
    {
      id: 'signDirect-executeContract',
      name: 'signDirect ExecuteContract CwToken',
      value: JSON.stringify({
        fee: {
          amount: [{ amount: '1', denom: denom }],
          gas: '200000',
        },
        msgs: [
          {
            'type': '/cosmwasm.wasm.v1.MsgExecuteContract',
            'value': {
              'from_address': fromAddress,
              'contract': 'cw1qyqxw2ep3r3jyly4k2jlyj3lq3jly4k2jlyj3lq',
              'msg': {
                transfer: {
                  recipient: toAddress,
                  amount: '1000',
                },
              },
              'funds': [],
            },
          },
        ],
        'memo': '',
      }),
    },
  ],
};
