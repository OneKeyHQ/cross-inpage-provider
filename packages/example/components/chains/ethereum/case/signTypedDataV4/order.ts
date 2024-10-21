import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-order',
  name: 'order: Order 方法',
  description: 'SignTypedDataV4 Order 方法',
  value: JSON.stringify({
    types: {
      Order: [
        { type: 'uint8', name: 'direction' },
        { type: 'address', name: 'maker' },
        { type: 'address', name: 'taker' },
        { type: 'uint256', name: 'expiry' },
        { type: 'uint256', name: 'nonce' },
        { type: 'address', name: 'erc20Token' },
        { type: 'uint256', name: 'erc20TokenAmount' },
        { type: 'Fee[]', name: 'fees' },
        { type: 'address', name: 'erc721Token' },
        { type: 'uint256', name: 'erc721TokenId' },
        { type: 'Property[]', name: 'erc721TokenProperties' },
      ],
      Fee: [
        { type: 'address', name: 'recipient' },
        { type: 'uint256', name: 'amount' },
        { type: 'bytes', name: 'feeData' },
      ],
      Property: [
        { type: 'address', name: 'propertyValidator' },
        { type: 'bytes', name: 'propertyData' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    },
    domain: {
      name: 'ZeroEx',
      version: '1.0.0',
      chainId: params.chainId.toString(),
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
    },
    primaryType: 'Order',
    message: {
      direction: '0',
      maker: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      taker: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
      expiry: '2524604400',
      nonce: '100131415900000000000000000000000000000083840314483690155566137712510085002484',
      erc20Token: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      erc20TokenAmount: '42000000000000',
      fees: [],
      erc721Token: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
      erc721TokenId: '2516',
      erc721TokenProperties: [],
    },
  }),
});
