import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permit-usdt',
  name: 'permit: USDT Permit',
  description: 'SignTypedDataV4 USDT Permit example',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    },
    primaryType: 'Permit',
    domain: {
      name: 'USDT',
      version: '1',
      verifyingContract: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      chainId: params.chainId.toString()
    },
    message: {
      owner: '0x76f3f64cb3cd19debee51436df630a342b736c24',
      spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
      value: '1000000',
      nonce: 0,
      deadline: 1731399262
    }
  })
});
