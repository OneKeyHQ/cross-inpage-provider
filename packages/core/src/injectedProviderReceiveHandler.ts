/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { IJsBridgeMessagePayload, IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { JsBridgeBase } from './JsBridgeBase';
import { consoleErrorInDev } from './loggers';
import { ProviderBase } from './ProviderBase';

function injectedProviderReceiveHandler(payload: IJsBridgeMessagePayload, bridge?: JsBridgeBase) {
  // ethereum, solana, conflux
  const providerHub = bridge?.providersHub || window.$onekey;

  const providerName = payload.scope;
  const payloadData = payload.data as IJsonRpcRequest;

  if (!providerName) {
    consoleErrorInDev('providerName (scope) is required in injectedProviderReceiveHandler.');
    return;
  }

  const providers: ProviderBase[] = ([] as ProviderBase[])
    .concat(providerHub[providerName] as ProviderBase)
    .filter(Boolean);
  if (!providers || !providers.length) {
    consoleErrorInDev(`[${providerName as string}] provider is NOT injected to document or bridge.`);
    return;
  }

  // emit events to injected provider
  providers.forEach((provider) => {
    if (provider && provider.emit) {
      provider.emit('message_low_level', payloadData);
    }
  });
}

export { injectedProviderReceiveHandler };
