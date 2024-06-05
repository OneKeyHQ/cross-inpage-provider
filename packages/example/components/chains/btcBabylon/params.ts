import BTCParams from '../btc/params';

export default {
  ...BTCParams,
  getUtxos: (address: string) => [
    {
      id: 'getUtxos',
      name: 'getUtxos',
      value: JSON.stringify({
        address: address,
        amount: 1000,
      }),
    },
  ],
  signMessageBip322: [
    {
      id: 'signMessageBip322',
      name: 'signMessageBip322',
      value: 'Hello World',
    },
  ],
};
