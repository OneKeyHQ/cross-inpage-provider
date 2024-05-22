export const networks = [
  {
    name: 'Cosmos',
    id: 'cosmoshub-4',
    rest: 'https://lcd-cosmoshub.keplr.app',
    denom: 'uatom',
  },
  {
    name: 'Akash',
    id: 'akashnet-2',
    rest: 'https://lcd-akash.keplr.app',
    denom: 'uakt',
  },
  {
    name: 'Juno',
    id: 'juno-1',
    rest: 'https://lcd-juno.keplr.app',
    denom: 'ujuno',
  },
  {
    name: 'Crypto.org',
    id: 'crypto-org-chain-mainnet-1',
    rest: 'https://lcd-crypto-org.keplr.app',
    denom: 'basecro',
  },
  {
    name: 'Fetch.ai',
    id: 'fetchhub-4',
    rest: 'https://lcd-fetchhub.keplr.app',
    denom: 'afet',
  },
  {
    name: 'Osmosis',
    id: 'osmosis-1',
    rest: 'https://lcd-osmosis.keplr.app',
    denom: 'uosmo',
  },
  {
    name: 'Secret',
    id: 'secret-4',
    rest: 'https://lcd-secret.keplr.app',
    denom: 'uscrt',
  },
  {
    name: 'Celestia',
    id: 'celestia',
    rest: 'https://lcd-celestia.keplr.app',
    denom: 'utia',
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
