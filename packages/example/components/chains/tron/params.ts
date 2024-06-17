export default {
  addToken: [
    {
      id: 'watchAsset',
      name: 'watchAsset',
      value: JSON.stringify({
        'type': 'trc20',
        'options': {
          'address': 'TF17BgPaZYbz8oxbjhriubPDsA7ArKoLX3',
          'symbol': 'JUST GOV',
          'decimals': 18,
          'image': 'https://static.tronscan.org/production/logo/just_icon.png',
        },
      }),
    },
  ],
  signMessage: [
    {
      id: 'signMessage',
      name: 'signMessage',
      value: '0x01020304',
    },
  ],
  nativeTransfer: (address: string) => [
    {
      id: 'nativeTransfer',
      name: 'nativeTransfer',
      value: JSON.stringify({
        to: address,
        amount: 1000000,
      }),
    },
  ],
  contractTransfer: (address: string) => [
    {
      id: 'contractTransfer-send-usdc-token',
      name: 'Send USDC Token',
      value: JSON.stringify({
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        contractFunction: 'transfer(address,uint256)',
        options: {},
        params: [
          { type: 'address', value: address },
          { type: 'uint256', value: '100' },
        ],
      }),
    },
    {
      id: 'contractTransfer-approve-usdc-token',
      name: 'Approve USDC Token',
      value: JSON.stringify({
        contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        contractFunction: 'approve(address,uint256)',
        options: {},
        params: [
          { type: 'address', value: address },
          { type: 'uint256', value: '100000' },
        ],
      }),
    },
  ],
};
