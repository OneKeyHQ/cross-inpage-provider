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
      verifyingContract: '0x0000000000000000000000000000000000000000'
    },
    primaryType: 'Order',
    message: {
      maker: '0x0000000000000000000000000000000000000001',
      tokenIn: '0x0000000000000000000000000000000000000002', // Token A
      tokenOut: '0x0000000000000000000000000000000000000003', // Token B
      amountIn: '1000000', // 1 Token A
      amountOut: '500000000000000000', // 0.5 Token B
      recipient: '0x0000000000000000000000000000000000000001',
      startTime: '1683936000',
      endTime: '1684022400',
      stopPrice: '0',
      oracleAddress: '0x0000000000000000000000000000000000000000',
      oracleData: '0x',
      salt: '24446860302761739304752'
    }
  })
});
