import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-unknown',
  name: 'unknown: Generic Handler',
  description: 'SignTypedDataV4 Unknown Type Handler Example',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ],
      UnknownType: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'data', type: 'bytes' }
      ]
    },
    domain: {
      name: 'Unknown Protocol',
      version: '1',
      chainId: params.chainId.toString(),
      verifyingContract: '0x0000000000000000000000000000000000000000'
    },
    primaryType: 'UnknownType',
    message: {
      from: '0x0000000000000000000000000000000000000001',
      to: '0x0000000000000000000000000000000000000002',
      nonce: 0,
      deadline: 1731399262,
      data: '0x' // Empty data for generic example
    }
  })
});
