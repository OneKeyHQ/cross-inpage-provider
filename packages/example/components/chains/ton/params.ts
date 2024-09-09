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
};
