/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { parseChainId } from '../../utils';
import { NETWORKS_BY_CHAIN_ID } from '../contract/SampleContracts';

const MORPHO_ROUTER = {
  'mainnet': '0x51056b3F809f4cFE17E1A8715B82f5dbbCA5a5A1',
};

const supportNetworkNames = Object.keys(MORPHO_ROUTER);

export default {
  sendTransaction: (from: string, to: string, chainId: string | undefined) => {
    const network =
      NETWORKS_BY_CHAIN_ID[parseChainId(chainId) as keyof typeof NETWORKS_BY_CHAIN_ID];
    if (!MORPHO_ROUTER[network as keyof typeof MORPHO_ROUTER]) {
      return [
        {
          'id': 'sendTransaction-morpho-not-support',
          'name': 'Morpho 不支持',
          'description': 'Morpho 不支持',
          'value': `当前网络不支持，支持的网络为：${supportNetworkNames.join(',')}`,
        },
      ];
    }

    const contractAddress = MORPHO_ROUTER[network as keyof typeof MORPHO_ROUTER];

    return [
      {
        'id': 'morpho-withdraw_0xb460af94',
        'name': 'Morpho withdraw',
        'description': '测试 Morpho withdraw',
        'value': JSON.stringify({
          from,
          to: '0x51056b3F809f4cFE17E1A8715B82f5dbbCA5a5A1',
          data: '0xb460af9400000000000000000000000000000000000000000000000000000000000f42400000000000000000000000004ef880525383ab4e3d94b7689e3146bf899a296e0000000000000000000000004ef880525383ab4e3d94b7689e3146bf899a296e',
        }),
      },
      {
        'id': 'morpho-redeem_0xba087652',
        'name': 'Morpho redeem',
        'description': '测试 Morpho redeem',
        'value': JSON.stringify({
          from,
          to: '0xd63070114470f685b75B74D60EEc7c1113d33a3D',
          data: '0xba08765200000000000000000000000000000000000000000000000197b46c4ad10b345300000000000000000000000075347799e8824d9ad096fa6bb5bb1ab56d15e89e00000000000000000000000075347799e8824d9ad096fa6bb5bb1ab56d15e89e',
        }),
      },
      {
        'id': 'morpho-claim_0xfabed412',
        'name': 'Morpho claim',
        'description': '测试 Morpho claim',
        'value': JSON.stringify({
          from,
          to: "0x330eefa8a787552DC5cAd3C3cA644844B1E61Ddb",
          data: '0xfabed41200000000000000000000000003831fe10bb34879ce46c22045d81dc75a26f15200000000000000000000000058d97b57bb95320f9a05dc918aef65434969c2b20000000000000000000000000000000000000000000000035f73745d12abec5d0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000f9c1d2fe22321883ecc6ce34a86e729f8c8ded1c6b04a5ddb9a6a04e6f2d6092af44aeb6b0e03d87fc76d40404824887687ed8407c988ac02aaae8f09a403ea72843e3c6c668dc63548094415e83b039522aaea67fb7c951f60262e4c1a6038fc87f3244c300b42f11055abdaf58fe348a6291e5fec9c76f32cf115690b048422d1255196cb34e08a558a2fbc4e7e760e6b457194a538e77d6dfe28de695eac5b14e791bfc1ac8d2553f81ec023d223aeb1b845859cf26906c5df9e6b44f0d7302a9fbcb700ee98b4959e19d91c20f518fdcd36d1638bc37b67630f3ba7eeb4c01f11687eb4e26bce914bbf490d13d56f59d21f90acc9804f0a09d284afde74fc6ccacca28f56c10e960657a8dd3a4f8134bd1c90f4bbe1bd623bccefa1e0ce686f510741603c0b9e0105a0e963216eea8fbfb0d98b40e96f722be41cf4bc4aff2ec18afb5e97ad7ca5efd4af90bd72f0d058da2785e1bfb0495d0938398f2408ac21f8eb7e06766a8a4a63715fdc7dbc692aa26d9d4a6383c5ff37ed59236ace4395d9a5da912ee5104990665a26f052139c7454ccb62161ac58078d61ded99d217a652b3dc7a00c31967644fdf22065621dc48811be505f6ec97229349691a4ffb26acbc500592a6c6e46cfc3917ab624d9fdea86699db692cccdbff0fbbba7',
        }),
      },
    ];
  },
};
