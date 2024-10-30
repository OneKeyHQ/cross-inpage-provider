import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permitBatchTransferFrom',
  name: 'permit2: PermitBatchTransferFrom 方法',
  description: 'SignTypedDataV4 PermitBatchTransferFrom 方法',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      PermitBatchTransferFrom: [
        { name: 'permitted', type: 'TokenPermissions[]' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
      TokenPermissions: [
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
    },
    primaryType: 'PermitBatchTransferFrom',
    domain: {
      name: 'PermitTransfer',
      version: '1',
      chainId: params.chainId.toString(),
      verifyingContract: '0x000000000022D473030F116dDEE9F6B43aC78BA3', // Example contract address
    },
    message: {
      permitted: [
        {
          token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Example USDC token address
          amount: '1000000', // 1 USDC (6 decimals)
        },
        {
          token: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Example USDT token address
          amount: '1000000', // 1 USDT (6 decimals)
        },
      ],
      spender: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      nonce: 0,
      deadline: 1672531200, // Example deadline (2023-01-01 00:00:00 UTC)
    },
  }),
});
