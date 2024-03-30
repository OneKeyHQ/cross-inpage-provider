import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { hackConnectButton } from '../hackConnectButton';
import { SitesInfo, sitesConfig } from './config';
import { findIconAndNameByParent as defaultFindIconAndName } from './findIconAndName';
import { replaceIcon as defaultReplaceIcon } from './imgUtils';
import { replaceText as defaultReplaceText } from './textUtils';
import { FindResultType } from './type';
import { dbg } from './utils';

function hackWalletConnectButton(sites: SitesInfo[]) {
  for (const site of sites) {
    const { urls, walletsForProvider } = site;
    const providers = Object.keys(walletsForProvider) as IInjectedProviderNames[];
    hackConnectButton({
      urls,
      providers,
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
              } = wallet;
              const walletId = `${provider}-${updatedName.replace(/[\s&]/g, '').toLowerCase()}`;
              const hasReplaced = !!document.querySelector(`.${walletId}`);
              dbg('walletId', walletId);
              if (hasReplaced) {
                continue;
              }

              let result: FindResultType | undefined;
              if (findIconAndName) {
                result = findIconAndName.call(null, wallet);
              } else if (container) {
                const isSelector = typeof container === 'string';
                const containerElement: HTMLElement | null = isSelector
                  ? document.querySelector(container)
                  : container();
                if (!containerElement) {
                  continue;
                }
                result = defaultFindIconAndName(containerElement, name);
              }
              if (!result) {
                dbg('no result found');
                continue;
              }
              const { textNode, iconNode } = result;
              if (textNode && iconNode) {
                updateName(textNode, updatedName);
                const newIconElement = updateIcon(iconNode, updatedIcon);
                newIconElement.classList.add(walletId);
                dbg('textNode', textNode);
                dbg('iconNode', iconNode);
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
  console.log(e);
}
