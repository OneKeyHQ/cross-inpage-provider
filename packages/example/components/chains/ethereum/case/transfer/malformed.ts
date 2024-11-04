/* eslint-disable @typescript-eslint/no-unsafe-assignment */

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

export default {
  sendTransaction: (from: string, to: string) => {
    return [
      {
        'id': 'sendTransaction-malformed-invalid-value',
        'name': '普通转账测试：错误的 value 类型',
        'description': '测试普通转账 错误的 value 类型',
        'value': JSON.stringify({
          from,
          to,
          value: 'invalid', // invalid value - expected int/hex value
        }),
      },
      {
        'id': 'sendTransaction-malformed-invalid-transaction-type',
        'name': '普通转账测试：错误的 transactionType 类型',
        'description': '测试普通转账 错误的 transactionType 类型',
        'value': JSON.stringify({
          from,
          to,
          value: '0x0',
          type: '0x5', // invalid tx type - expected 0x1 or 0x2
        }),
      },
      {
        'id': 'sendTransaction-malformed-invalid-recipient',
        'name': '普通转账测试：错误的 recipient 类型',
        'description': '测试普通转账 错误的 recipient 类型',
        'value': JSON.stringify({
          from,
          to: 'invalid', // invalid recipient - expected int/hex address
          value: '0x0',
        }),
      },
      {
        'id': 'sendTransaction-malformed-invalid-gasLimit',
        'name': '1559 转账测试：错误的 gasLimit 类型',
        'description': '测试 1559 转账 错误的 gasLimit 类型',
        'value': JSON.stringify({
          from,
          to,
          value: '0x0',
          gasLimit: 'invalid', // invalid gasLimit - expected int/hex value
          maxFeePerGas: '0x2540be400',
          maxPriorityFeePerGas: '0x3b9aca00',
        }),
      },{
        'id': 'sendTransaction-malformed-invalid-maxFeePerGas',
        'name': '1559 转账测试：错误的 maxFeePerGas 类型',
        'description': '测试 1559 转账 错误的 maxFeePerGas 类型',
        'value': JSON.stringify({
          from,
          to,
          value: '0x0',
          gasLimit: '0x5028',
            maxFeePerGas: 'invalid', // invalid maxFeePerGas - expected int/hex value
          maxPriorityFeePerGas: '0x3b9aca00',
        }),
      },
    ];
  },
  signTypedData: (from: string, chainId: number) => {
    return [
      {
        'id': 'signTypedData-malformed-invalid-domain',
        'name': 'Eip712 签名 错误的参数类型',
        'description': '测试 signTypedDataV4 签名 错误的参数类型',
        'value': JSON.stringify({
          primaryType: 'OrderComponents',
          domain: {
            chainId: chainId,
            name: 'Seaport',
            version: '1.5',
            verifyingContract: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
          },
          types: {
            EIP712Domain: [
              { name: 'name', type: 'string' },
              { name: 'version', type: 'string' },
              { name: 'chainId', type: 'uint256' },
              { name: 'verifyingContract', type: 'address' },
            ],
            OrderComponents: [{ name: 'consideration', type: 'ConsiderationItem[+' }],
          },
          message: {
            consideration: [
              {
                itemType: '0',
                token: '0x0000000000000000000000000000000000000000',
                identifierOrCriteria: '0',
                startAmount: '1950000000000000',
                endAmount: '1950000000000000',
                recipient: '0x0000000000000000000000000000000000000000',
              },
            ],
          },
        }),
      },
      {
        'id': 'signTypedData-malformed-empty-domain',
        'name': 'Eip712 签名 空 domain',
        'description': '测试 signTypedDataV4 签名 空 domain',
        'value': JSON.stringify({
          domain: {},
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
            EIP712Domain,
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
        'id': 'signTypedData-malformed-extra-data-not-typed',
        'name': 'Eip712 签名 没有额外数据',
        'description': '测试 signTypedDataV4 签名 没有额外数据',
        'value': JSON.stringify({
          domain: {
            chainId: chainId,
            name: 'Seaport',
            version: '1.5',
            verifyingContract: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
          },
          message: {
            name: 'Hello, Bob!',
            extraData: 'This data is not typed!',
          },
          primaryType: 'Wallet',
          types: {
            EIP712Domain,
            Wallet: [{ name: 'name', type: 'string' }],
          },
        }),
      },
      {
        'id': 'signTypedData-malformed-invalid-primary-type',
        'name': 'Eip712 签名 无效的 primaryType',
        'description': '测试 signTypedDataV4 签名 无效的 primaryType',
        'value': JSON.stringify({
          domain: {
            chainId: chainId,
            name: 'Seaport',
            version: '1.5',
            verifyingContract: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
          },
          message: {
            name: 'Hello, Bob!',
          },
          primaryType: 'Non-Existent',
          types: {
            EIP712Domain,
            Wallet: [{ name: 'name', type: 'string' }],
          },
        }),
      },
      {
        'id': 'signTypedData-malformed-no-primary-type-defined',
        'name': 'Eip712 签名 没有 primaryType 定义',
        'description': '测试 signTypedDataV4 签名 没有 primaryType 定义',
        'value': JSON.stringify({
          domain: {
            chainId: chainId,
            name: 'Seaport',
            version: '1.5',
            verifyingContract: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC',
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
          },
          types: {
            EIP712Domain,
            Group: [
              { name: 'name', type: 'string' },
              { name: 'members', type: 'Person[]' },
            ],
            Mail: [
              { name: 'from', type: 'Person' },
              { name: 'to', type: 'Person[]' },
              { name: 'contents', type: 'string' },
            ],
            Person: [
              { name: 'name', type: 'string' },
              { name: 'wallets', type: 'address[]' },
            ],
          },
        }),
      },
      {
        'id': 'signTypedData-malformed-invalid-verifyingContract-type',
        'name': 'Eip712 签名 无效的 verifyingContract 类型',
        'description': '测试 signTypedDataV4 签名 无效的 verifyingContract 类型',
        'value': JSON.stringify({
          domain: {
            chainId: chainId,
            name: 'Seaport',
            version: '1.5',
            verifyingContract: 1,
          },
          message: {
            name: 'Hello, Bob!',
          },
          primaryType: 'Wallet',
          types: {
            EIP712Domain,
            Wallet: [{ name: 'name', type: 'string' }],
          },
        }),
      },
    ];
  },
};
