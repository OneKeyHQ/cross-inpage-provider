import { merge } from 'lodash';
import { IEIP712Params } from '../../types';

const baseSafeTxMultiSig = {
  domain: {
    chainId: '0x1',
    verifyingContract: '0xe0526bff2aeacbe5dd2a0c98b0276144d14f932a',
  },
  primaryType: 'SafeTx',
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
      { name: 'nonce', type: 'uint256' },
    ],
    EIP712Domain: [
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
  },
  message: {
    to: '0x40a2accbd92bca938b02010e17a5b8929b49130d',
    value: '0',
    data: '0x8d80ff0a000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004c80092d6c1e31e14520e676a687f0a93788b716beff500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e8000000000000000000000000000000000000000000003f870857a3e0e380000000c944e90c64b2c07662a292be6244bdf05cda44a700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e800000000000000000000000000000000000000000001a784379d99db420000000068bbed6a47194eff1cf514b50ea91895597fc91e00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e8000000000000000000000000000000000000000006765c793fa10079d0000000003845badade8e6dff049820680d1f14bd3903a5d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e800000000000000000000000000000000000000000000943b1377290cbd80000000761d38e5ddf6ccf6cf7c55759d5210750b5d60f300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e800000000000000000000000000000000000000193e5939a08ce9dbd48000000000514910771af9ca656af840dff83e8264ecf986ca00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e800000000000000000000000000000000000000000000043c33c1937564800000007fc66500c84a76ad7e9c93437bfc5ac33e2ddae900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e800000000000000000000000000000000000000000000003635c9adc5dea0000000feac2eae96899709a43e252b6b92971d32f9c0f900000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044a9059cbb000000000000000000000000d3d3a295be556cf8cef2a7ff4cda23d22c4627e800000000000000000000000000000000000000000000152d02c7e14af6800000000000000000000000000000000000000000000000000000',
    operation: '1',
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: '0x0000000000000000000000000000000000000000',
    nonce: '122',
  },
};

export enum SafeTxMultiSigOperation {
  CALL = '0',
  DELEGATECALL = '1',
}

export const safeTxMultiSigCall = (params: IEIP712Params) => ({
  id: 'signTypedDataV4-safeTxMultiSig-call',
  name: 'safeTxMultiSig: Call',
  description: 'SafeTxMultiSig 多签交易 Call',
  value: JSON.stringify(
    merge({}, baseSafeTxMultiSig, {
      message: {
        operation: SafeTxMultiSigOperation.CALL,
      },
    }),
  ),
});

export const safeTxMultiSigDelegateCall = (params: IEIP712Params) => ({
  id: 'signTypedDataV4-safeTxMultiSig-delegateCall',
  name: 'safeTxMultiSig: DelegateCall',
  description: 'SafeTxMultiSig 多签交易 DelegateCall',
  value: JSON.stringify(
    merge({}, baseSafeTxMultiSig, {
      message: {
        operation: SafeTxMultiSigOperation.DELEGATECALL,
      },
    }),
  ),
});

export const safeTxMultiSigEmpty = (params: IEIP712Params) => ({
  id: 'signTypedDataV4-safeTxMultiSig-empty',
  name: 'safeTxMultiSig: Empty Data',
  description: 'SafeTxMultiSig 多签交易 Empty Data',
  value: JSON.stringify(
    merge({}, baseSafeTxMultiSig, {
      message: {
        data: '',
        operation: SafeTxMultiSigOperation.CALL,
      },
    }),
  ),
});
