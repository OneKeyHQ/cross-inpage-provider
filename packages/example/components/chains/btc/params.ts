import { IPresupposeParam } from '../../../components/ApisContainer';

export default {
  switchNetwork: [
    {
      id: 'switchNetwork livenet',
      name: 'switchNetwork livenet',
      value: 'livenet',
    },
    {
      id: 'switchNetwork testnet',
      name: 'switchNetwork testnet',
      value: 'testnet',
    },
  ],
  signMessage: [
    {
      id: 'signMessage ecdsa default',
      name: 'SignMessage ECDSA Default',
      value: JSON.stringify({
        msg: 'Hello World',
      }),
    },
    {
      id: 'signMessage ecdsa',
      name: 'SignMessage ECDSA',
      value: JSON.stringify({
        msg: 'abcdefghijk123456789',
        type: 'ecdsa',
      }),
    },
    {
      id: 'signMessage bip322-simple',
      name: 'SignMessage Bip322-Simple',
      value: JSON.stringify({
        msg: 'hello onekey!',
        type: 'bip322-simple',
      }),
    },
  ],
  sendBitcoin: (address: string) => [
    {
      id: 'sendBitcoin',
      name: 'SendBitcoin',
      value: JSON.stringify({
        toAddress: address,
        satoshis: 1000,
      }),
    },
  ],
  pushTx: [
    {
      id: 'pushTx',
      name: 'PushTx',
      value: '0200000000010135bd7d...',
    },
  ],
  signPsbt: [
    {
      id: 'signPsbt',
      name: 'signPsbt',
      value: JSON.stringify({
        psbtHex: '020000000',
        options: {
          autoFinalized: false,
          toSignInputs: [
            {
              index: 0,
              address: 'tb1q8h8....mjxzny',
            },
            {
              index: 1,
              publicKey: 'tb1q8h8....mjxzny',
              sighashTypes: [1],
            },
            {
              index: 2,
              publicKey: '02062...8779693f',
            },
          ],
        },
      }),
    },
  ],
  signPsbts: [
    {
      id: 'signPsbts',
      name: 'signPsbts',
      value: JSON.stringify({
        psbtHexs: ['020000000', '020000000'],
        options: [
          {
            autoFinalized: false,
            toSignInputs: [
              {
                index: 0,
                address: 'tb1q8h8....mjxzny',
              },
              {
                index: 1,
                publicKey: 'tb1q8h8....mjxzny',
                sighashTypes: [1],
              },
              {
                index: 2,
                publicKey: '02062...8779693f',
              },
            ],
          },
          {
            autoFinalized: false,
            toSignInputs: [
              {
                index: 0,
                address: 'tb1q8h8....mjxzny',
              },
              {
                index: 1,
                publicKey: 'tb1q8h8....mjxzny',
                sighashTypes: [1],
              },
              {
                index: 2,
                publicKey: '02062...8779693f',
              },
            ],
          },
        ],
      }),
    },
  ],
  pushPsbt: [
    {
      id: 'signPsbts',
      name: 'signPsbts',
      value: '020000000',
    },
  ],
};
