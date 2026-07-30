import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { hackAllConnectButtons } from '../../../providers/inpage-providers-hub/src/connectButtonHack';
import {
  hackConnectButton,
} from '../../../providers/inpage-providers-hub/src/connectButtonHack/hackConnectButton';
import { WALLET_CONNECT_INFO } from '../../../providers/inpage-providers-hub/src/connectButtonHack/consts';
import { createWalletId } from '../../../providers/inpage-providers-hub/src/connectButtonHack/universal/utils';

type LabWindow = Window &
  typeof globalThis & {
    $onekey?: Record<string, any>;
    ethereum?: Record<string, any>;
    solana?: Record<string, any>;
    phantom?: Record<string, any>;
    unisat?: Record<string, any>;
    keplr?: Record<string, any>;
    petra?: Record<string, any>;
    suiWallet?: Record<string, any>;
    tronLink?: Record<string, any>;
  };

const labWindow = window as LabWindow;

function reportProviderRequest(scope: string, method: string, params?: unknown) {
  window.postMessage(
    {
      source: 'onekey-connect-button-lab',
      type: 'provider-request',
      scope,
      method,
      params,
      at: new Date().toISOString(),
    },
    '*',
  );
}

function createRequestProvider(scope: string) {
  const request = async ({ method = 'unknown', params }: { method?: string; params?: unknown } = {}) => {
    reportProviderRequest(scope, method, params);
    if (method === 'eth_chainId') return '0x1';
    if (method === 'net_version') return '1';
    if (method === 'eth_accounts') return [];
    if (method === 'eth_requestAccounts') {
      return ['0x1111111111111111111111111111111111111111'];
    }
    if (method.includes('sign') || method.includes('sendTransaction')) {
      throw new Error('Connect Button Lab dry-run: signing and transactions are disabled');
    }
    return null;
  };
  return {
    isOneKey: true,
    isMetaMask: scope === 'ethereum',
    chainId: scope === 'ethereum' ? '0x1' : undefined,
    selectedAddress: null,
    request,
    send: request,
    sendAsync: request,
    isConnected: () => false,
    on: () => undefined,
    once: () => undefined,
    removeListener: () => undefined,
    removeAllListeners: () => undefined,
    connect: async () => {
      reportProviderRequest(scope, 'connect');
      return { publicKey: 'LabPublicKey111111111111111111111111111111' };
    },
    disconnect: async () => {
      reportProviderRequest(scope, 'disconnect');
    },
  };
}

const ethereum = createRequestProvider('ethereum');
const solana = createRequestProvider('solana');
const btc = createRequestProvider('btc');
const cosmos = createRequestProvider('cosmos');
const aptos = createRequestProvider('aptos');
const sui = createRequestProvider('sui');
const tron = createRequestProvider('tron');
const privateProvider = {
  request: async ({ method = 'unknown', params }: { method?: string; params?: unknown } = {}) => {
    reportProviderRequest('$private', method, params);
    if (method === 'wallet_scanQrcode') return { result: '' };
    return null;
  },
};

labWindow.$onekey = {
  ...(labWindow.$onekey || {}),
  ethereum,
  solana,
  btc,
  cosmos,
  aptos,
  sui,
  tron,
  unisat: btc,
  keplr: cosmos,
  petra: aptos,
  suiWallet: sui,
  tronLink: tron,
  $private: privateProvider,
};

labWindow.ethereum = ethereum;
labWindow.solana = solana;
labWindow.phantom = { solana, ethereum };
labWindow.unisat = btc;
labWindow.keplr = cosmos;
labWindow.petra = aptos;
labWindow.suiWallet = sui;
labWindow.tronLink = tron;

try {
  localStorage.setItem(
    'onekey_wallet_info_local_key_v5',
    JSON.stringify({
      isDefaultWallet: true,
      excludedDappList: [],
      platformEnv: {
        isExtension: true,
        isDesktop: false,
        isNative: false,
        isWeb: false,
      },
    }),
  );
} catch {
  // Some file or privacy contexts can deny localStorage.
}

hackConnectButton({
  urls: ['*'],
  providers: [IInjectedProviderNames.ethereum],
  replaceMethod() {
    const wallets = Array.from(
      document.querySelectorAll<HTMLElement>('[data-lab-wallet]'),
    );
    for (const wallet of wallets) {
      const name = wallet.dataset.labWallet;
      if (name !== 'metamask' && name !== 'walletconnect') continue;
      const info =
        name === 'metamask'
          ? WALLET_CONNECT_INFO.metamask
          : WALLET_CONNECT_INFO.walletconnect;
      const text = wallet.querySelector<HTMLElement>('[data-lab-wallet-name]');
      const icon = wallet.querySelector<HTMLImageElement>('img');
      if (text) text.textContent = info.text;
      if (icon) icon.src = info.icon;
      const walletId = createWalletId(IInjectedProviderNames.ethereum, info.text);
      walletId.updateFlag(wallet);
    }
  },
});

hackAllConnectButtons();

window.postMessage(
  {
    source: 'onekey-connect-button-lab',
    type: 'hack-bundle-ready',
    at: new Date().toISOString(),
  },
  '*',
);
