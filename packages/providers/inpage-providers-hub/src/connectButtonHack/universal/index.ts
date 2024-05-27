import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { hackConnectButton } from '../hackConnectButton';
import { SitesInfo, sitesConfig } from './config';
import { findIconAndNameByParent as defaultFindIconAndName } from './findIconAndName';
import { replaceIcon as defaultReplaceIcon } from './imgUtils';
import { replaceText as defaultReplaceText, makeTextEllipse } from './textUtils';
import { FindResultType } from './type';
import { createWalletId, universalLog } from './utils';

function hackWalletConnectButton(sites: SitesInfo[]) {
  for (const site of sites) {
    const { urls, walletsForProvider, mutationObserverOptions, constraintMap } = site;
    const providers = Object.keys(walletsForProvider) as IInjectedProviderNames[];
    if (!urls.includes(window.location.hostname)) {
      continue;
    }
    hackConnectButton({
      urls,
      providers,
      mutationObserverOptions,
      replaceMethod(
        { providers: enabledProviders }: { providers: IInjectedProviderNames[] } = {
          providers: [],
        },
      ) {
        for (const provider of providers) {
          if (enabledProviders.includes(provider)) {
            const wallets = walletsForProvider[provider] || [];
            for (const wallet of wallets) {
              const {
                updatedIcon,
                updatedName,
                name,
                findIconAndName,
                container,
                updateIcon = defaultReplaceIcon,
                updateName = defaultReplaceText,
                update,
                afterUpdate,
              } = wallet;
              try {
                const walletId = createWalletId(provider, updatedName);
                if (walletId.isUpdated) {
                  continue;
                }
                universalLog.log(
                  `[replaceMethod] ${urls[0]} begin to run for ${walletId.walletId}`,
                );
                let result: FindResultType | null = null;
                if (update) {
                  const newIconElement = update(wallet);
                  newIconElement && walletId.updateFlag(newIconElement);
                  continue;
                } else if (findIconAndName) {
                  result = findIconAndName.call(null, wallet);
                } else if (container) {
                  const isSelector = typeof container === 'string';
                  const containerElement: HTMLElement | null = isSelector
                    ? document.querySelector(container)
                    : container();
                  if (!containerElement) {
                    universalLog.warn('containerElement is null, container=',container);
                    continue;
                  }
                  result = defaultFindIconAndName(containerElement, name, constraintMap);
                }
                if (!result) {
                  universalLog.warn('no result found');
                  continue;
                }
                const { textNode, iconNode } = result;
                if (textNode && iconNode) {
                  const newText = updateName(textNode, updatedName);
                  const newIconElement = updateIcon(iconNode, updatedIcon);
                  walletId.updateFlag(newIconElement);
                  afterUpdate?.(newText, newIconElement);
                }
              } catch (e) {
                universalLog.warn(e);
              }
            }
          }
        }
      },
    });
  }
}

try {
  hackWalletConnectButton(sitesConfig);
} catch (e) {
  universalLog.warn(e);
}
