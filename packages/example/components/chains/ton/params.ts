/* eslint-disable @typescript-eslint/no-var-requires */
const { Address, beginCell } = require('@ton/core');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { TonClient, JettonMaster } = require('@ton/ton');

const client = new TonClient({
  endpoint: 'https://toncenter.com/api/v2/jsonRPC',
});
async function getJettonWalletAddress(jettonMasterAddressStr: string, userAddressStr: string) {
  try {
    const jettonMasterAddress = Address.parse(jettonMasterAddressStr);
    const userAddress = Address.parse(userAddressStr);

    const jettonMaster = client.open(JettonMaster.create(jettonMasterAddress));
    const walletAddress = await jettonMaster.getWalletAddress(userAddress);

    if (!walletAddress) {
      throw new Error('Wallet address is empty');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.log('Wallet Address:', walletAddress.toString());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return walletAddress.toString();
  } catch (error) {
    console.error('Error in getJettonWalletAddress:', error);
    return null; // 或者根据需要返回其他值
  }
}

export default {
  sendTransaction: (to: string) => {
    let bounceableAddress = '';
    let nonBounceableAddress = '';
    let rawAddress = '';

    try {
      const address = Address.parse(to ?? '');
      bounceableAddress = address.toString({ bounceable: true });
      nonBounceableAddress = address.toString({ bounceable: false });
      rawAddress = address.toRawString();
    } catch (error) {
      // ignore
    }

    return [
      {
        id: 'sendTransaction-native',
        name: 'Native',
        value: JSON.stringify({
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-two',
        name: 'Native 2 Message',
        value: JSON.stringify({
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-four',
        name: 'Native 4 Message',
        value: JSON.stringify({
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-validUntil-less-5-minutes',
        name: 'Native validUntil less 5 minutes',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 60 * 3,
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-validUntil-more-5-minutes',
        name: 'Native validUntil more than 5 minutes',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 60 * 10,
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-bounceable-address-type',
        name: 'Native bounceable address type',
        value: JSON.stringify({
          messages: [
            {
              to: bounceableAddress,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-non-bounceable-address-type',
        name: 'Native non-bounceable address type',
        value: JSON.stringify({
          messages: [
            {
              to: nonBounceableAddress,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-stateInit',
        name: 'Native with stateInit',
        value: JSON.stringify({
          messages: [
            {
              address:to,
              amount: '20000000', //Toncoin in nanotons
              stateInit:
                'te6cckEBBAEAOgACATQCAQAAART/APSkE/S88sgLAwBI0wHQ0wMBcbCRW+D6QDBwgBDIywVYzxYh+gLLagHPFsmAQPsAlxCarA==',
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-payload',
        name: 'Native with payload',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
              payload: 'te6ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g==',
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-payload-and-stateInit',
        name: 'Native with payload and stateInit',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '5000000',
              stateInit:
                'te6cckEBBAEAOgACATQCAQAAART/APSkE/S88sgLAwBI0wHQ0wMBcbCRW+D6QDBwgBDIywVYzxYh+gLLagHPFsmAQPsAlxCarA==',
              payload: 'te6ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g==',
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-network',
        name: 'Native with network',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          network: '-239',
        }),
      },
      {
        id: 'sendTransaction-native-with-from-bounceable-address',
        name: 'Native with from bounceable address',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          from: bounceableAddress,
        }),
      },
      {
        id: 'sendTransaction-native-with-from-non-bounceable-address',
        name: 'Native with from non-bounceable address',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          from: nonBounceableAddress,
        }),
      },
      {
        id: 'sendTransaction-native-with-from-raw-address',
        name: 'Native with from raw address',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          from: rawAddress,
        }),
      },
    ];
  },
  signData: (to: string) => {
    return [
      {
        id: 'signData-text',
        name: 'Text',
        value: JSON.stringify({
          "type": "text",
          "text": "Hello, TON!"
        }),
      },
      {
        id: 'signData-binary',
        name: 'Binary',
        value: JSON.stringify({
          "type": "binary",
          "bytes": "SGVsbG8sIFRPTiE="
        }),
      },
      {
        id: 'signData-cell',
        name: 'Cell',
        value: JSON.stringify({
          "type": "cell",
          "schema": "message#_ text:string = Message;",
          "cell": "te6cckEBAQEAEQAAHgAAAABIZWxsbywgVE9OIb7WCx4="
        }),
      },
      {
        id: 'signData-cell-cn',
        name: 'Cell',
        value: JSON.stringify({
          "type": "cell",
          "schema": "message#_ text:string = 我是中文，中文日本語한국어العربيةРусскийDeutschFrançaisEspañolΕλληνικάहिन्दीไทยTiếngViệtעברית🌍;",
          "cell": "te6cckEBAQEAEQAAHgAAAABIZWxsbywgVE9OIb7WCx4="
        }),
      },
    ];
  },
  sendTransactionWithError: (to: string) => {
    let bounceableAddress = '';
    let nonBounceableAddress = '';
    let rawAddress = '';

    try {
      const address = Address.parse(to);
      bounceableAddress = address.toString({ bounceable: true });
      nonBounceableAddress = address.toString({ bounceable: false });
      rawAddress = address.toRawString();
    } catch (error) {
      // ignore
    }
    return [
      {
        id: 'sendTransaction-native',
        name: 'Empty Message',
        value: JSON.stringify({
          messages: [],
        }),
      },
      {
        id: 'sendTransaction-native-invalid-message-1',
        name: '1 message is valid and 1 is invalid',
        value: JSON.stringify({
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
            {
              address: to, // destination address
              amount: '50000000000000000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-validUntil-outdated',
        name: 'Native validUntil outdated',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) - 10,
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-validUntil-NaN',
        name: 'Native validUntil NaN',
        value: JSON.stringify({
          validUntil: NaN,
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-validUntil-null',
        name: 'Native validUntil null',
        value: JSON.stringify({
          validUntil: null,
          messages: [
            {
              address: to, // destination address
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-without-address',
        name: 'Native without address',
        value: JSON.stringify({
          validUntil: null,
          messages: [
            {
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-raw-address-type',
        name: 'Native raw address type',
        value: JSON.stringify({
          messages: [
            {
              address: rawAddress,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      // invalid address (2nd letter omitted)
      {
        id: 'sendTransaction-native-invalid-address',
        name: 'Native invalid address',
        value: JSON.stringify({
          messages: [
            {
              address: to?.replace('UQC', 'UC'),
              amount: '20000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-max-amount',
        name: 'Native invalid address',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '500000000000000', //Toncoin in nanotons
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-without-amount',
        name: 'Native without amount',
        value: JSON.stringify({
          messages: [
            {
              address: to,
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-amount-integer',
        name: 'Native without amount',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: 20000,
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-stateInit-error',
        name: 'Native with stateInit error',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
              stateInit:
                'te7cckEBBAEAOgACATQCAQAAART/APSkE/S88sgLAwBI0wHQ0wMBcbCRW+D6QDBwgBDIywVYzxYh+gLLagHPFsmAQPsAlxCarA==',
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-payload-error',
        name: 'Native with payload error',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
              payload: 'te7ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g==',
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-with-network-error',
        name: 'Native with network error',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          network: '-3',
        }),
      },
      {
        id: 'sendTransaction-native-with-network-integer-error',
        name: 'Native with network integer error',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          network: -239,
        }),
      },
      {
        id: 'sendTransaction-native-with-from-address-error',
        name: 'Native with from bounceable address error',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          from: to?.replace('UQC', 'UC'),
        }),
      },
      {
        id: 'sendTransaction-native-with-from-address-not-match',
        name: 'Native with from address not match',
        value: JSON.stringify({
          messages: [
            {
              address: to,
              amount: '20000000', //Toncoin in nanotons
            },
          ],
          from: 'EQCKWpx7cNMpvmcN5ObM5lLUZHZRFKqYA4xmw9jOry0ZsF9M',
        }),
      },
    ];
  },
  sendTokenTransaction: async (address: string) => {
    // 定义支持的代币主合约地址
    const jettonMasters = {
      SCALE: 'EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE',
      USDT: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    };

    // 获取所有代币的钱包地址
    const scaleWallet = await getJettonWalletAddress(jettonMasters.SCALE, address);
    const usdtWallet = await getJettonWalletAddress(jettonMasters.USDT, address);

    if (!scaleWallet || !usdtWallet) {
      throw new Error('无法获取代币钱包地址');
    }

    return [
      {
        id: 'sendToken-scale',
        name: 'Send SCALE Token',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: scaleWallet,
              amount: '150000000',
              payload: beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(0, 64)
                .storeCoins(10000000000)
                .storeAddress(Address.parse(address))
                .storeAddress(Address.parse(address))
                .storeCoins(0)
                .storeBit(0)
                .storeBit(0)
                .storeRef(beginCell().endCell())
                .endCell()
                .toBoc()
                .toString('base64'),
              stateInit: null,
            },
          ],
        }),
      },
      {
        id: 'sendToken-usdt',
        name: 'Send USDT Token',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: usdtWallet,
              amount: '150000000',
              payload: beginCell()
                .storeUint(0xf8a7ea5, 32)
                .storeUint(0, 64)
                .storeCoins(100000)
                .storeAddress(Address.parse(address))
                .storeAddress(Address.parse(address))
                .storeCoins(0)
                .storeBit(0)
                .storeBit(0)
                .storeRef(beginCell().endCell())
                .endCell()
                .toBoc()
                .toString('base64'),
              stateInit: null,
            },
          ],
        }),
      },
    ];
  },
};
