const { Address, beginCell } = require("@ton/core");
const { TonClient, JettonMaster } = require("@ton/ton");

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

        console.log('Wallet Address:', walletAddress.toString());
        return walletAddress.toString();
    } catch (error) {
        console.error('Error in getJettonWalletAddress:', error);
        return null; // 或者根据需要返回其他值
    }
}

export default {
  sendTransaction: (to: string) => [
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
      name: 'Native Two',
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
      name: 'Native Four',
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
  ],
  sendTransactionWithBody: (to: string) => {
    return [
      {
        id: 'sendTransaction-native',
        name: 'Native with body',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [
            {
              address: to,
              amount: '5000000',
              payload: 'te6ccsEBAQEADAAMABQAAAAASGVsbG8hCaTc/g==',
            },
          ],
        }),
      },
      {
        id: 'sendTransaction-native-stateInit',
        name: 'Native with stateInit and body',
        description: '带 stateInit 只有未初始化的账户才可以转账成功',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 360,
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
    ];
  },
  sendTokenTransaction: async (address: string) => {
    // 定义支持的代币主合约地址
    const jettonMasters = {
      SCALE: "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",
      USDT: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
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
          messages: [{
            address: scaleWallet,
            amount: "150000000",
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
            stateInit: null
          }]
        })
      },
      {
        id: 'sendToken-usdt',
        name: 'Send USDT Token',
        value: JSON.stringify({
          validUntil: Math.floor(Date.now() / 1000) + 360,
          messages: [{
            address: usdtWallet,
            amount: "150000000",
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
            stateInit: null
          }]
        })
      }
    ];
  },
};
