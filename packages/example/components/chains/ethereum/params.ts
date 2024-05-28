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
      'id': 'addEthereumChain_Sepolia',
      'name': 'Add Sepolia Test Chain',
      'description': '添加 Sepolia Chain',
      'value': JSON.stringify({
        'chainId': '0xaa36a7',
        'chainName': 'Sepolia TestNet',
        'rpcUrls': ['https://rpc.sepolia.org', 'https://1rpc.io/sepolia'],
        'iconUrls': ['https://chainlist.org/unknown-logo.png'],
        'nativeCurrency': {
          'name': 'TETH',
          'symbol': 'TETH',
          'decimals': 18,
        },
        'blockExplorerUrls': ['https://sepolia.etherscan.io/'],
      }),
    },
    {
      'id': 'addEthereumChain_Gnosis',
      'name': 'Add Gnosis Chain',
      'description': '添加 Gnosis Chain',
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
      'id': 'switchEthereumChain_sepolia',
      'name': 'Switch Sepolia Test Chain',
      'description': '切换 Sepolia Chain',
      'value': JSON.stringify({
        'chainId': '0xaa36a7',
      }),
    },
    {
      'id': 'switchEthereumChain_Gnosis',
      'name': 'Switch Gnosis Chain',
      'description': '切换 Gnosis Chain',
      'value': JSON.stringify({
        'chainId': '0x64',
      }),
    },
  ],
  watchAsset: [
    {
      'id': 'watchAsset erc20',
      'name': '添加 ERC20 资产',
      'description': '添加 ERC20 资产',
      'value': JSON.stringify({
        'type': 'ERC20',
        'options': {
          'address': '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
          'symbol': 'FOO',
          'decimals': 18,
          'image': 'https://foo.io/token-image.svg',
        },
      }),
    },
    {
      'id': 'watchAsset ERC721',
      'name': '添加 ERC721 资产',
      'description': '暂时不支持',
      'value': JSON.stringify({
        'type': 'ERC721',
        'options': {
          'address': '0x123456789abcdef0123456789abcdef01234567',
          'tokenId': '42',
        },
      }),
    },
    {
      'id': 'watchAsset ERC1155',
      'name': '资产 ERC1155 资产',
      'description': '暂时不支持',
      'value': JSON.stringify({
        'type': 'ERC1155',
        'options': {
          'address': '0xabcdef0123456789abcdef0123456789abcdef01',
          'tokenId': '1337',
        },
      }),
    },
  ],
  ethSign: [
    {
      'id': 'eth_sign_1',
      'name': 'eth_sign 1',
      'description': 'eth_sign 有安全风险，硬件不支持',
      'value': '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0',
    },
  ],
  ethDecrypt: [
    {
      'id': 'ethDecrypt',
      'name': 'ethDecrypt 1',
      'description': 'ethDecrypt',
      'value': '0x01',
    },
  ],
  personalSign: [
    {
      'id': 'eth_sign',
      'name': 'eth_sign',
      'description': 'personalSign',
      'value': '0x01',
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
  signTypedDataV3: (chainId: number) => [
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
          chainId: chainId,
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
  signTypedDataV4: (chainId: number) => [
    {
      'id': 'signTypedDataV4',
      'name': 'signTypedDataV4',
      'description': 'SignTypedDataV4 Normal',
      'value': JSON.stringify({
        domain: {
          chainId: chainId.toString(),
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
    {
      'id': 'signTypedDataV4-bigdata',
      'name': 'signTypedDataV4 BigData',
      'description': 'SignTypedDataV4 BigData',
      'value': JSON.stringify({
        'domain': {
          'name': 'Franklin',
          'version': '0.0.1',
          'chainId': chainId,
          'verifyingContract': '0x0000000000000000000000000000000000000000',
        },
        'primaryType': 'ForwardRequest',
        'types': {
          'EIP712Domain': [
            {
              'name': 'name',
              'type': 'string',
            },
            {
              'name': 'version',
              'type': 'string',
            },
            {
              'name': 'chainId',
              'type': 'uint256',
            },
            {
              'name': 'verifyingContract',
              'type': 'address',
            },
          ],
          'ForwardRequest': [
            {
              'name': 'from',
              'type': 'address',
            },
            {
              'name': 'to',
              'type': 'address',
            },
            {
              'name': 'value',
              'type': 'uint256',
            },
            {
              'name': 'gas',
              'type': 'uint256',
            },
            {
              'name': 'nonce',
              'type': 'uint256',
            },
            {
              'name': 'data',
              'type': 'bytes',
            },
          ],
          'VerifyWallet': [
            {
              'name': 'contents',
              'type': 'string',
            },
          ],
        },
        'message': {
          'from': '0x0000000000000000000000000000000000000000',
          'to': '0x0000000000000000000000000000000000000000',
          'value': 0,
          'gas': 275755,
          'nonce': 3,
          'data': `0x${'01'.repeat(3150)}`,
        },
      }),
    },
    {
      'id': 'signTypedDataV4-Nested-array',
      'name': 'signTypedDataV4 Nested Array',
      'description': 'SignTypedDataV4 Nested Array',
      'value': JSON.stringify({
        'types': {
          'EIP712Domain': [
            {
              'name': 'name',
              'type': 'string',
            },
          ],
          'NestedArray': [
            {
              'name': 'items',
              'type': 'SingleItem[2]',
            },
          ],
          'SingleItem': [
            {
              'name': 'id',
              'type': 'uint256',
            },
            {
              'name': 'value',
              'type': 'string',
            },
          ],
        },
        'primaryType': 'NestedArray',
        'domain': {
          'name': 'NestedArrayTest',
        },
        'message': {
          'nestedItems': [
            [
              {
                'items': [
                  {
                    'id': 1,
                    'value': 'Item1-1',
                  },
                  {
                    'id': 2,
                    'value': 'Item1-2',
                  },
                ],
              },
              {
                'items': [
                  {
                    'id': 3,
                    'value': 'Item2-1',
                  },
                  {
                    'id': 4,
                    'value': 'Item2-2',
                  },
                ],
              },
            ],
            [
              {
                'items': [
                  {
                    'id': 5,
                    'value': 'Item3-1',
                  },
                  {
                    'id': 6,
                    'value': 'Item3-2',
                  },
                ],
              },
              {
                'items': [
                  {
                    'id': 7,
                    'value': 'Item4-1',
                  },
                  {
                    'id': 8,
                    'value': 'Item4-2',
                  },
                ],
              },
            ],
          ],
        },
      }),
    },
  ],
  sendTransaction: (from: string, to: string) => {
    return [
      {
        'id': 'sendTransaction',
        'name': 'SendTransaction',
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
        'id': 'sendTransaction-nogas',
        'name': 'SendTransaction No Gas',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: to,
          value: '0x0',
        }),
      },
      {
        'id': 'sendTransaction-eip1559',
        'name': 'SendTransaction EIP1559',
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
      {
        'id': 'sendTransaction-eip1559-nogas',
        'name': 'SendTransaction EIP1559 No Gas',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: to,
          value: '0x0',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        }),
      },
      {
        'id': 'sendTransaction-eip1559-bigdata',
        'name': 'SendTransaction EIP1559 BigData',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: to,
          value: '0x0',
          'data': `0x${'01'.repeat(3150)}`,
          gasLimit: '0x5028',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        }),
      },
      {
        'id': 'sendERC20',
        'name': 'Send ERC20',
        'description': '发送 ERC20 USDC Token',
        'value': JSON.stringify({
          from: from,
          to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          data: `0xa9059cbb${to.substring(2).padStart(64, '0')}${BigInt(1000)
            .toString(16)
            .padStart(64, '0')}`, // Assumes amount is a decimal string
          value: '0x0',
          gasLimit: '0x186a0', // 100000 in hexadecimal
          gasPrice: '0xbebc200', // example gas price
        }),
      },
      {
        'id': 'approveERC20',
        'name': 'Approve ERC20',
        'description': '授权合约使用 USDC',
        'value': JSON.stringify({
          from: from,
          to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          data: `0x095ea7b3${'0x3b95bc951ee0f553ba487327278cac44f29715e5' // spender address
            .substring(2)
            .padStart(64, '0')}${BigInt(1000).toString(16).padStart(64, '0')}`,
          value: '0x0',
          gasLimit: '0x30d40', // 200000 in hexadecimal
          gasPrice: '0xbebc200', // example gas price
        }),
      },
    ];
  },
};
