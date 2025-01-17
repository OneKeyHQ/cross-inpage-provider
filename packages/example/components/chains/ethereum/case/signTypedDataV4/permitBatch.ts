import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permitBatch',
  name: 'permit2: PermitBatch 代币批量授权',
  description: 'permit2: PermitBatch 代币批量授权，一次授权两个代币信息',
  value: JSON.stringify({
    types: {
      PermitBatch: [
        {
          name: 'details',
          type: 'PermitDetails[]',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'sigDeadline',
          type: 'uint256',
        },
      ],
      PermitDetails: [
        {
          name: 'token',
          type: 'address',
        },
        {
          name: 'amount',
          type: 'uint160',
        },
        {
          name: 'expiration',
          type: 'uint48',
        },
        {
          name: 'nonce',
          type: 'uint48',
        },
      ],
      EIP712Domain: [
        {
          name: 'name',
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
    },
    domain: {
      name: 'Permit2',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      chainId: params.chainId.toString(),
    },
    primaryType: 'PermitBatch',
    message: {
      details: [
        {
          token: '0x0000000000000000000000000000000000000001',
          amount: '1000000000000000000',
          expiration: '2000000000',
          nonce: '1',
        },
        {
          token: '0x0000000000000000000000000000000000000002',
          amount: '1000000000000000000',
          expiration: '2000000000',
          nonce: '2',
        },
      ],
      spender: '0x0000000000000000000000000000000000000003',
      sigDeadline: '2000000000',
    },
  }),
});
