import * as uuid from 'uuid';

export type IChainInfo = {
  id: string;
  name: string;
  icon?: string;
  href?: string;
  target?: string;
};

export const registeredChainsWithWalletConnect: IChainInfo[] = [
  {
    id: uuid.v4(),
    name: 'EVM (官方 WalletConnect)',
    href: 'https://example.walletconnect.org',
    target: 'WalletConnectExample',
    icon: 'https://example.walletconnect.org/favicon.ico',
  },
  {
    id: uuid.v4(),
    name: 'Aptos WalletConnect',
    href: '/aptosWalletconnect',
    icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
  },
  {
    id: uuid.v4(),
    name: 'Algo WalletConnect',
    href: '/algoWalletConnect',
    icon: 'https://uni.onekey-asset.com/static/chain/algo.png',
  },
];

export const registeredChains: IChainInfo[] = [
  {
    id: uuid.v4(),
    name: 'Aptos',
    href: '/aptos',
    icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
  },
  {
    id: uuid.v4(),
    name: 'Aptos Martian',
    href: '/aptosMartian',
    icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
  },
  {
    id: uuid.v4(),
    name: 'AptosWalletAdapter',
    href: 'https://aptos-labs.github.io/aptos-wallet-adapter/',
    icon: 'https://uni.onekey-asset.com/static/chain/apt.png',
  },
  {
    id: uuid.v4(),
    name: 'BTC',
    href: '/btcUnitsat',
    icon: 'https://uni.onekey-asset.com/static/chain/btc.png',
  },
  {
    id: uuid.v4(),
    name: 'BTC Lightning Network',
    href: '/webln',
    icon: 'https://uni.onekey-asset.com/static/chain/webln.png',
  },
  {
    id: uuid.v4(),
    name: 'BTC Nostr',
    href: '/nostr',
    icon: 'https://uni.onekey-asset.com/static/chain/nostr.png',
  },
  {
    id: uuid.v4(),
    name: 'Cardano',
    href: '/cardano',
    icon: 'https://uni.onekey-asset.com/static/chain/ada.png',
  },
  {
    id: uuid.v4(),
    name: 'Conflux',
    href: '/conflux',
    icon: 'https://uni.onekey-asset.com/static/chain/cfx.png',
  },
  {
    id: uuid.v4(),
    name: 'Cosmos',
    href: '/cosmos',
    icon: 'https://uni.onekey-asset.com/static/chain/cosmos.png',
  },
  {
    id: uuid.v4(),
    name: 'EVM',
    href: '/ethereum',
    icon: 'https://uni.onekey-asset.com/static/chain/eth.png',
  },
  {
    id: uuid.v4(),
    name: 'EVM (Metamask)',
    href: 'https://metamask.github.io/test-dapp',
    icon: 'https://uni.onekey-asset.com/static/chain/eth.png',
  },
  // {
  //   id: uuid.v4(),
  //   name: 'NEAR',
  //   href: '/near',
  //   icon: 'https://uni.onekey-asset.com/static/chain/near.png',
  // },
  // {
  //   id: uuid.v4(),
  //   name: 'NEAR ref-ui',
  //   href: 'https://dapp-near-ref-ui.onekeytest.com',
  //   target: '_blank',
  //   icon: 'https://uni.onekey-asset.com/static/chain/near.png',
  // },
  {
    id: uuid.v4(),
    name: 'Polkadot',
    href: '/polkadot',
    icon: 'https://uni.onekey-asset.com/static/chain/polkadot.png',
  },
  {
    id: uuid.v4(),
    name: 'Solana',
    href: '/solana',
    icon: 'https://uni.onekey-asset.com/static/chain/sol.png',
  },
  {
    id: uuid.v4(),
    name: 'Solana Standard',
    href: '/solanaStandard',
    icon: 'https://uni.onekey-asset.com/static/chain/sol.png',
  },
  {
    id: uuid.v4(),
    name: 'Starcoin',
    href: '/starcoin',
    icon: 'https://uni.onekey-asset.com/static/chain/stc.png',
  },
  {
    id: uuid.v4(),
    name: 'Sui Standard',
    href: '/suiStandard',
    icon: 'https://uni.onekey-asset.com/static/chain/sui.png',
  },
  {
    id: uuid.v4(),
    name: 'Tron',
    href: '/tron',
    icon: 'https://uni.onekey-asset.com/static/chain/filled_trx.png',
  },
];
