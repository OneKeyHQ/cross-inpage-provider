const chainIdInt = 1029;

export default {
  'requestPermissions': [
    {
      'id': 'cfx_accounts',
      'name': 'cfx_accounts',
      'description': '请求权限',
      'value': JSON.stringify({
        'cfx_accounts': {},
      }),
    },
    {
      'id': 'cfx_accounts and cfx_chainId',
      'name': 'cfx_accounts cfx_chainId',
      'description': '请求权限',
      'value': JSON.stringify({
        'cfx_accounts': {},
        'cfx_chainId': {},
      }),
    },
  ],
  'requestMothed': [
    {
      'id': 'request',
      'name': 'request',
      'description': 'request eth mothed',
      'value': JSON.stringify({
        'method': 'cfx_requestAccounts',
        'params': [],
      }),
    },
  ],
  addConfluxChain: [
    {
      id: 'wallet_addConfluxChain',
      name: 'Add Conflux Chain',
      description: 'Add Conflux Chain',
      value: JSON.stringify({
        chainId: '0x47',
        chainName: 'EVM Conflux',
        nativeCurrency: {
          name: 'Conflux',
          symbol: 'CFX',
          decimals: 18,
        },
        rpcUrls: ['https://evmtestnet.confluxrpc.com'],
        blockExplorerUrls: ['https://evmtestnet.confluxscan.io'],
      }),
    },
  ],
  switchConfluxChain: [
    {
      id: 'switchConfluxChain',
      name: 'Switch Conflux Chain',
      value: JSON.stringify({
        chainId: '0x1',
      }),
    },
  ],
  watchAsset: [
    {
      'id': 'watchAsset erc20',
      'name': '添加 ERC20 资产',
      'description': '添加 ERC20 资产',
      'value': JSON.stringify({
        type: 'ERC20',
        options: {
          address: 'cfxtest:acepe88unk7fvs18436178up33hb4zkuf62a9dk1gv',
          symbol: 'cUSDT',
          decimals: 18,
          image:
            'https://scan-icons.oss-cn-hongkong.aliyuncs.com/testnet/cfxtest%3Aacepe88unk7fvs18436178up33hb4zkuf62a9dk1gv.png',
        },
      }),
    },
  ],
  cfxSign: [
    {
      'id': 'eth_sign',
      'name': 'eth_sign',
      'description': 'eth_sign 有安全风险，硬件不支持',
      'value': '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    },
  ],
  personalSign: [
    {
      'id': 'personal_sign',
      'name': 'personal_sign',
      'description': 'personalSign',
      'value': 'personal sign message example',
    },
  ],
  signTypedDataV4: [
    {
      'id': 'signTypedDataV4',
      'name': 'signTypedDataV4',
      'description': 'signTypedDataV4',
      'value': JSON.stringify({
        domain: {
          chainId: chainIdInt.toString(),
          name: 'Ether Mail',
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
          version: '1',
        },
        message: {
          contents: 'Hello, Bob!',
          from: {
            name: 'Cow',
            wallets: [
              '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
              '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
            ],
          },
          to: [
            {
              name: 'Bob',
              wallets: [
                '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
                '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
                '0xB0B0b0b0b0b0B000000000000000000000000000',
              ],
            },
          ],
          attachment: '0x',
        },
        primaryType: 'Mail',
        types: {
          CIP23Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Group: [
            { name: 'name', type: 'string' },
            { name: 'members', type: 'Person[]' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person[]' },
            { name: 'contents', type: 'string' },
            { name: 'attachment', type: 'bytes' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallets', type: 'address[]' },
          ],
        },
      }),
    },
  ],
  sendTransaction: (from: string, to: string) => {
    return [
      {
        'id': 'sendTransaction',
        'name': 'sendTransaction',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: to,
          value: '0x1',
        }),
      },
      {
        'id': 'sendTransaction-eip1559',
        'name': 'sendTransaction EIP1559',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: to,
          value: '0x1',
        }),
      },
    ];
  },
};
