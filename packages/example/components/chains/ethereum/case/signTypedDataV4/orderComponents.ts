import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-orderComponents',
  name: 'order: OrderComponents 方法',
  description: 'SignTypedDataV4 OrderComponents 方法',
  value: JSON.stringify({
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      OrderComponents: [
        { name: 'offerer', type: 'address' },
        { name: 'zone', type: 'address' },
        { name: 'offer', type: 'OfferItem[]' },
        { name: 'consideration', type: 'ConsiderationItem[]' },
        { name: 'orderType', type: 'uint8' },
        { name: 'startTime', type: 'uint256' },
        { name: 'endTime', type: 'uint256' },
        { name: 'zoneHash', type: 'bytes32' },
        { name: 'salt', type: 'uint256' },
        { name: 'conduitKey', type: 'bytes32' },
        { name: 'counter', type: 'uint256' },
      ],
      OfferItem: [
        { name: 'itemType', type: 'uint8' },
        { name: 'token', type: 'address' },
        { name: 'identifierOrCriteria', type: 'uint256' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' },
      ],
      ConsiderationItem: [
        { name: 'itemType', type: 'uint8' },
        { name: 'token', type: 'address' },
        { name: 'identifierOrCriteria', type: 'uint256' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' },
        { name: 'recipient', type: 'address' },
      ],
    },
    primaryType: 'OrderComponents',
    domain: {
      name: 'Seaport',
      version: '1.1',
      chainId: params.chainId.toString(),
      verifyingContract: '0x00000000006c3852cbEf3e08E8dF289169EdE581', // Seaport 1.1 contract address
    },
    message: {
      offerer: '0x0000000000000000000000000000000000000000',
      zone: '0x0000000000000000000000000000000000000000',
      offer: [
        {
          itemType: 2, // ERC721
          token: '0x0000000000000000000000000000000000000000',
          identifierOrCriteria: '1',
          startAmount: '1',
          endAmount: '1',
        },
      ],
      consideration: [
        {
          itemType: 0, // ETH
          token: '0x0000000000000000000000000000000000000000',
          identifierOrCriteria: '0',
          startAmount: '1000000000000000000',
          endAmount: '1000000000000000000',
          recipient: '0x0000000000000000000000000000000000000000',
        },
      ],
      orderType: 0, // FULL_OPEN
      startTime: '1640995200', // 2022-01-01 00:00:00 UTC
      endTime: '1672531200', // 2023-01-01 00:00:00 UTC
      zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      salt: '0',
      conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      counter: '0',
    },
  }),
});
