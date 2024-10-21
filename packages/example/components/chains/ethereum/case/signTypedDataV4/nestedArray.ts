import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-Nested-array',
  name: '默认类型: 嵌套数组',
  description: 'SignTypedDataV4 Nested Array',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
      ],
      NestedArray: [
        { name: 'items', type: 'SingleItem[][]' },
      ],
      SingleItem: [
        { name: 'id', type: 'uint256' },
        { name: 'value', type: 'string' },
      ],
    },
    primaryType: 'NestedArray',
    domain: {
      chainId: params.chainId.toString(),
      name: 'NestedArray',
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      version: '1',
    },
    message: {
      items: [
        [
          { id: 1, value: 'Item1-1' },
          { id: 2, value: 'Item1-2' },
        ],
        [
          { id: 3, value: 'Item2-1' },
          { id: 4, value: 'Item2-2' },
        ],
        [
          { id: 5, value: 'Item3-1' },
          { id: 6, value: 'Item3-2' },
        ],
        [
          { id: 7, value: 'Item4-1' },
          { id: 8, value: 'Item4-2' },
        ],
      ],
    },
  }),
});
