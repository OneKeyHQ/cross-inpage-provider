import { throttle, ThrottleSettings } from 'lodash';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import type { WindowOneKeyHub } from '../injectWeb3Provider';

function checkIfWalletConnected({ providerName }: { providerName: IInjectedProviderNames }) {
  const hub = window.$onekey as WindowOneKeyHub;
  if (providerName === IInjectedProviderNames.ethereum) {
    // dapp disconnect won't remove accounts in wallet, so this check won't working
    // @ts-ignore
    // return Boolean(hub?.ethereum?._state?.accounts?.length);
    return false;
  }
  if (providerName === IInjectedProviderNames.solana) {
    return Boolean(hub?.solana?.publicKey);
  }
  return false;
}

function hackConnectButton({
  urls,
  replaceMethod,
  options,
  throttleDelay = 300,
  throttleSettings,
  providers,
}: {
  urls: string[];
  replaceMethod: () => void;
  providers: IInjectedProviderNames[];
  options?: MutationObserverInit;
  throttleDelay?: number;
  throttleSettings?: ThrottleSettings;
}) {
  const run = () => {
    if (!urls.includes(window.location.hostname)) {
      return;
    }
    // Select the node that will be observed for mutations
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = options ?? { attributes: false, childList: true, subtree: true };

    // Callback function to execute when mutations are observed
    const callback: MutationCallback = throttle(
      (mutationList, observer: MutationObserver) => {
        if (providers.find((providerName) => checkIfWalletConnected({ providerName }))) {
          return;
        }
        if (process.env.NODE_ENV !== 'production') {
          console.log('mutation triggered: hackConnectButton');
        }
        try {
          observer?.disconnect?.();
          replaceMethod?.();
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('hackConnectButton mutation ERROR:', error);
          }
        } finally {
          observer?.observe?.(targetNode, config);
        }
      },
      throttleDelay,
      throttleSettings ?? {
        leading: false,
        trailing: true,
      },
    );

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
  };

  if (
    document.readyState === 'complete' ||
    // @ts-ignore
    document.readyState === 'loaded' ||
    document.readyState === 'interactive'
  ) {
    run();
  } else {
    window.addEventListener(
      'DOMContentLoaded',
      function () {
        run();
      },
      false,
    );
  }
}

export { hackConnectButton };
