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
  signTokenTransaction: (address: string) => [
    {
      id: 'signUSDTransaction-BFC-gas',
      name: 'BUSD_TYPE use BFC gas',
      value: JSON.stringify({
        busdGas: false,
        from: address,
        to: address,
        amount: 1000, // 0.000001 USD
        token: '0x00000000000000000000000000000000000000000000000000000000000000c8::busd::BUSD'
      }),
    },
    {
      id: 'signUSDTransaction-BUSD-gas',
      name: 'BUSD_TYPE use busdGas',
      value: JSON.stringify({
        busdGas: true,
        from: address,
        to: address,
        amount: 1000, // 0.000001 USD
        token: '0x00000000000000000000000000000000000000000000000000000000000000c8::busd::BUSD'
      }),
    }
  ],
};
