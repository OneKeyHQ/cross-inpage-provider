/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { parseChainId } from '../../utils';
import {
  ERC20_USDC_CONTRACTS,
  ERC721_SAMPLE_CONTRACTS,
  MALICIOUS_ADDRESS,
  MALICIOUS_CONTRACT_ADDRESSES,
  NETWORKS_BY_CHAIN_ID,
} from '../contract/SampleContracts';

export default {
  sendTransaction: (from: string, to: string) => {
    return [
      {
        'id': 'sendTransaction-malicious-raw-eth-transfer',
        'name': '恶意行为：风险 Native Token 转账',
        'description': '转账给 Blockaid 标记的高风险地址',
        'value': JSON.stringify({
          from,
          to: MALICIOUS_ADDRESS,
          value: '0x9184e72a000',
        }),
      },
      {
        'id': 'sendTransaction-malicious-raw-eth-transfer-odd-hex-data',
        'name': '绕过安全检测：风险 Native Token 转账（odd hex data 绕过）',
        'description':
          '使用 odd hex data 绕过安全检测，因为 to 地址是 EOA 而不是合约地址，他有存在一个异常的 data 字段，让这笔交易看起来既不是转账也不是合约调用。从而绕过安全检测',
        'value': JSON.stringify({
          from,
          to: MALICIOUS_ADDRESS,
          value: '0x9184e72a000',
          data: '0x1',
        }),
      },
      {
        'id': 'sendTransaction-malicious-raw-eth-transfer-without-0x-prefix',
        'name': '绕过安全检测：风险 Native Token 转账（删除 Hex 0x 前缀绕过）',
        'description':
          '使用删除 Hex 的 0x 前缀绕过安全的检测，标准的以太坊十六进制值应该包含 0x 前缀，这里删除 0x 前缀，导致链上能正常执行，从而绕过安全检测',
        'value': JSON.stringify({
          from,
          to: MALICIOUS_ADDRESS,
          value: 'ffffffffffffff',
        }),
      },
    ];
  },
  sendTransactionERC20: (from: string, chainId: string) => {
    // @ts-expect-error
    const networkName = NETWORKS_BY_CHAIN_ID[
      parseChainId(chainId)
    ] as keyof typeof ERC20_USDC_CONTRACTS;

    const erc20Contract = ERC20_USDC_CONTRACTS[networkName];

    const contractAddress =
      // @ts-expect-error
      MALICIOUS_CONTRACT_ADDRESSES[networkName] || MALICIOUS_CONTRACT_ADDRESSES.default;

    const erc721Contract = ERC721_SAMPLE_CONTRACTS[networkName];

    return [
      {
        'id': 'sendTransaction-malicious-erc20-transfer',
        'name': '恶意行为：风险 ERC20 转账',
        'description': '转 ERC20 Token 给 Blockaid 标记的高风险地址',
        'value': JSON.stringify({
          from: from,
          to: erc20Contract,
          data: '0xa9059cbb0000000000000000000000005fbdb2315678afecb367f032d93f642f64180aa30000000000000000000000000000000000000000000000000000000000000064',
        }),
      },
      {
        'id': 'sendTransaction-malicious-erc20-approve',
        'name': '恶意行为：风险 ERC20 授权',
        'description': '将 ERC20 Token 授权给 Blockaid 标记的高风险地址',
        'value': JSON.stringify({
          from: from,
          to: erc20Contract,
          data: '0x095ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
        }),
      },
      {
        'id': 'sendTransaction-malicious-contract-call',
        'name': '恶意行为：风险合约调用',
        'description': '调用 Blockaid 标记的恶意合约',
        'value': JSON.stringify({
          from,
          to: contractAddress,
          data: '0xef5cfb8c0000000000000000000000000b3e87a076ac4b0d1975f0f232444af6deb96c59',
          value: '0x0',
        }),
      },
      {
        'id': 'sendTransaction-malicious-erc721-approve',
        'name': '恶意行为：风险 ERC721 授权',
        'description': '将 ERC721 Token 授权给 Blockaid 标记的高风险地址',
        'value': JSON.stringify({
          from,
          to: erc721Contract,
          data: '0xa22cb465000000000000000000000000b85492afc686d5ca405e3cd4f50b05d358c75ede0000000000000000000000000000000000000000000000000000000000000001',
        }),
      },
      {
        'id': 'sendTransaction-malicious-erc20-approve-odd-hex-data',
        'name': '绕过安全检测：风险 ERC20 授权（odd hex data 绕过）',
        'description':
          '使用 odd hex data 绕过安全的检测，正常的 ERC20 approve 函数签名正常是 0x095ea7b3... ，这里去掉开头的 0，使用 0x95ea7b3，导致链上能正常执行，从而绕过安全检测',
        'value': JSON.stringify({
          from,
          to: erc20Contract,
          value: '0x0',
          // odd approve hex data - expected 0x095ea7b3...
          data: '0x95ea7b3000000000000000000000000e50a2dbc466d01a34c3e8b7e8e45fce4f7da39e6000000000000000000000000000000000000000000000000ffffffffffffffff',
        }),
      },
    ];
  },
  signTypedData: (from: string, chainId: number) => {
    const chainIdPadded = `0x${chainId.toString(16).padStart(77, '0')}`;
    return [
      {
        'id': 'signTypedData-malicious-permit',
        'name': '恶意行为：风险 Permit signTypedDataV4 签名',
        'description': 'Permit 授权给 Blockaid 标记的高风险地址；此类交易需要检查 spender 是否是可信地址',
        'value': `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"USD Coin","verifyingContract":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","chainId":${chainId},"version":"2"},"message":{"owner":"${from}","spender":"0x1661F1B207629e4F385DA89cFF535C8E5Eb23Ee3","value":"1033366316628","nonce":1,"deadline":1678709555}}`,
      },
      {
        'id': 'signTypedData-malicious-trade-order',
        'name': '恶意行为：风险 Trade Order 签名',
        'description': 'Trade Order 挂单，taker 为 Blockaid 标记的高风险地址； 此类交易对 taker 交易对手方进行风险评估, 检查 direction 方向 - 0 表示出售NFT，maker 是 NFT 持有者，',
        'value': `{"types":{"ERC721Order":[{"type":"uint8","name":"direction"},{"type":"address","name":"maker"},{"type":"address","name":"taker"},{"type":"uint256","name":"expiry"},{"type":"uint256","name":"nonce"},{"type":"address","name":"erc20Token"},{"type":"uint256","name":"erc20TokenAmount"},{"type":"Fee[]","name":"fees"},{"type":"address","name":"erc721Token"},{"type":"uint256","name":"erc721TokenId"},{"type":"Property[]","name":"erc721TokenProperties"}],"Fee":[{"type":"address","name":"recipient"},{"type":"uint256","name":"amount"},{"type":"bytes","name":"feeData"}],"Property":[{"type":"address","name":"propertyValidator"},{"type":"bytes","name":"propertyData"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"ZeroEx","version":"1.0.0","chainId":${chainId},"verifyingContract":"0xdef1c0ded9bec7f1a1670819833240f027b25eff"},"primaryType":"ERC721Order","message":{"direction":"0","maker":"${from}","taker":"${MALICIOUS_ADDRESS}","expiry":"2524604400","nonce":"100131415900000000000000000000000000000083840314483690155566137712510085002484","erc20Token":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","erc20TokenAmount":"42000000000000","fees":[],"erc721Token":"0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e","erc721TokenId":"2516","erc721TokenProperties":[]}}`,
      },
      {
        'id': 'signTypedData-malicious-seaport-order',
        'name': '恶意行为：风险 OpenSea Seaport 交易',
        'description':
          '模拟正常的 OpenSea Seaport 交易，实际上这个签名会授权将用户的多个 NFT 转移给攻击者地址，（Blockaid）; 此类交易需要检查 consideration 是否包含合理的对价,r ecipient是否是可信地址',
        'value': `{"types":{"OrderComponents":[{"name":"offerer","type":"address"},{"name":"zone","type":"address"},{"name":"offer","type":"OfferItem[]"},{"name":"consideration","type":"ConsiderationItem[]"},{"name":"orderType","type":"uint8"},{"name":"startTime","type":"uint256"},{"name":"endTime","type":"uint256"},{"name":"zoneHash","type":"bytes32"},{"name":"salt","type":"uint256"},{"name":"conduitKey","type":"bytes32"},{"name":"counter","type":"uint256"}],"OfferItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"}],"ConsiderationItem":[{"name":"itemType","type":"uint8"},{"name":"token","type":"address"},{"name":"identifierOrCriteria","type":"uint256"},{"name":"startAmount","type":"uint256"},{"name":"endAmount","type":"uint256"},{"name":"recipient","type":"address"}],"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}]},"domain":{"name":"Seaport","version":"1.1","chainId":${chainId},"verifyingContract":"0x00000000006c3852cbef3e08e8df289169ede581"},"primaryType":"OrderComponents","message":{"offerer":"0x5a6f5477bdeb7801ba137a9f0dc39c0599bac994","zone":"0x004c00500000ad104d7dbd00e3ae0a5c00560c00","offer":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1"}],"consideration":[{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"26464","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"7779","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0x60e4d786628fea6478f785a6d7e704777c86a7c6","identifierOrCriteria":"4770","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"9594","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"2118","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"},{"itemType":"2","token":"0xba30e5f9bb24caa003e9f2f0497ad287fdf95623","identifierOrCriteria":"1753","startAmount":"1","endAmount":"1","recipient":"0xdfdc0b1cf8e9950d6a860af6501c4fecf7825cc1"}],"orderType":"2","startTime":"1681810415","endTime":"1681983215","zoneHash":"0x0000000000000000000000000000000000000000000000000000000000000000","salt":"1550213294656772168494388599483486699884316127427085531712538817979596","conduitKey":"0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000","counter":"0"}}`,
      },
      {
        'id': 'signTypedData-malicious-permit-padding-chainId',
        'name': '绕过安全检测：风险 Permit 签名（chainId 前面加很多 0 绕过检测）',
        'description':
          '在 chainId 前面加很多 0 绕过安全的检测，标准的 chainId 应该是简单的数值，这里在 chainId 前面加很多 0，导致链上能正常执行，从而绕过安全检测',
        'value': `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"USD Coin","verifyingContract":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","chainId":"${chainIdPadded}","version":"2"},"message":{"owner":"${from}","spender":"0x1661F1B207629e4F385DA89cFF535C8E5Eb23Ee3","value":"1033366316628","nonce":1,"deadline":1678709555}}`,
      },
      {
        'id': 'signTypedData-malicious-permit-int-address',
        'name': '绕过安全检测：风险 Permit 签名（int address）',
        'description':
          '使用 int address 绕过安全的检测，通常以太坊地址是十六进制字符串表示，这里使用十进制类型来表示地址，导致链上能正常执行，从而绕过安全检测',
        'value': `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Permit":[{"name":"owner","type":"address"},{"name":"spender","type":"address"},{"name":"value","type":"uint256"},{"name":"nonce","type":"uint256"},{"name":"deadline","type":"uint256"}]},"primaryType":"Permit","domain":{"name":"USD Coin","verifyingContract":"917551056842671309452305380979543736893630245704","chainId":${chainId},"version":"2"},"message":{"owner":"${from}","spender":"0x1661F1B207629e4F385DA89cFF535C8E5Eb23Ee3","value":"1033366316628","nonce":1,"deadline":1678709555}}`,
      },
    ];
  },
};
