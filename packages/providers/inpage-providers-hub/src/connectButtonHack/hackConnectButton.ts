import {
  ISpecialPropertyProviderNamesReflection,
  Logger,
  checkWalletSwitchEnable,
} from '@onekeyfe/cross-inpage-provider-core';
import { throttle, ThrottleSettings } from 'lodash-es';
import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import type { IWindowOneKeyHub } from '../injectWeb3Provider';

const hackButtonLogger = new Logger('hackButton');
function checkIfInjectedProviderConnected({
  providerName,
}: {
  providerName: IInjectedProviderNames;
}) {
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

/**
 * Checks if the given key is a valid key of the `ISpecialPropertyProviderNamesReflection` enum.
 * This function acts as a type guard, verifying if a string is one of the keys in the `ISpecialPropertyProviderNamesReflection` enum.
 *
 * @param key - The key to be checked against the `ISpecialPropertyProviderNamesReflection` enum.
 * @returns Returns `true` if the key is a valid enum key, otherwise returns `false`.
 */
function isKeyOfISpecialPropertyProviderNamesReflection(
  key: string,
): key is keyof typeof ISpecialPropertyProviderNamesReflection {
  return key in ISpecialPropertyProviderNamesReflection;
}

/**
 * Checks if the provided blockchain provider is enabled.
 * This function determines the status of a blockchain provider by mapping its name to a special property name (if applicable) and then checking if the wallet switch for that property is enabled.
 *
 * @param param - An object containing the name of the blockchain provider.
 * @param providerName - The name of the provider to check. This should be a member of the `IInjectedProviderNames` enum.
 * @returns Returns `true` if the provider is enabled, otherwise returns `false`.
 */
function checkIfInjectedProviderEnable({ providerName }: { providerName: IInjectedProviderNames }) {
  let property: string;
  if (isKeyOfISpecialPropertyProviderNamesReflection(providerName)) {
    property = ISpecialPropertyProviderNamesReflection[providerName];
  } else {
    property = providerName;
  }

  const result = checkWalletSwitchEnable();
  hackButtonLogger.log('checkIfInjectedProviderEnable', property, result);
  return result;
}

/**
 * Retrieves an array of enabled provider names.
 *
 * @param providers - An array of provider names to check.
 * @returns Returns an array containing the names of all enabled providers.
 */
function getEnabledProviders({
  providers,
}: {
  providers: IInjectedProviderNames[];
}): IInjectedProviderNames[] {
  return providers.filter((providerName) => {
    return checkIfInjectedProviderEnable({ providerName });
  });
}

export async function detectQrcodeFromSvg({
  img,
}: {
  img: HTMLImageElement | Element;
}): Promise<string> {
  // https://unpkg.com/qr-scanner@1.4.1/qr-scanner.umd.min.js

  // Firefox does not support drawing SVG images to canvas
  // Unless the svg file has width/height attributes on the root <svg> element
  try {
    img.setAttribute('width', img.clientWidth.toString());
    img.setAttribute('height', img.clientHeight.toString());
  } catch {
    //pass
  }

  const serialized = new XMLSerializer().serializeToString(img);
  const encodedData = window.btoa(serialized);
  const base64 = `data:image/svg+xml;base64,${encodedData}`;

  const res = (await (window.$onekey as IWindowOneKeyHub)?.$private?.request({
    method: 'wallet_scanQrcode',
    params: [{ base64 }],
  })) as { result?: string };
  const result: string = res?.result || '';
  if (result) {
    return result;
  }

  // @ts-ignore
  if (typeof window.BarcodeDetector !== 'undefined') {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] }) as {
        detect: (data: any) => Promise<{ rawValue: string }[]>;
      };
      const imgTemp = document.createElement('img');
      imgTemp.src = base64;
      imgTemp.style.width = '100px';
      imgTemp.style.height = '100px';
      imgTemp.onload = () => {
        barcodeDetector
          .detect(imgTemp)
          .then((result) => {
            resolve(result?.[0]?.rawValue || '');
          })
          .catch(() => resolve(''))
          .finally(() => {
            imgTemp.remove();
          });
      };
      document.body.appendChild(imgTemp);
    });
  }

  return '';

  // const res = await fetch(base64);
  // const blob = await res.blob();
  // const result = await barcodeDetector.detect(blob);
  // return result?.[0]?.rawValue;
}

let isAddedRotateAnimation = false;
function addRotateAnimationToCss() {
  if (isAddedRotateAnimation) {
    return;
  }
  isAddedRotateAnimation = true;
  const css = window.document.styleSheets[0];
  css.insertRule(
    `
@keyframes oneKeySpinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`,
    css.cssRules.length,
  );
}

export function createWalletConnectToButton({
  container,
  onCreated,
  uri,
}: {
  container: HTMLElement;
  onCreated?: (btn: HTMLElement) => void;
  uri: string;
}) {
  if (!uri || !uri.startsWith('wc:')) {
    return;
  }
  const onekeyHub = window.$onekey as IWindowOneKeyHub | undefined;
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
text-align: center;
    `;
    // i18n key:
    //    action__connect_onekey_extension
    //    action__connect_onekey
    btn.innerHTML = `
    <span>Connect OneKey</span>
    <span class='onekey-spinner-element' style='
    display: none;
    vertical-align: middle;
    width: 12px;
    height: 12px;
    border: 2px solid white;
    border-bottom-color: transparent;
    border-radius: 50%;'></span>
    `;
    btn.onclick = () => {
      if (btn.dataset['isClicked']) {
        return;
      }
      btn.dataset['isClicked'] = 'true';
      btn.style.backgroundColor = '#bbb';
      btn.style.cursor = 'not-allowed';
      void onekeyHub?.$private?.request({
        method: 'wallet_connectToWalletConnect',
        params: { uri },
      });
      const spinner = btn.querySelector('.onekey-spinner-element') as HTMLElement | undefined;
      if (spinner) {
        spinner.style.animation = 'oneKeySpinner 1s linear infinite';
        spinner.style.display = 'inline-block';
        addRotateAnimationToCss();
      }
    };
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
  replaceMethod: (options?: { providers: IInjectedProviderNames[] }) => void;
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
  const getEnabledInjectedProviders = () => {
    if (!isUrlMatched()) {
      return;
    }
    if (providers.find((providerName) => checkIfInjectedProviderConnected({ providerName }))) {
      return;
    }
    const enabledProviders = getEnabledProviders({ providers });
    if (!enabledProviders || enabledProviders.length === 0) {
      hackButtonLogger.debug('inject Provider disabled, skip hackConnectButton (DEV only log)');
      return;
    }
    // hackButtonLogger.debug('mutation triggered: hackConnectButton (DEV only log)');
    return enabledProviders;
  };

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
          try {
            const enabledProviders = getEnabledInjectedProviders();
            observer?.disconnect?.();
            if (!enabledProviders) {
              return;
            }
            replaceMethod?.({ providers: enabledProviders });
          } catch (error) {
            hackButtonLogger.debug('hackConnectButton mutation ERROR (DEV only log):  ', error);
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

  setTimeout(() => {
    try {
      const enabledProviders = getEnabledInjectedProviders();
      if (!enabledProviders) {
        return;
      }
      replaceMethod?.({ providers: enabledProviders });
    } catch (error) {
      // noop
    } finally {
      // noop
    }
  }, 3000);
}

export { hackConnectButton };
