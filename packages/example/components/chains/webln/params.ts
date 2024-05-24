export default {
  signMessage: [
    {
      id: 'signMessage',
      name: 'signMessage',
      value: 'Sample message',
    },
  ],
  makeInvoice: [
    {
      id: 'makeInvoice',
      name: 'makeInvoice',
      value: JSON.stringify({
        amount: 1000,
        description: 'Test invoice',
      }),
    },
  ],
  keysend: [
    {
      id: 'keysend',
      name: 'keysend',
      value: JSON.stringify({
        destination: '03006fcf3312dae8d068ea297f58e2bd00ec1ffe214b793eda46966b6294a53ce6',
        amount: '1',
        customRecords: {
          '34349334': 'HELLO AMBOSS',
        },
      }),
    },
  ],
};
