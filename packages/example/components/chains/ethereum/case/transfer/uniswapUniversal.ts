/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { parseChainId } from '../../utils';
import { NETWORKS_BY_CHAIN_ID } from '../contract/SampleContracts';

const UNISWAP_UNIVERSAL_ROUTER = {
  'mainnet': '0x7a250d5630b4cf539739df2c5dacb4c659f2488d',
  'optimism': '0x4a7b5da61326a6379179b40d00f57e5bbdc962c2',
  'bsc': '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
  'polygon': '0xedf6066a2b290c185783862c7f4776a2c8077ad1',
  'base': '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
  'arbitrum': '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
  'avalanche': '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24',
};

const supportNetworkNames = Object.keys(UNISWAP_UNIVERSAL_ROUTER);

export default {
  sendTransaction: (from: string, to: string, chainId: string | undefined) => {
    const network =
      NETWORKS_BY_CHAIN_ID[parseChainId(chainId) as keyof typeof NETWORKS_BY_CHAIN_ID];
    if (!UNISWAP_UNIVERSAL_ROUTER[network as keyof typeof UNISWAP_UNIVERSAL_ROUTER]) {
      return [
        {
          'id': 'sendTransaction-uniswapV2-not-support',
          'name': 'Uniswap Universal 不支持',
          'description': 'Uniswap Universal 不支持',
          'value': `当前网络不支持，支持的网络为：${supportNetworkNames.join(',')}`,
        },
      ];
    }

    const contractAddress =
      UNISWAP_UNIVERSAL_ROUTER[network as keyof typeof UNISWAP_UNIVERSAL_ROUTER];

    return [
      {
        'id': 'uniswapV3-revokeApproval',
        'name': 'Uniswap Permit2 revoke approval',
        'description': '测试 Uniswap Permit2 revoke approval',
        'value': JSON.stringify({
          from,
          to: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          data: '0xcc53287f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001000000000000000000000000dac17f958d2ee523a2206206994597c13d831ec70000000000000000000000001df7b652d428557044cc15e22b7a6508e21cada4',
        }),
      },
      {
        'id': 'uniswapV3-revokeApprovalBatch',
        'name': 'Uniswap Permit2 revoke approval batch',
        'description': '测试 Uniswap Permit2 revoke approval batch',
        'value': JSON.stringify({
          from,
          to: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          data: '0xcc53287f00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003000000000000000000000000300e0d87f8c95d90cfe4b809baa3a6c90e83b8500000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad00000000000000000000000036ff4dae0e88113d68b1209e245b0e3af92e9d58000000000000000000000000ef1c6e67703c7bd7107eed8303fbe6ec2554bf6b000000000000000000000000e2cfd7a01ec63875cd9da6c7c1b7025166c2fa2f0000000000000000000000003fc91a3afd70395cd496c647d5a6cc9d4b2b7fad',
        }),
      },
      {
        'id': 'uniswapV3-swapTokensForExactETH1',
        'name': 'Swap',
        'description': '测试 swap',
        'value': JSON.stringify({
          from,
          to: contractAddress,
          data: '0x3593564c000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000006774c78d00000000000000000000000000000000000000000000000000000000000000040b000604000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000028000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000011f23a067400e2a00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000011f23a067400e2a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002bc02aaa39b223fe8d0a0e5c4f27ead9083c756cc200271026e550ac11b26f78a04489d5f20f24e3559f7dd9000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000026e550ac11b26f78a04489d5f20f24e3559f7dd9000000000000000000000000000000fee13a103a10d593b9ae06b3e05f2e7e1c0000000000000000000000000000000000000000000000000000000000000019000000000000000000000000000000000000000000000000000000000000006000000000000000000000000026e550ac11b26f78a04489d5f20f24e3559f7dd90000000000000000000000009802ce11089f323aa42f67c5b52d1fd076db33d50000000000000000000000000000000000000000000000000000015ccf9038800b',
        }),
      },
    ];
  },
};
