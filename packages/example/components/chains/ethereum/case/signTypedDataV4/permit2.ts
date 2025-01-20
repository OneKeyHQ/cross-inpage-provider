import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permit2',
  name: 'permit2: Single Token',
  description: 'SignTypedDataV4 Permit2 Single Token Example',
  value: JSON.stringify({
    types: {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' }
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    domain: {
      name: 'Permit2',
      chainId: params.chainId.toString(),
      verifyingContract: '0x0000000000000000000000000000000000000000'
    },
    primaryType: 'PermitSingle',
    message: {
      details: {
        token: '0x0000000000000000000000000000000000000001', // Token
        amount: '1000000', // 1 Token
        expiration: '1731399262',
        nonce: '0'
      },
      spender: '0x0000000000000000000000000000000000000002',
      sigDeadline: '1731399262'
    }
  })
});
