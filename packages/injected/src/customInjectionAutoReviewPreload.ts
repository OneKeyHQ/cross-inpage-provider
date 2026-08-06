import { ipcRenderer } from 'electron';

import { WALLET_CONNECT_INFO } from '../../providers/inpage-providers-hub/dist/connectButtonHack/consts';

import {
  createCustomInjectionRepositoryIcons,
  installCustomInjectionAutoReview,
} from './customInjectionAutoReview';

export const CUSTOM_INJECTION_AUTO_REVIEW_CONFIG_CHANNEL =
  'onekey@CUSTOM_INJECTION_AUTO_REVIEW_CONFIG';
export const CUSTOM_INJECTION_AUTO_REVIEW_RESULT_CHANNEL = 'onekey@CUSTOM_INJECTION_AUTO_REVIEW';

type IAutoReviewConfig = {
  version: 1;
  token: string;
};

const repositoryIcons = createCustomInjectionRepositoryIcons(WALLET_CONNECT_INFO);

function parseConfig(value: unknown): IAutoReviewConfig | null {
  const config = value as Partial<IAutoReviewConfig> | null;
  if (
    config?.version !== 1 ||
    typeof config.token !== 'string' ||
    config.token.length < 16 ||
    config.token.length > 128
  ) {
    return null;
  }
  return {
    version: 1,
    token: config.token,
  };
}

const autoReview = installCustomInjectionAutoReview({
  icons: repositoryIcons,
  onReport: ({ token, detection }) => {
    ipcRenderer.sendToHost(CUSTOM_INJECTION_AUTO_REVIEW_RESULT_CHANNEL, {
      version: 1,
      token,
      detection,
    });
  },
});

ipcRenderer.on(CUSTOM_INJECTION_AUTO_REVIEW_CONFIG_CHANNEL, (_event, value: unknown) => {
  const config = parseConfig(value);
  if (!config) return;
  autoReview.configure(config.token);
});

window.addEventListener('unload', autoReview.stop, { once: true });
