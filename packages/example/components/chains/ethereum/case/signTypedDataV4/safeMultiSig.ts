import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-safe-multisig',
  name: 'safe: Multi-signature Transaction',
  description: 'SignTypedDataV4 Safe Multi-signature Transaction',
  value: JSON.stringify({
    types: {
      SafeTx: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'operation', type: 'uint8' },
        { name: 'safeTxGas', type: 'uint256' },
        { name: 'baseGas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'gasToken', type: 'address' },
        { name: 'refundReceiver', type: 'address' },
        { name: 'nonce', type: 'uint256' }
      ],
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    domain: {
      chainId: params.chainId.toString(),
      verifyingContract: '0x76f3f64cb3cd19debee51436df630a342b736c24' // Safe contract address
    },
    primaryType: 'SafeTx',
    message: {
      to: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC contract
      value: '0',
      data: '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa96045000000000000000000000000000000000000000000000000000000000000000064', // transfer(address,uint256)
      operation: 0, // Call
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: '0'
    }
  })
});
