import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-cos-swap-order',
  name: 'order: CosSwap Order 方法',
  description: 'SignTypedDataV4 CosSwap Order 方法',
  value: JSON.stringify({
    domain: {
      name: 'Gnosis Protocol',
      version: 'v2',
      chainId: '1',
      verifyingContract: '0x9008d19f58aabd9ed0d60971565aa8510560ab41',
    },
    primaryType: 'Order',
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
        { name: 'buyTokenBalance', type: 'string' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    },
    message: {
      sellToken: '0x73a15fed60bf67631dc6cd7bc5b6e8da8190acf5',
      buyToken: '0x35d8949372d46b7a3d5a56006ae77b215fc69bc0',
      receiver: '0x868d38d6bcb9a2efe2e23f4211d497908e99d66b',
      sellAmount: '402065000000000000000000',
      buyAmount: '401804427342567222745733',
      validTo: '1732851237',
      appData: '0xfd1a10bb40371b2385c680bb9ea570b3106efd027e92b8814a8e34b397cff9a9',
      feeAmount: '0',
      kind: 'sell',
      partiallyFillable: false,
      sellTokenBalance: 'erc20',
      buyTokenBalance: 'erc20',
    },
  }),
});
