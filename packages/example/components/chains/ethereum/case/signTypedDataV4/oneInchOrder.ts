import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-1inch-order',
  name: '1inch: Limit Order',
  description: 'SignTypedDataV4 1inch Limit Order',
  value: JSON.stringify({
    types: {
      Order: [
        { name: 'maker', type: 'address' },
        { name: 'tokenIn', type: 'address' },
        { name: 'tokenOut', type: 'address' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOut', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'startTime', type: 'uint256' },
        { name: 'endTime', type: 'uint256' },
        { name: 'stopPrice', type: 'uint256' },
        { name: 'oracleAddress', type: 'address' },
        { name: 'oracleData', type: 'bytes' },
        { name: 'salt', type: 'uint256' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    domain: {
      name: '1inch Limit Order Protocol',
      version: '1',
      chainId: params.chainId.toString(),
      verifyingContract: '0x1111111254eeb25477b68fb85ed929f73a960582'
    },
    primaryType: 'Order',
    message: {
      maker: '0x6fc702d32e6cb268f7dc68766e6b0fe94520499d',
      tokenIn: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      amountIn: '1000000', // 1 USDC
      amountOut: '500000000000000000', // 0.5 ETH
      recipient: '0x6fc702d32e6cb268f7dc68766e6b0fe94520499d',
      startTime: '1683936000',
      endTime: '1684022400',
      stopPrice: '0',
      oracleAddress: '0x0000000000000000000000000000000000000000',
      oracleData: '0x',
      salt: '24446860302761739304752'
    }
  })
});
