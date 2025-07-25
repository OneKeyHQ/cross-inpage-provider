import signTypedDataV4Cases from './case/signTypedDataV4';

const chainIdInt = 100;

export default {
  'signMessage': {
    'message': 'Hello World',
    'signature': '0x1',
  },
  'requestMothed': [
    {
      'id': 'request',
      'name': 'request',
      'description': 'request eth mothed',
      'value': JSON.stringify({
        'method': 'eth_requestAccounts',
        'params': [],
      }),
    },
  ],
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
      'description': '断开 App 的授权连接',
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
      name: 'Sepolia Test',
      chainId: '0xaa36a7',
    },
    {
      name: 'Gnosis',
      chainId: '0x64',
    },
    {
      name: 'filecoin Evm',
      chainId: '0x13a',
    },
    {
      name: 'Ethereum',
      chainId: '0x1',
    },
    {
      name: 'Optimism',
      chainId: '0xa',
    },
    // {
    //   name: 'EthereumPoW',
    //   chainId: '0x64',
    // },
    {
      name: 'Conflux eSpace',
      chainId: '0x406',
    },
    {
      name: 'Huobi ECO',
      chainId: '0x80',
    },
    {
      name: 'Aurora',
      chainId: '0x4e454152',
    },
    {
      name: 'Polygon',
      chainId: '0x89',
    },
    {
      name: 'Polygon akEVM',
      chainId: '0x44d',
    },
    {
      name: 'Cronos',
      chainId: '0x19',
    },
    {
      name: 'Fantom',
      chainId: '0xfa',
    },
    {
      name: 'Boba',
      chainId: '0x120',
    },
    {
      name: 'zkSync',
      chainId: '0x144',
    },
    {
      name: 'Arbitrum',
      chainId: '0xa4b1',
    },
    {
      name: 'Celo',
      chainId: '0xa4ec',
    },
    {
      name: 'Avalanche',
      chainId: '0xa86a',
    },
    // {
    //   name: 'DIS',
    //   chainId: '0x64',
    // },
    {
      name: 'BNB Smart Chain',
      chainId: '0x38',
    },
    {
      name: 'Ethereum Classic',
      chainId: '0x3d',
    },
    // {
    //   name: 'OKX Chain',
    //   chainId: '0x64',
    // },
    {
      name: 'Mixin Virtual Machine',
      chainId: '0x120c7',
    },
    {
      name: 'Linea',
      chainId: '0xe708',
    },
    {
      name: 'Base',
      chainId: '0x2105',
    },
    {
      name: 'Mantle',
      chainId: '0x1388',
    },
    {
      name: 'IoTeX',
      chainId: '0x1251',
    },
    // {
    //   name: 'Mantra',
    //   chainId: '0x64',
    // },
    {
      name: 'Blast',
      chainId: '0xee',
    },
    {
      name: 'OctaSpace',
      chainId: '0xc3501',
    },
  ].map((item) => {
    return {
      'id': `switchEthereumChain_${item.name}`,
      'name': `${item.name}`,
      'description': `切换 ${item.name} Chain`,
      'value': JSON.stringify({
        'chainId': item.chainId,
      }),
    };
  }),
  watchAssets: (
    tokens: {
      value: string;
      label: string;
      extra: {
        type: string;
        options: {
          address: string;
          symbol: string;
          decimals: number;
          image: string;
        };
      };
    }[],
  ) => {
    return tokens.map((token) => {
      const { value, label, extra } = token;
      const { address, symbol, decimals, image } = extra.options;

      return {
        id: `watchAsset-${value}`,
        name: label,
        value: JSON.stringify(
          {
            type: 'ERC20',
            options: {
              address: address,
              symbol: symbol,
              decimals: decimals,
              image: image,
            },
          },
          null,
          2,
        ),
        description: '代币配置（可编辑）',
      };
    });
  },
  watchAsset: [
    {
      'id': 'watchAsset erc20 foo',
      'name': '主网 FOO ERC20',
      'description': '测试添加主网 FOO ERC20 资产',
      'value': JSON.stringify({
        type: 'ERC20',
        options: {
          address: '0xa9b4d559a98ff47c83b74522b7986146538cd4df',
          symbol: 'FOO',
          decimals: 18,
          image: 'https://foo.io/token-image.svg',
        },
      }),
    },
    {
      'id': 'watchAsset ERC721 Lido',
      'name': '主网 Lido ERC721',
      'description': '测试主网 Lido: stETH Withdrawal NFT ERC721 资产',
      'value': JSON.stringify({
        'type': 'ERC721',
        'options': {
          'address': '0x889edc2edab5f40e902b864ad4d7ade8e412f9b1',
          'tokenId': '50632',
        },
      }),
    },
    {
      'id': 'watchAsset ERC1155 Lido',
      'name': '主网 ERC1155',
      'description': '测试添加主网 ERC1155 资产',
      'value': JSON.stringify({
        'type': 'ERC1155',
        'options': {
          'address': '0xabcdef0123456789abcdef0123456789abcdef01',
          'tokenId': '1337',
        },
      }),
    },
    {
      'id': 'watchAsset erc20 Polygon WETH',
      'name': 'Polygon WETH ERC20',
      'description': '测试添加 Polygon WETH 资产',
      'value': JSON.stringify({
        type: 'ERC20',
        options: {
          address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
          symbol: 'WETH',
          decimals: 18,
          image: 'https://polygonscan.com/token/images/wETH_32.png',
        },
      }),
    },
    {
      'id': 'watchAsset ERC721 Polygon unstoppable',
      'name': 'Polygon Unstoppable ERC721',
      'description': '测试 Polygon Unstoppable ERC721 资产',
      'value': JSON.stringify({
        'type': 'ERC721',
        'options': {
          'address': '0xa9a6a3626993d487d2dbda3173cf58ca1a9d9e9f',
          'tokenId':
            '17893201811739899534133387548294644234750447072813328765681112569786468116764',
        },
      }),
    },
    {
      'id': 'watchAsset ERC1155 Polygon Lido',
      'name': 'Polygon ERC1155',
      'description': '测试添加 Polygon ERC1155 资产',
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
  personalEcRecover: [
    {
      'id': 'eth_sign',
      'name': 'eth_sign',
      'description': 'personalSign',
      'value': JSON.stringify({
        'message': '0x01',
        'signature': '把 personal_sign 的执行结果放在这里',
      }),
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
  signTypedDataV4: (chainId: number) => signTypedDataV4Cases({ chainId }),
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
        'id': 'unlimited-approved-eth-mainnet-usdc-uniswap',
        'name': '无限授权 Uniswap Ploygon USDC（模仿 Uni 格式）',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          to: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          gas: '0xdb2b',
        }),
      },
      {
        'id': 'unlimited-approved-eth-mainnet-usdc',
        'name': '无限授权 Uniswap Ploygon USDC',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          from: from,
          value: '0x0',
          to: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
          gas: '0xdb2b',
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        }),
      },
      {
        'id': 'mack-uniswap-send-polygon-usdc',
        'name': 'UniSwap 发送 Polygon USDC（模仿 Uni 格式）',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          'chainId': '0x89',
          'gas': '0x1195e',
          'maxFeePerGas': '0x74a35dd4c',
          'maxPriorityFeePerGas': '0x749b15c42',
          'from': from,
          'to': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          'data':
            '0xa9059cbb000000000000000000000000a9b4d559a98ff47c83b74522b7986146538cd4df0000000000000000000000000000000000000000000000000000000000002710',
        }),
      },
      {
        'id': 'mack-safe-tx-multi-sig-call-eth-transfer',
        'name': '(ETH Mainnet) SafeTxMultiSig Call ETH Transfer',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          'gas': '0x1195e',
          'maxFeePerGas': '0x74a35dd4c',
          'maxPriorityFeePerGas': '0x749b15c42',
          'from': from,
          'to': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          'data':
            '0x6a761202000000000000000000000000a03400e098f4421b34a3a44a1b4e57141951768700000000000000000000000000000000000000000000000c77e4256863d8000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c354a883d615927d15a4fdedf1f4783c16475c301196bd0f5b37ec67b8a6e77b0b3f45385ff9570f1fa47e175d216c73361b9b10e4397ef26eed5b5e74baefb1e51b000000000000000000000000b865d3112b3cf67f09027d209c0b866bc6312a0300000000000000000000000000000000000000000000000000000000000000000118c47f23469a7c04225d080a61751d890f8ee86cc5ce9e9d949ac2c19241483d4466cd93b57219ec5512fbca2ab20d7506fe063eb69e89bad3ceadfba09267921b0000000000000000000000000000000000000000000000000000000000',
        }),
      },
      {
        'id': 'mack-safe-tx-multi-sig-call-erc20-transfer',
        'name': '(ETH Mainnet) SafeTxMultiSig Call ERC20 Transfer',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          'gas': '0x1195e',
          'maxFeePerGas': '0x74a35dd4c',
          'maxPriorityFeePerGas': '0x749b15c42',
          'from': from,
          'to': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          'data':
            '0x6a7612020000000000000000000000007d8146cf21e8d7cbe46054e01588207b511987290000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001c00000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000a03400e098f4421b34a3a44a1b4e57141951768700000000000000000000000000000000000000001ade58da61d63473dbe000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c35509e65f619543eea813074ef19e371574026659ad873935a29a5ae654bbe5605f681efb1e005449ada3c3ca44e724eccd3b348fa2350dc504cc771cf0871f491b560f1edee60648a925eea11cb15c0d5ac4d97ec520afd813411b05b98784f4c975bbd5afb80e322f89fea21ca56b3677542b33e769e67f5feb8d7977ba36a0e21b5f31c87d5a95f1a18a201ee40bcbc413cc4bf68b8626a36ac54e7251c9b7d08a22510bb8b1941549e0e3a2c7fd2d2dbcc05ccf7fd720c6234fdd368f0cce53621c0000000000000000000000000000000000000000000000000000000000',
        }),
      },
      {
        'id': 'mack-safe-tx-multi-sig-approve',
        'name': '(ETH Mainnet) SafeTxMultiSig Call ERC20 Approve',
        'description': 'sendTransaction',
        'value': JSON.stringify({
          'gas': '0x1195e',
          'maxFeePerGas': '0x74a35dd4c',
          'maxPriorityFeePerGas': '0x749b15c42',
          'from': from,
          'to': '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
          'data':
            '0xd4d9bdcd7f60722d75e432c43705f4bfa2bf3d8bd792706a6a4120a722d18b32f3b036b3',
        }),
      },
    ];
  },
};
