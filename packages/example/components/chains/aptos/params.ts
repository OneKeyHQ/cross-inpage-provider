export default {
  signMessage: [
    {
      id: 'signMessage',
      name: 'signMessage',
      value: JSON.stringify({
        address: false,
        application: true,
        chainId: true,
        message: 'This is a sample message',
        nonce: 12345,
      }),
    },
  ],
  signTransaction: (address: string) => [
    {
      id: 'signTransaction',
      name: 'signTransaction',
      value: JSON.stringify({
        arguments: [address, '100000'],
        function: '0x1::coin::transfer',
        type: 'entry_function_payload',
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
      }),
    },
  ],
  signGenericTransaction: (address: string) => [
    {
      id: 'signGenericTransaction',
      name: 'signGenericTransaction',
      value: JSON.stringify({
        args: [address, '100000'],
        func: '0x1::coin::transfer',
        type_args: ['0x1::aptos_coin::AptosCoin'],
      }),
    },
  ],
};
