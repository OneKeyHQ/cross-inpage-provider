import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permitSingle',
  name: 'permit2: PermitSingle 方法 Swap USDC => Matic',
  description: '模仿 UniSwap Swap，数据来自 Polygon USDC => Matic',
  value: JSON.stringify({
    types: {
      PermitSingle: [
        { name: 'details', type: 'PermitDetails' },
        { name: 'spender', type: 'address' },
        { name: 'sigDeadline', type: 'uint256' },
      ],
      PermitDetails: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint160' },
        { name: 'expiration', type: 'uint48' },
        { name: 'nonce', type: 'uint48' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    },
    domain: {
      name: 'Permit2',
      chainId: params.chainId.toString(),
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    primaryType: 'PermitSingle',
    message: {
      details: {
        token: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
        amount: '1461501637330902918203684832716283019655932542975',
        expiration: '1722675330',
        nonce: '0',
      },
      spender: '0xec7be89e9d109e7e3fec59c222cf297125fefda2',
      sigDeadline: '1720085130',
    },
  }),
});
