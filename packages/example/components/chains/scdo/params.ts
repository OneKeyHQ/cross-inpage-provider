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
      id: 'sendTransaction-erc20-contract',
      name: 'ERC20 Token',
      value: JSON.stringify({
        from: from,
        payload:
          '0xa9059cbb0000000000000000000000000118a02f993fc7a4348fd36b7f7a596948f02b310000000000000000000000000000000000000000000000000000000000002710',
        to: '1S015daca201b66f96f74b4230916f9db8db0c0002',
      }),
    },
    {
      id: 'sendTransaction-big-payload',
      name: 'Big Payload',
      value: JSON.stringify({
        from: from,
        payload: `0x${'010203040506070809'.repeat(600)}`,
        to: from,
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
