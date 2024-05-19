const chainIdInt = 100;

export default {
  'signMessage': {
    'message': 'Hello World',
    'signature': '0x1',
  },
  'requestPermissions': [
    {
      'id': 'eth_accounts',
      'name': 'eth_accounts',
      'description': '请求权限',
      'value': JSON.stringify({
        'eth_accounts': {},
      }),
    },
    {
      'id': 'eth_accounts and eth_chainId',
      'name': 'eth_accounts eth_chainId',
      'description': '请求权限',
      'value': JSON.stringify({
        'eth_accounts': {},
        'eth_chainId': {},
      }),
    },
  ],
  revokePermissions: [
    {
      'id': 'revokePermissions',
      'name': 'revokePermissions',
      'description': '删除权限',
      'value': JSON.stringify({
        'eth_accounts': {},
      }),
    },
  ],
  addEthereumChain: [
    {
      'id': 'addEthereumChain_Gnosis',
      'name': 'addEthereumChain Gnosis',
      'description': '添加 Chain Gnosis',
      'value': JSON.stringify({
        'chainId': '0x64',
        'chainName': 'Gnosis',
        'rpcUrls': ['https://rpc.gnosischain.com'],
        'iconUrls': [
          'https://xdaichain.com/fake/example/url/xdai.svg',
          'https://xdaichain.com/fake/example/url/xdai.png',
        ],
        'nativeCurrency': {
          'name': 'XDAI',
          'symbol': 'XDAI',
          'decimals': 18,
        },
        'blockExplorerUrls': ['https://blockscout.com/poa/xdai/'],
      }),
    },
  ],
  switchEthereumChain: [
    {
      'id': 'switchEthereumChain_Gnosis',
      'name': 'switchEthereumChain Gnosis',
      'description': '切换 Chain Gnosis',
      'value': JSON.stringify({
        'chainId': '0x64',
      }),
    },
  ],
  ethSign: [
    {
      'id': 'eth_sign_1',
      'name': 'eth_sign 1',
      'description': 'eth_sign 有安全风险，硬件不支持',
      'value': '0x1',
    },
  ],
  personalSign: [
    {
      'id': 'eth_sign',
      'name': 'eth_sign',
      'description': 'personalSign',
      'value': '0x1',
    },
  ],
  signTypedData: [
    {
      'id': 'signTypedData',
      'name': 'signTypedData',
      'description': 'signTypedData',
      'value': JSON.stringify([
        {
          type: 'string',
          name: 'Message',
          value: 'Hi, Alice!',
        },
        {
          type: 'uint32',
          name: 'A number',
          value: '1337',
        },
      ]),
    },
  ],
  signTypedDataV3: [
    {
      'id': 'signTypedDataV3',
      'name': 'signTypedDataV3',
      'description': 'signTypedDataV3',
      'value': JSON.stringify({
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' },
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' },
          ],
        },
        primaryType: 'Mail',
        domain: {
          name: 'Ether Mail',
          version: '1',
          chainId: chainIdInt,
          verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
          from: {
            name: 'Cow',
            wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
          },
          to: {
            name: 'Bob',
            wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
          },
          contents: 'Hello, Bob!',
        },
      }),
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
          EIP712Domain: [
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
          value: '0x0',
          gasLimit: '0x5028',
          gasPrice: '0xbebc200',
        }),
      },
      {
        'id': 'sendTransaction-eip1559',
        'name': 'sendTransaction EIP1559',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: to,
          value: '0x0',
          gasLimit: '0x5028',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        }),
      },
    ];
  },
};
