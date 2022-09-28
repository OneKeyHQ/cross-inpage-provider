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

export function createNewImageToContainer({
  container,
  icon,
  removeSvg = true,
  onCreated,
}: {
  container: HTMLElement;
  icon: string;
  removeSvg: boolean;
  onCreated?: (img: HTMLImageElement) => void;
}) {
  if (removeSvg) {
    const svg = container.querySelector('svg');
    if (svg) {
      svg.remove();
    }
  }
  const datasetKey = 'onekey_auto_created'; // can not include `-`
  if (!container.querySelector(`[data-${datasetKey}]`)) {
    const newImg = document.createElement('img');
    newImg.src = icon;
    newImg.dataset[datasetKey] = 'true';
    newImg.style.maxHeight = '100%';
    newImg.style.maxWidth = '100%';
    onCreated?.(newImg);
    container.prepend(newImg);
  }
}

function hackConnectButton({
  urls,
  replaceMethod,
  providers,
  mutationObserverOptions = {
    attributes: false,
    characterData: false,
    childList: true,
    subtree: true,
  },
  throttleDelay = 600,
  throttleSettings = {
    leading: true,
    trailing: true,
  },
  callbackDelay = 10,
}: {
  urls: string[];
  replaceMethod: () => void;
  providers: IInjectedProviderNames[];
  /*
    In mutationObserver config, at least one of attributes, characterData, or childList needs to be set true.

    Now, If you just set childList: true, then it will observe only the direct children (depth 1) of the target element and not the complete subtree.

    To observe the complete subtree both childList and subtree needs to be set true.
        { childList: true, subtree: true }
   */
  mutationObserverOptions?: MutationObserverInit;
  throttleDelay?: number;
  throttleSettings?: ThrottleSettings;
  callbackDelay?: number;
}) {
  const isUrlMatched = () => Boolean(urls.includes(window.location.hostname));
  const run = () => {
    if (!isUrlMatched()) {
      return;
    }
    // Select the node that will be observed for mutations
    const targetNode = document.body;

    // Options for the observer (which mutations to observe)
    const config = mutationObserverOptions;

    // Callback function to execute when mutations are observed
    const callback: MutationCallback = throttle(
      (mutationList, observer: MutationObserver) => {
        setTimeout(() => {
          if (!isUrlMatched()) {
            return;
          }
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
        }, callbackDelay);
      },
      throttleDelay,
      throttleSettings,
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
