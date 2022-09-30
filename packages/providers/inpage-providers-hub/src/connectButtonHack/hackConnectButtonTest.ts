import { ThrottleSettings } from 'lodash';
import { throttle } from 'lodash'; // cause jira crash
// import throttle from 'lodash/throttle';

import type { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import type { IWindowOneKeyHub } from '../injectWeb3Provider';

function hackConnectButton(): ThrottleSettings {
  console.log('throttle >>>>> ', throttle);
  return { leading: false, trailing: true };
}

export { hackConnectButton };
