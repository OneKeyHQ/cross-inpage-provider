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
};
