export default {
  signMessage: [
    {
      id: 'signMessage hello',
      name: 'signData Hello',
      value: '48656c6c6f204f6e654b6579',
    },
    {
      id: 'signMessage',
      name: 'signMessage',
      value: '010203',
    },
  ],
  signPersonalMessage: [
    {
      id: 'signPersonalMessage hello',
      name: 'signPersonalMessage Hello',
      value: '48656c6c6f204f6e654b6579',
    },
    {
      id: 'signPersonalMessage',
      name: 'signPersonalMessage',
      value: '010203',
    },
  ],
  signTransaction: (address: string) => [
    {
      id: 'signTransaction',
      name: 'signTransaction',
      value: JSON.stringify({
        from: address,
        to: address,
        amount: 100000,
      }),
    },
  ],
  sendToAddressBalance: (address: string) => [
    {
      id: 'sendToAddressBalance',
      name: 'coin::send_funds (deposit to address balance)',
      value: JSON.stringify({
        from: address,
        to: address,
        amount: 100000, // MIST = 0.0001 SUI
        coinType: '0x2::sui::SUI', // 资产类型，可改为任意 coin type
      }),
    },
  ],
  withdrawFromAddressBalance: (address: string) => [
    {
      id: 'withdrawFromAddressBalance',
      name: 'coin::redeem_funds (spend address balance)',
      value: JSON.stringify({
        from: address,
        to: address,
        amount: 100000, // MIST = 0.0001 SUI
        coinType: '0x2::sui::SUI', // 资产类型，可改为任意 coin type
      }),
    },
  ],
  signMultiRecipientTransaction: (address: string) => [
    {
      id: 'signTransaction-multi-recipient',
      name: 'signTransaction Multi Recipient',
      value: JSON.stringify({
        from: address,
        recipients: [address, address],
        amount: 1,
      }),
    },
  ],
  signTokenTransaction: (address: string) => [
    {
      id: 'signUSDCransaction',
      name: 'USDC_TYPE',
      value: JSON.stringify({
        from: address,
        to: address,
        amount: 1000, // 0.000001 USD
        token: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN'      
      }),
    },
  ],
};
