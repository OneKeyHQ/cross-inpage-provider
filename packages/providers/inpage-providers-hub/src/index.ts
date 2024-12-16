import { sitesConfig } from './connectButtonHack/universal/config';
import { createWalletId } from './connectButtonHack/universal/utils';

export const connectButtonData = {
  sitesConfig,
  createWalletId,
};

export * from './injectWeb3Provider';
