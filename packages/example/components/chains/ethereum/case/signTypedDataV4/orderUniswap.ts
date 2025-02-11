import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-uniswap-order',
  name: 'order: Uniswap Order 方法',
  description: 'SignTypedDataV4 Uniswap Order 方法',
  value: JSON.stringify({
    domain: {
      name: 'Permit2',
      chainId: '1',
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
    },
    primaryType: 'PermitWitnessTransferFrom',
    types: {
      PermitWitnessTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'witness', type: 'ExclusiveDutchOrder' },
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      ExclusiveDutchOrder: [
        { name: 'info', type: 'OrderInfo' },
        { name: 'decayStartTime', type: 'uint256' },
        { name: 'decayEndTime', type: 'uint256' },
        { name: 'exclusiveFiller', type: 'address' },
        { name: 'exclusivityOverrideBps', type: 'uint256' },
        { name: 'inputToken', type: 'address' },
        { name: 'inputStartAmount', type: 'uint256' },
        { name: 'inputEndAmount', type: 'uint256' },
        { name: 'outputs', type: 'DutchOutput[]' },
      ],
      OrderInfo: [
        { name: 'reactor', type: 'address' },
        { name: 'swapper', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'additionalValidationContract', type: 'address' },
        { name: 'additionalValidationData', type: 'bytes' },
      ],
      DutchOutput: [
        { name: 'token', type: 'address' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' },
        { name: 'recipient', type: 'address' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    },
    message: {
      permitted: {
        token: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        amount: '1000000',
      },
      spender: '0x6000da47483062a0d734ba3dc7576ce6a0b645c4',
      nonce: '1993352166583899161923764192112649470755470073419234265795709026266341327361',
      deadline: 1731399262,
      witness: {
        info: {
          reactor: '0x6000da47483062a0d734ba3dc7576ce6a0b645c4',
          swapper: '0x76f3f64cb3cd19debee51436df630a342b736c24',
          nonce: '1993352166583899161923764192112649470755470073419234265795709026266341327361',
          deadline: 1731399262,
          additionalValidationContract: '0x0000000000000000000000000000000000000000',
          additionalValidationData: '0x',
        },
        decayStartTime: 1731399262,
        decayEndTime: 1731399262,
        exclusiveFiller: '0x0000000000000000000000000000000000000000',
        exclusivityOverrideBps: '0',
        inputToken: '0xdac17f958d2ee523a2206206994597c13d831ec7',
        inputStartAmount: '1000000',
        inputEndAmount: '1000000',
        outputs: [
          {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            startAmount: '1000000',
            endAmount: '1000000',
            recipient: '0x76f3f64cb3cd19debee51436df630a342b736c24',
          },
        ],
      },
    },
  }),
});
