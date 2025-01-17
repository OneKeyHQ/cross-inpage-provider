import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permit',
  name: 'permit: Permit 方法',
  description: 'SignTypedDataV4 Permit 方法',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      Permit: [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name: 'ExampleToken',
      version: '1',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      chainId: params.chainId.toString(),
    },
    message: {
      owner: '0x0000000000000000000000000000000000000001',
      spender: '0x0000000000000000000000000000000000000002',
      value: 1000000,
      nonce: 0,
      deadline: 2000000000,
    },
  }),
});
