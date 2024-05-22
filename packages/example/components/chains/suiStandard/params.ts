export default {
  signMessage: [
    {
      id: 'signMessage',
      name: 'signMessage',
      value: '010203',
    },
  ],
  signPersonalMessage: [
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
};
