import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-1inch-order',
  name: 'order: 1inch Order 方法',
  description: 'SignTypedDataV4 1inch Order 方法',
  value: JSON.stringify({
    domain: {
      name: '1inch Aggregation Router',
      version: '6',
      chainId: 1,
      verifyingContract: '0x111111125421ca6dc452d289314280a0f8842a65',
    },
    primaryType: 'Order',
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Order: [
        { name: 'salt', type: 'uint256' },
        { name: 'maker', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'makerAsset', type: 'address' },
        { name: 'takerAsset', type: 'address' },
        { name: 'makingAmount', type: 'uint256' },
        { name: 'takingAmount', type: 'uint256' },
        { name: 'makerTraits', type: 'uint256' },
      ],
    },
    message: {
      salt: '96530915085070088577238629764408922879729660059095033908741121777941465699830',
      maker: '0x76f3f64cb3cd19debee51436df630a342b736c24',
      receiver: '0x0000000000000000000000000000000000000000',
      makerAsset: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      takerAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      makingAmount: '1000000',
      takingAmount: '1000000',
      makerTraits: '0x440000000000000000000000000000000000672725ae00000000000000000000',
      extension: '0x',
    },
  }),
});
