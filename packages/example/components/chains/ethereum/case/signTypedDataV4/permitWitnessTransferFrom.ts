import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV5-permitWitnessTransferFrom',
  name: '默认类型: PermitWitnessTransferFrom 方法',
  description: '模仿 UniSwap 现价单，数据来自 ETH 主网 USDC => ETH',
  value: JSON.stringify({
    types: {
      PermitWitnessTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'witness', type: 'ExclusiveDutchOrder' }
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' }
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
        { name: 'outputs', type: 'DutchOutput[]' }
      ],
      OrderInfo: [
        { name: 'reactor', type: 'address' },
        { name: 'swapper', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'additionalValidationContract', type: 'address' },
        { name: 'additionalValidationData', type: 'bytes' }
      ],
      DutchOutput: [
        { name: 'token', type: 'address' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' },
        { name: 'recipient', type: 'address' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    domain: {
      name: 'Permit2',
      chainId: params.chainId.toString(),
      verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3'
    },
    primaryType: 'PermitWitnessTransferFrom',
    message: {
      permitted: {
        token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        amount: '100000'
      },
      spender: '0x6000da47483062a0d734ba3dc7576ce6a0b645c4',
      nonce: '1993348893786760112071654418902816288670429612439619040341918096409194690305',
      deadline: '1720694762',
      witness: {
        info: {
          reactor: '0x6000da47483062a0d734ba3dc7576ce6a0b645c4',
          swapper: '0x5618207d27d78f09f61a5d92190d58c453feb4b7',
          nonce: '1993348893786760112071654418902816288670429612439619040341918096409194690305',
          deadline: '1720694762',
          additionalValidationContract: '0x0000000000000000000000000000000000000000',
          additionalValidationData: '0x'
        },
        decayStartTime: '1720089962',
        decayEndTime: '1720089962',
        exclusiveFiller: '0x0000000000000000000000000000000000000000',
        exclusivityOverrideBps: '0',
        inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        inputStartAmount: '100000',
        inputEndAmount: '100000',
        outputs: [
          {
            token: '0x0000000000000000000000000000000000000000',
            startAmount: '33465858131534',
            endAmount: '33465858131534',
            recipient: '0x5618207d27d78f09f61a5d92190d58c453feb4b7'
          }
        ]
      }
    }
  })
});
