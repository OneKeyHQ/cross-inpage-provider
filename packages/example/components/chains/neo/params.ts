export default {
  switchNetwork: [
    {
      id: 'switchNetwork MainNet',
      name: 'switchNetwork MainNet',
      value: 'MainNet',
    },
    {
      id: 'switchNetwork TestNet',
      name: 'switchNetwork TestNet',
      value: 'TestNet',
    },
  ],
  invokeRead: [
    {
      id: 'invokeRead GAS balance',
      name: 'invokeRead GAS balance',
      value: JSON.stringify({
        scriptHash: 'd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'balanceOf',
        args: [
          {
            type: 'Address',
            value: 'NaUjKgf5vMuFt7Ffgfffcpc41uH3adx1jq',
          },
        ],
        signers: [
          {
            account: '2cab903ff032ac693f8514581665be534beac39f',
            scopes: 1,
          },
        ],
      }),
    },
  ],
  signMessage: [
    {
      id: 'signMessage',
      name: 'Sign Message',
      value: 'Hello OneKey NEO Wallet',
    },
  ],
};
