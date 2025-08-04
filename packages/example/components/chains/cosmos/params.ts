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
    name: 'Terra',
    id: 'columbus-5',
    rest: 'https://terra-classic-lcd.publicnode.com',
    denom: 'uluna',
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
  signDirect_simple: (fromAddress: string, toAddress: string, denom: string) => [
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
  signDirect: (fromAddress: string, toAddress: string, denom: string) => [
    {
      id: 'signDirect-msgSend',
      name: 'signDirect MsgSend',
      value: JSON.stringify({
        'chainId': 'bbn-test-5',
        'signer': 'bbn1uxd7fqht3qgeg80g20q0hfv0cqh4rcqpwgmkvq',
        'signDoc': {
          'bodyBytes':
            '0ae6060a2d2f626162796c6f6e2e6274637374616b696e672e76312e4d736743726561746542544344656c65676174696f6e12b4060a2a62626e31757864376671687433716765673830673230713068667630637168347263717077676d6b7671124508021241200110c948b9c573cc2499265b5e99e748cc32fd9a5ee17d3cf02365eef4b1fa964915c0193ba04f75a10f0b0d1afea76f6e7f378972be17d3bd7cfb2a7259201d1a20ead5c9942bc49655fc2234c55e9a61468bcd4ce599922a6bedf0eb3e5b9ee5322220d23c2c25e1fcf8fd1c21b9a402c19e2e309e531e45e92fb1e9805b6056b0cc762880f40330d086033a89010200000001a4876046ff402b8950373fed5952c6c14b88db57333d4a8e92be42a1b1e7fdba0100000000ffffffff0250c3000000000000225120700088b1166fa4c1a5e05a7677517eac01004f4343072fbff7b8d2dec576dc59c415880000000000225120773bdb0b0f631d71ae90465cb233b1c8285f327500516fb4072bfa8ddb3dd754000000004a7d0200000001dcb9294f16b86260a5833129d552faa3e75052d68a912bc7f8156bb74f5f281a0000000000ffffffff02c4090000000000001600145be12624d08a2b424095d7c07221c33450d14bf104a600000000000022512018fb8361aeff975f8b4a817c6b3050c7ee68d0d131991eae62a54b422577fc06000000005240fb9796c2433fb93ef2311b858bd792d3794b926d407e9088c737cef2ac32e890a594cc7f34fc2ea434226b72fbf6ecd4b48505039666159d195ab8f21fa525f958f007625e0200000001dcb9294f16b86260a5833129d552faa3e75052d68a912bc7f8156bb74f5f281a0000000000ffffffff0180bb00000000000022512041ce3c9f53d216681fc36d9d7e015076e1b0483bb8a5e557064205ece8dea368000000006880f702727d0200000001b4dfba7b6bf26c1ed08c8a4fd20f76001cac84226b92068834560711573c5dac0000000000ffffffff0260090000000000001600145be12624d08a2b424095d7c07221c33450d14bf1989e00000000000022512018fb8361aeff975f8b4a817c6b3050c7ee68d0d131991eae62a54b422577fc06000000007a4025917df4988fae03729bb92232749e84e3dbf87e6914726468b4efbcc59b6580984077e86a806cb24cefbe42ac89696558e83f81021ad6824c4e57bbec5f26d6',
          'authInfoBytes':
            '0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21038563d76bd72b9f140992e4f6ac7248e95ab19552fcef8f5492e33ba3172b210912040a020801180312130a0d0a047562626e1205313234343310c1bf6c',
          'chainId': 'bbn-test-5',
          'accountNumber': '0',
        },
      }),
    },
  ],
};
