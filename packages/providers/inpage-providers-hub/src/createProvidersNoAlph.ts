import { JsBridgeBase } from '@onekeyfe/cross-inpage-provider-core';
import { ProviderEthereum } from '@onekeyfe/onekey-eth-provider';
import { ProviderPrivate } from '@onekeyfe/onekey-private-provider';
import { ProviderSolana } from '@onekeyfe/onekey-solana-provider';
import { ProviderAptosMartian } from '@onekeyfe/onekey-aptos-provider';
import { ProviderConflux } from '@onekeyfe/onekey-conflux-provider';
import { ProviderTron } from '@onekeyfe/onekey-tron-provider';
import { ProviderCardano } from '@onekeyfe/onekey-cardano-provider';
import { ProviderCosmos } from '@onekeyfe/onekey-cosmos-provider';
import { ProviderPolkadot } from '@onekeyfe/onekey-polkadot-provider';
import { ProviderSui } from '@onekeyfe/onekey-sui-provider';
import { ProviderBfc } from '@onekeyfe/onekey-bfc-provider';
import { ProviderWebln } from '@onekeyfe/onekey-webln-provider';
import { ProviderScdo } from '@onekeyfe/onekey-scdo-provider';
import { ProviderTon } from '@onekeyfe/onekey-ton-provider';
import { ProviderNostr } from '@onekeyfe/onekey-nostr-provider';
import { ProviderBtc, ProviderBtcWallet } from '@onekeyfe/onekey-btc-provider';
import { ProviderAlgo } from '@onekeyfe/onekey-algo-provider';

export function createProvidersNoAlph(bridge: JsBridgeBase) {
  return {
    ethereum: new ProviderEthereum({ bridge }),
    $private: new ProviderPrivate({ bridge }),
    solana: new ProviderSolana({ bridge }),
    martian: new ProviderAptosMartian({ bridge }),
    conflux: new ProviderConflux({ bridge }),
    tron: new ProviderTron({ bridge }),
    sui: new ProviderSui({ bridge }),
    bfc: new ProviderBfc({ bridge }),
    cardano: new ProviderCardano({ bridge }),
    tonconnect: new ProviderTon({ bridge }),
    cosmos: new ProviderCosmos({ bridge }),
    polkadot: new ProviderPolkadot({ bridge }),
    webln: new ProviderWebln({ bridge }),
    nostr: new ProviderNostr({ bridge }),
    btc: new ProviderBtc({ bridge }),
    btcWallet: new ProviderBtcWallet({ bridge }),
    algorand: new ProviderAlgo({ bridge }),
    scdo: new ProviderScdo({ bridge }),
  };
}
