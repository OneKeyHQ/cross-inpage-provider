import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-permit',
  name: 'permit: Permit 方法',
  description: 'SignTypedDataV4 Permit 方法',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'version',
          type: 'string',
        },
        {
          name: 'chainId',
          type: 'uint256',
        },
        {
          name: 'verifyingContract',
          type: 'address',
        },
      ],
      Permit: [
        {
          name: 'owner',
          type: 'address',
        },
        {
          name: 'spender',
          type: 'address',
        },
        {
          name: 'value',
          type: 'uint256',
        },
        {
          name: 'nonce',
          type: 'uint256',
        },
        {
          name: 'deadline',
          type: 'uint256',
        },
      ],
    },
    primaryType: 'Permit',
    domain: {
      name: 'MyToken',
      version: '1',
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      chainId: params.chainId.toString(),
    },
    message: {
      owner: '0xd6e8058cd3a5e5b90eacdc350e1246de4a39d411',
      spender: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
      value: 3000,
      nonce: 0,
      deadline: 50000000000,
    },
  }),
});
