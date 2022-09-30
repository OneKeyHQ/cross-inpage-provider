import { throttle, ThrottleSettings } from 'lodash';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import type { IWindowOneKeyHub } from '../injectWeb3Provider';

function checkIfWalletConnected({ providerName }: { providerName: IInjectedProviderNames }) {
  const hub = window.$onekey as IWindowOneKeyHub;
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

export async function detectQrcodeFromSvg({
  img,
}: {
  img: HTMLImageElement | Element;
}): Promise<string> {
  // https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js
  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] }) as {
    detect: (data: any) => Promise<{ rawValue: string }[]>;
  };
  const serialized = new XMLSerializer().serializeToString(img);
  const encodedData = window.btoa(serialized);
  const base64 = `data:image/svg+xml;base64,${encodedData}`;
  return new Promise((resolve, reject) => {
    const imgTemp = document.createElement('img');
    imgTemp.src = base64;
    imgTemp.style.width = '100px';
    imgTemp.style.height = '100px';
    imgTemp.onload = () => {
      barcodeDetector
        .detect(imgTemp)
        .then((result) => {
          resolve(result?.[0]?.rawValue);
        })
        .catch(reject)
        .finally(() => {
          imgTemp.remove();
        });
    };
    document.body.appendChild(imgTemp);
  });

  // const res = await fetch(base64);
  // const blob = await res.blob();
  // const result = await barcodeDetector.detect(blob);
  // return result?.[0]?.rawValue;
}

export function createWalletConnectToButton({
  container,
  onCreated,
}: {
  container: HTMLElement;
  onCreated?: (btn: HTMLElement) => void;
}) {
  const datasetKey = 'onekey_auto_created_wallet_connect_btn'; // can not include `-`
  if (!container.querySelector(`[data-${datasetKey}]`)) {
    const btn = document.createElement('div');
    btn.dataset[datasetKey] = 'true';
    btn.style.cssText = `
border-radius: 12px;
padding-top: 8px;
padding-bottom: 8px;
padding-left: 16px;
padding-right: 16px;
background-color: #00B812;
color: white;
font-size: 14px;
line-height: 20px;
font-weight: 500;
cursor: pointer;
    `;
    // i18n key:
    //    action__connect_onekey_extension
    //    action__connect_onekey
    btn.innerHTML = 'Connect OneKey';
    onCreated?.(btn);
    container.append(btn);
  }
}

export function createNewImageToContainer({
  container,
  icon,
  removeSvg = true,
  onCreated,
  width,
  height,
}: {
  container: HTMLElement;
  icon: string;
  removeSvg: boolean;
  onCreated?: (img: HTMLImageElement) => void;
  width?: string;
  height?: string;
}) {
  if (removeSvg) {
    const svg = container.querySelector('svg');
    if (svg) {
      svg.remove();
    }
  }
  const datasetKey = 'onekey_auto_created_icon_img'; // can not include `-`
  if (!container.querySelector(`[data-${datasetKey}]`)) {
    const newImg = document.createElement('img');
    newImg.src = icon;
    newImg.dataset[datasetKey] = 'true';
    newImg.style.maxHeight = '100%';
    newImg.style.maxWidth = '100%';
    if (width) {
      newImg.style.width = width;
    }
    if (height) {
      newImg.style.height = height;
    }
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
  const isUrlMatched = () => Boolean(urls.includes(window.location.hostname) || urls.includes('*'));

  const run = () => {
    // ignore web site run in iframe
    if (window.top !== window) {
      return;
    }
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

  let isRun = false;
  const runOnce = () => {
    if (isRun) {
      return;
    }
    isRun = true;
    setTimeout(() => {
      run();
    }, 1000);
  };
  if (
    document.readyState === 'complete' ||
    // @ts-ignore
    document.readyState === 'loaded' ||
    document.readyState === 'interactive'
  ) {
    runOnce();
  } else {
    window.addEventListener(
      'DOMContentLoaded',
      function () {
        runOnce();
      },
      false,
    );
  }
}

export { hackConnectButton };
