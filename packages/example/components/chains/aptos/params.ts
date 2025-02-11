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
    {
      id: 'signTransferUSDC',
      name: 'signTransferUSDC',
      value: JSON.stringify({
        arguments: [address, '1000'],
        function: '0x1::coin::transfer',
        type: 'entry_function_payload',
        type_arguments: ['0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC'],
      }),
    },
    {
      id: 'signTransferDooDoo',
      name: 'signTransferDooDoo',
      value: JSON.stringify({
        arguments: [address, '1000'],
        function: '0x1::coin::transfer',
        type: 'entry_function_payload',
        type_arguments: ['0x73eb84966be67e4697fc5ae75173ca6c35089e802650f75422ab49a8729704ec::coin::DooDoo'],
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
    {
      id: 'transferUSDC',
      name: 'transferUSDC',
      value: JSON.stringify({
        arguments: [address, '1000'],
        function: '0x1::coin::transfer',
        type: 'entry_function_payload',
        type_arguments: ['0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC'],
      }),
    },
    {
      id: 'transferDooDoo',
      name: 'transferDooDoo',
      value: JSON.stringify({
        arguments: [address, '1000'],
        function: '0x1::coin::transfer',
        type: 'entry_function_payload',
        type_arguments: ['0x73eb84966be67e4697fc5ae75173ca6c35089e802650f75422ab49a8729704ec::coin::DooDoo'],
      }),
    },
  ],
};
