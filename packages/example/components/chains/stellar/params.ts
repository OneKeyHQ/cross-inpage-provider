/* eslint-disable @typescript-eslint/no-inferrable-types */
// Example message for signing
const exampleMessage = 'Hello, Stellar!';

// Example destination address for testnet
const EXAMPLE_DESTINATION = 'GBNRYB34IYJ2MM44ADABDJPEVF6YYQM4PGWWMCXI3JFVYVEFRHAO7BSX';

const params = {
  // Build and sign payment transaction
  buildPayment: (address: string = '') => [
    {
      id: 'buildPayment',
      name: 'Build Payment Transaction',
      value: JSON.stringify(
        {
          sourceAddress: address,
          destinationAddress: EXAMPLE_DESTINATION,
          amount: '10', // 10 XLM
          memo: 'Test Payment',
        },
        null,
        2,
      ),
    },
  ],

  // Build trust transaction (for custom assets)
  buildTrust: (address: string = '') => [
    {
      id: 'buildTrust',
      name: 'Build Trust Asset Transaction',
      value: JSON.stringify(
        {
          sourceAddress: address,
          assetCode: 'USDC',
          assetIssuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
          limit: '1000000',
        },
        null,
        2,
      ),
    },
  ],

  // Build create account transaction
  buildCreateAccount: (address: string = '') => [
    {
      id: 'buildCreateAccount',
      name: 'Build Create Account Transaction',
      value: JSON.stringify(
        {
          sourceAddress: address,
          destinationAddress: EXAMPLE_DESTINATION,
          startingBalance: '2', // Minimum 1 XLM, 2 for safety
        },
        null,
        2,
      ),
    },
  ],

  // Sign message
  signMessage: [
    {
      id: 'signMessage',
      name: 'Sign Message',
      value: JSON.stringify(
        {
          message: exampleMessage,
        },
        null,
        2,
      ),
    },
  ],

  // Sign message with address
  signMessageFull: (address: string = '') => [
    {
      id: 'signMessageFull',
      name: 'Sign Message (With Address)',
      value: JSON.stringify(
        {
          message: exampleMessage,
          address: address,
        },
        null,
        2,
      ),
    },
  ],

  // Mock sign auth entry (for Soroban testing)
  signAuthEntryMock: (address: string = '') => [
    {
      id: 'signAuthEntryMock',
      name: 'Sign Auth Entry (Mock)',
      value: JSON.stringify(
        {
          sourceAddress: address,
        },
        null,
        2,
      ),
    },
  ],

  // Real sign auth entry - balance query (read-only)
  signAuthEntryReal: (address: string = '') => [
    {
      id: 'signAuthEntryReal',
      name: 'Query Token Balance (Real RPC)',
      value: JSON.stringify(
        {
          sourceAddress: address,
          operation: 'balance',
        },
        null,
        2,
      ),
    },
  ],

  // Real sign auth entry - token transfer
  signAuthEntryTransfer: (address: string = '') => [
    {
      id: 'signAuthEntryTransfer',
      name: 'Transfer Token (Real RPC)',
      value: JSON.stringify(
        {
          sourceAddress: address,
          destinationAddress: EXAMPLE_DESTINATION,
          amount: '1000000', // 1 USDC (6 decimals)
          operation: 'transfer',
        },
        null,
        2,
      ),
    },
  ],
};

export default params;
