import type { IEIP712Params } from '../../types';

export default (params: IEIP712Params) => ({
  id: 'signTypedDataV4-blur-order',
  name: 'order: Blur Order 方法',
  description: 'SignTypedDataV4 Blur Order 方法',
  value: JSON.stringify({
    domain: {
      name: 'Blur Exchange',
      version: '1.0',
      chainId: '0x1',
      verifyingContract: '0xb2ecfe4e4d61f8790bbb9de2d1259b9e2410cea5',
    },
    primaryType: 'Order',
    types: {
      Order: [
        { name: 'trader', type: 'address' },
        { name: 'collection', type: 'address' },
        { name: 'listingsRoot', type: 'bytes32' },
        { name: 'numberOfListings', type: 'uint256' },
        { name: 'expirationTime', type: 'uint256' },
        { name: 'assetType', type: 'uint8' },
        { name: 'makerFee', type: 'FeeRate' },
        { name: 'salt', type: 'uint256' },
        { name: 'orderType', type: 'uint8' },
        { name: 'nonce', type: 'uint256' },
      ],
      FeeRate: [
        { name: 'recipient', type: 'address' },
        { name: 'rate', type: 'uint16' },
      ],
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
    },
    message: {
      trader: '0x76f3f64cb3cd19debee51436df630a342b736c24',
      collection: '0x0baeccd651cf4692a8790bcc4f606e79bf7a3b1c',
      listingsRoot: '0x1a666ef1af5abc6cd5da0cb0ffb71a0a1d16e04c978335fc67d53d7119909ccd',
      numberOfListings: '1',
      expirationTime: 1731399262,
      assetType: '0',
      makerFee: {
        recipient: '0x322ce12a36d48709cab5b4743f31d85db7b15b82',
        rate: '1000',
      },
      salt: '26547960623202541912088385383696263658',
      orderType: '0',
      nonce: '0',
    },
  }),
});
