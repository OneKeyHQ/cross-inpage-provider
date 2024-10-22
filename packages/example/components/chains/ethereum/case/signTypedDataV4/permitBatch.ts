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
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      chainId: params.chainId.toString(),
    },
    primaryType: 'PermitBatch',
    message: {
      details: [
        {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: '1461501637330902918203684832716283019655932542975',
          expiration: '1722887542',
          nonce: '5',
        },
        {
          token: '0xb0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: '1461501637330902918203684832716283019655932542975',
          expiration: '1722887642',
          nonce: '6',
        },
      ],
      spender: '0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
      sigDeadline: '1720297342',
    },
  }),
});
