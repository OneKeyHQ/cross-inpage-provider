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
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
      chainId: params.chainId.toString(),
    },
    primaryType: 'PermitBatch',
    message: {
      details: [
        {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          amount: '1000000', // 1 USDC
          expiration: '1731399262',
          nonce: '0',
        },
        {
          token: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
          amount: '1000000', // 1 USDT
          expiration: '1731399262',
          nonce: '0',
        },
      ],
      spender: '0x000000000022d473030f116ddee9f6b43ac78ba3', // Permit2 contract
      sigDeadline: '1731399262',
    },
  }),
});
