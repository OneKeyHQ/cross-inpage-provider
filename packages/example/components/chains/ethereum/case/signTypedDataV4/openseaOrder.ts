import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-opensea-order',
  name: 'opensea: Seaport Order',
  description: 'SignTypedDataV4 OpenSea Seaport Order',
  value: JSON.stringify({
    types: {
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
        { name: 'counter', type: 'uint256' }
      ],
      OfferItem: [
        { name: 'itemType', type: 'uint8' },
        { name: 'token', type: 'address' },
        { name: 'identifierOrCriteria', type: 'uint256' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' }
      ],
      ConsiderationItem: [
        { name: 'itemType', type: 'uint8' },
        { name: 'token', type: 'address' },
        { name: 'identifierOrCriteria', type: 'uint256' },
        { name: 'startAmount', type: 'uint256' },
        { name: 'endAmount', type: 'uint256' },
        { name: 'recipient', type: 'address' }
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    domain: {
      name: 'Seaport',
      version: '1.5',
      chainId: params.chainId.toString(),
      verifyingContract: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'
    },
    primaryType: 'OrderComponents',
    message: {
      offerer: '0x6fc702d32e6cb268f7dc68766e6b0fe94520499d',
      zone: '0x0000000000000000000000000000000000000000',
      offer: [{
        itemType: 2, // ERC721
        token: '0x8a90cab2b38dba80c64b7734e58ee1db38b8992e',
        identifierOrCriteria: '1234',
        startAmount: '1',
        endAmount: '1'
      }],
      consideration: [{
        itemType: 0, // ETH
        token: '0x0000000000000000000000000000000000000000',
        identifierOrCriteria: '0',
        startAmount: '1000000000000000000',
        endAmount: '1000000000000000000',
        recipient: '0x6fc702d32e6cb268f7dc68766e6b0fe94520499d'
      }],
      orderType: 0,
      startTime: '1683936000',
      endTime: '1684022400',
      zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
      salt: '24446860302761739304752',
      conduitKey: '0x0000000000000000000000000000000000000000000000000000000000000000',
      counter: '0'
    }
  })
});
