import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-cowswap-order',
  name: 'cowswap: Order',
  description: 'SignTypedDataV4 Cowswap Order',
  value: JSON.stringify({
    types: {
      Order: [
        { name: 'sellToken', type: 'address' },
        { name: 'buyToken', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'sellAmount', type: 'uint256' },
        { name: 'buyAmount', type: 'uint256' },
        { name: 'validTo', type: 'uint32' },
        { name: 'appData', type: 'bytes32' },
        { name: 'feeAmount', type: 'uint256' },
        { name: 'kind', type: 'string' },
        { name: 'partiallyFillable', type: 'bool' },
        { name: 'sellTokenBalance', type: 'string' },
        { name: 'buyTokenBalance', type: 'string' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    domain: {
      name: 'Gnosis Protocol',
      version: 'v2',
      chainId: params.chainId.toString(),
      verifyingContract: '0x0000000000000000000000000000000000000000'
    },
    primaryType: 'Order',
    message: {
      sellToken: '0x0000000000000000000000000000000000000001', // Token A
      buyToken: '0x0000000000000000000000000000000000000002', // Token B
      receiver: '0x0000000000000000000000000000000000000003',
      sellAmount: '1000000', // 1 USDC
      buyAmount: '500000000000000000', // 0.5 ETH
      validTo: 1684022400,
      appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
      feeAmount: '1000', // 0.001 USDC
      kind: 'sell',
      partiallyFillable: false,
      sellTokenBalance: 'erc20',
      buyTokenBalance: 'erc20'
    }
  })
});
