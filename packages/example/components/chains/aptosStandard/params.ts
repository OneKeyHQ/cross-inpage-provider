import { AccountAddress, U256, U8 } from '@aptos-labs/ts-sdk';
import { isEmpty } from 'lodash';

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
      id: 'signTransaction-native',
      name: 'transfer native coin',
      value: JSON.stringify({
        transactionOrPayload: {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
          arguments: [address, '100000'],
        },
      }),
    },
    {
      id: 'signTransaction-native-options',
      name: 'transfer native coin - options',
      value: JSON.stringify({
        transactionOrPayload: {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
          arguments: [address, '100000'],
        },
        options: {
          maxGasAmount: 1000000,
          gasUnitPrice: 1000000,
        },
      }),
    },
    {
      id: 'signTransaction-usdc-legacy',
      name: 'transfer usdc coin (legacy)',
      value: JSON.stringify({
        transactionOrPayload: {
          type: 'entry_function_payload',
          function: '0x1::coin::transfer',
          type_arguments: [
            '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
          ],
          arguments: [address, 100000],
        },
      }),
    },
    {
      id: 'signTransaction-usdc-fa',
      name: 'transfer usdc coin',
      value: JSON.stringify({
        transactionOrPayload: {
          type: 'entry_function_payload',
          function: '0x1::primary_fungible_store::transfer',
          type_arguments: ['0x1::fungible_asset::Metadata'],
          arguments: [
            '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
            address,
            100000,
          ],
        },
      }),
    },
  ],
  signAndSubmitTransaction: (address: string) => [
    {
      id: 'transaction-native-pure',
      name: 'transfer native coin pure',
      value: JSON.stringify({
        sender: address,
        data: {
          function: '0x1::coin::transfer',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [address, '100000'],
        },
      }),
    },
    {
      id: 'signTransaction-native-pure-options',
      name: 'transfer native coin pure - options',
      value: JSON.stringify({
        sender: address,
        data: {
          function: '0x1::coin::transfer',
          typeArguments: ['0x1::aptos_coin::AptosCoin'],
          functionArguments: [address, '100000'],
        },
        options: {
          maxGasAmount: 1000000,
          gasUnitPrice: 1000000,
        },
      }),
    },
    // {
    //   id: 'signTransaction-native',
    //   name: 'transfer native coin',
    //   value: JSON.stringify({
    //     sender: address,
    //     data: {
    //       function: '0x1::coin::transfer',
    //       typeArguments: ['0x1::aptos_coin::AptosCoin'],
    //       functionArguments: [
    //         address && !isEmpty(address) ? AccountAddress.fromString(address) : undefined,
    //         new U256(100000),
    //       ],
    //     },
    //   }),
    // },
    // {
    //   id: 'signTransaction-usdc-legacy',
    //   name: 'transfer usdc coin (legacy)',
    //   value: JSON.stringify({
    //     sender: address,
    //     data: {
    //       function: '0x1::coin::transfer',
    //       typeArguments: [
    //         '0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC',
    //       ],
    //       functionArguments: [address, new U256(100000)],
    //     },
    //   }),
    // },
  ],
};
