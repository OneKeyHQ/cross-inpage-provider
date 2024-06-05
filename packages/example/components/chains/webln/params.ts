export default {
  lnurl: [
    {
      id: 'lnurl',
      name: 'lnurl',
      value:
        'LNURL1DP68GURN8GHJ7UM9WFMXJCM99E3K7MF0V9CXJ0M385EKVCENXC6R2C35XVUKXEFCV5MKVV34X5EKZD3EV56NYD3HXQURZEPEXEJXXEPNXSCRVWFNV9NXZCN9XQ6XYEFHVGCXXCMYXYMNSERXFQ5FNS',
    },
  ],
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
      name: 'Make normal invoice',
      value: JSON.stringify({
        amount: 1000,
        defaultMemo: 'Test invoice',
      }),
    },
    {
      id: 'makeInvoice-default',
      name: 'Make normal default invoice',
      value: JSON.stringify({
        amount: 1000,
        defaultAmount: 1001,
        defaultMemo: 'Test invoice',
      }),
    },
    {
      id: 'makeInvoice-max',
      name: 'Make Max invoice',
      value: JSON.stringify({
        defaultAmount: 1001,
        maximumAmount: 1000,
        defaultMemo: 'Test max invoice',
      }),
    },
    {
      id: 'makeInvoice-min',
      name: 'Make Min invoice',
      value: JSON.stringify({
        defaultAmount: 10,
        minimumAmount: 100,
        defaultMemo: 'Test min invoice',
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
