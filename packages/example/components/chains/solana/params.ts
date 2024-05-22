export default {
  signMessage: [
    {
      id: 'signMessage',
      name: 'signMessage',
      value: 'hello',
    },
  ],
  signAndSendTransaction: (publicKey: string) => [
    {
      id: 'signAndSendTransaction',
      name: 'Normal Transaction',
      value: JSON.stringify({
        toPubkey: publicKey,
        amount: 100,
      }),
    },
  ],
  signMultipleTransaction: (publicKey: string) => [
    {
      id: 'signMultipleTransaction',
      name: 'Sign Multiple Transaction',
      value: JSON.stringify([
        {
          toPubkey: publicKey,
          amount: 100,
        },
        {
          toPubkey: publicKey,
          amount: 100,
        },
      ]),
    },
  ],
};
