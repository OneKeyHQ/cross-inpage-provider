import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permit-forever',
  name: 'permit: forever',
  description: 'SignTypedDataV4 Permit with Maximum Deadline Example',
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
      verifyingContract: '0x0000000000000000000000000000000000000000',
      chainId: params.chainId.toString()
    },
    message: {
      owner: '0x0000000000000000000000000000000000000001',
      spender: '0x0000000000000000000000000000000000000002',
      value: '1000000',
      nonce: 0,
      deadline: '115792089237316195423570985008687907853269984665640564039457584007913129639935' // max uint256 for infinite time
    }
  })
});
