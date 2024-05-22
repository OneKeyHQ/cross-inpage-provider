export default {
  signRaw: [
    {
      id: 'signRaw',
      name: 'signRaw',
      value: 'message to sign',
    },
  ],
  signAndSend: (address: string) => [
    {
      id: 'signAndSend',
      name: 'signAndSend',
      value: JSON.stringify({
        to: address,
        value: '10000',
      }),
    },
  ],
};
