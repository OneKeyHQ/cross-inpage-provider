/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { parseChainId } from '../../utils';
import { NETWORKS_BY_CHAIN_ID } from '../contract/SampleContracts';

export const SUSHI_ROUTER_PROCESSOR_5 = {
  'mainnet': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
  'optimism': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
  'bsc': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
  'polygon': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
  'base': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
  'arbitrum': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
  'avalanche': '0xf2614a233c7c3e7f08b1f887ba133a13f1eb2c55',
};

const supportNetworkNames = Object.keys(SUSHI_ROUTER_PROCESSOR_5);

export default {
  sendTransaction: (from: string, to: string, chainId: string | undefined) => {
    const network =
      NETWORKS_BY_CHAIN_ID[parseChainId(chainId) as keyof typeof NETWORKS_BY_CHAIN_ID];
    if (!SUSHI_ROUTER_PROCESSOR_5[network as keyof typeof SUSHI_ROUTER_PROCESSOR_5]) {
      return [
        {
          'id': 'sendTransaction-sushi-swap-not-support',
          'name': 'Sushi Swap 不支持',
          'description': 'Sushi Swap 不支持',
          'value': `当前网络不支持，支持的网络为：${supportNetworkNames.join(',')}`,
        },
      ];
    }

    const contractAddress =
      SUSHI_ROUTER_PROCESSOR_5[network as keyof typeof SUSHI_ROUTER_PROCESSOR_5];

    return [
      {
        'id': 'sushi-swap-revokeApproval',
        'name': 'Sushi Swap revoke approval',
        'description': '测试 Sushi Swap revoke approval',
        'value': JSON.stringify({
          from,
          to: contractAddress,
          data: '0x2646478b0000000000000000000000007f39c581f595b53c5cb19bd0b3f8da6c935e2ca0000000000000000000000000000000000000000000000000002a725ebec9b25c000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000000000000000000000000000000321dc0220fbe3000000000000000000000000007ceb43e5ab46e56e9d04f1dbf66fd4bd829834b00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000070027f39c581f595b53c5cb19bd0b3f8da6c935e2ca001ffff01109830a1aaad605bbf02a9dfa7b0b92ec2fb7daa01f2614a233c7c3e7f08b1f887ba133a13f1eb2c5501c02aaa39b223fe8d0a0e5c4f27ead9083c756cc201ffff020007ceb43e5ab46e56e9d04f1dbf66fd4bd829834b00000000000000000000000000000000',
        }),
      },
    ];
  },
};
