export default {
  signTransaction: (from: string, to: string) => [
    {
      id: 'signTransaction',
      name: 'signTransaction',
      value: JSON.stringify({
        accountNonce: 0,
        amount: 10,
        from,
        gasLimit: 21000,
        gasPrice: 1,
        hash: '0x258791d390b94380b64ad72efb7b434489d8298db770e796f42dc3876de49ca4',
        payload: '',
        to,
      }),
    },
  ],
  sendTransaction: (from: string, to: string) => [
    {
      id: 'sendTransaction-native',
      name: 'Native',
      value: JSON.stringify({
        amount: 10,
        from: from,
        to: to,
      }),
    },
    {
      id: 'sendTransaction-contract',
      name: 'Contract',
      value: JSON.stringify({
        from: from,
        payload:
          '0xa9059cbb000000000000000000000000016cc151292ade2936ca8b1764240061f9673c51000000000000000000000000000000000000000000000000000000000000000a',
        to: '',
      }),
    },
  ],
  estimateGas: (from: string, to: string) => [
    {
      id: 'sendTransaction-native',
      name: 'Native',
      value: JSON.stringify({
        'accountNonce': 0,
        'amount': 9800000000,
        'from': from,
        'gasLimit': 21000,
        'gasPrice': 1,
        'hash': '0x258791d390b94380b64ad72efb7b434489d8298db770e796f42dc3876de49ca4',
        'payload': '',
        'signature': {
          'Sig':
            'CCQnmyI2Bf85eqFHJ8uFGiZFk2DVH9W5R3Q2GXJ648RcVrtIt4guxZ/Z7c4sm5tWjKp5jqw2K9DdnOiTRXPkTgE=',
        },
        'to': to,
      }),
    },
  ],
};
