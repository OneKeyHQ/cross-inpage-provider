export default {
  lnurl: [
    {
      id: 'lnurl',
      name: 'lnurl',
      value: 'LNURL1DP68GURN8GHJ7UM9WFMXJCM99E3K7MF0V9CXJ0M385EKVCENXC6R2C35XVUKXEFCV5MKVV34X5EKZD3EV56NYD3HXQURZEPEXEJXXEPNXSCRVWFNV9NXZCN9XQ6XYEFHVGCXXCMYXYMNSERXFQ5FNS',
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
