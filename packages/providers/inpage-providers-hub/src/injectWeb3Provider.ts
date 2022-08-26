/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JsBridgeBase, ProviderBase } from '@onekeyfe/cross-inpage-provider-core';
import { IInjectedProviderNames, IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { ProviderEthereum, shimWeb3 } from '@onekeyfe/onekey-eth-provider';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';
import { ProviderSolana } from '@onekeyfe/onekey-solana-provider';
import { ProviderStarcoin } from '@onekeyfe/onekey-starcoin-provider';
// import Web3 from 'web3'; // cause build error

export type WindowOneKeyHub = {
  debugLogger?: any;
  jsBridge?: JsBridgeBase;
  ethereum?: ProviderEthereum;
  solana?: ProviderSolana;
  phantom?: { solana?: ProviderSolana };
  starcoin?: any;
  $private?: ProviderPrivate;
};

function injectWeb3Provider(): unknown {
  if (!window?.$onekey?.jsBridge) {
    throw new Error('OneKey jsBridge not found.');
  }
  const bridge: JsBridgeBase = window?.$onekey?.jsBridge;

  const ethereum = new ProviderEthereum({
    bridge,
  });
  const $private = new ProviderPrivate({
    bridge,
  });
  const solana = new ProviderSolana({
    bridge,
  });

  const starcoin = new ProviderStarcoin({
    bridge,
  });

  // providerHub
  const $onekey = {
    ...window.$onekey,
    jsBridge: bridge,
    $private,
    ethereum,
    solana,
    starcoin,
    conflux: null,
    sollet: null,
  };
  window.$onekey = $onekey;

  // ** EVM
  // TODO conflict with MetaMask
  window.ethereum = ethereum;

  // ** SOL
  window.solana = solana;
  window.phantom = { solana };
  // sim multiple providers may cause opensea.io prompt Connection twice.
  // window.solflare = solana;
  // window.glowSolana = solana;

  // ** STC
  window.starcoin = starcoin;

  // ** shim or inject real web3
  //
  // if (!window.web3) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-argument
  //   window.web3 = new Web3(ethereum as any);
  // }
  shimWeb3(ethereum);

  // TODO use initializeInpageProvider.ts
  window.dispatchEvent(new Event('ethereum#initialized'));

  return $onekey;
}
export { injectWeb3Provider };
