import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-bigdata',
  name: '默认类型: 大数据模式',
  description: 'SignTypedDataV4 BigData',
  value: JSON.stringify({
    domain: {
      name: 'Franklin',
      version: '0.0.1',
      chainId: params.chainId.toString(),
      verifyingContract: '0x0000000000000000000000000000000000000000',
    },
    primaryType: 'ForwardRequest',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      ForwardRequest: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'gas', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'data', type: 'bytes' },
      ],
      VerifyWallet: [
        { name: 'contents', type: 'string' },
      ],
    },
    message: {
      from: '0x0000000000000000000000000000000000000000',
      to: '0x0000000000000000000000000000000000000000',
      value: 0,
      gas: 275755,
      nonce: 3,
      data: `0x${'01'.repeat(3150)}`,
    },
  }),
});
