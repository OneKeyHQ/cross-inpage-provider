import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permitBatch-usdc-dai',
  name: 'permit2: PermitBatch USDC-DAI',
  description: 'SignTypedDataV4 Permit2 batch approval for USDC and DAI tokens',
  value: JSON.stringify({
    types: {
      PermitBatch: [
        { name: 'details', type: 'PermitDetails[]' },
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
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
      chainId: params.chainId.toString()
    },
    primaryType: 'PermitBatch',
    message: {
      details: [
        {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
          amount: '1000000', // 1 USDC
          expiration: '1731399262',
          nonce: '0'
        },
        {
          token: '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
          amount: '1000000000000000000', // 1 DAI
          expiration: '1731399262',
          nonce: '0'
        }
      ],
      spender: '0x000000000022d473030f116ddee9f6b43ac78ba3', // Permit2 contract
      sigDeadline: '1731399262'
    }
  })
});
