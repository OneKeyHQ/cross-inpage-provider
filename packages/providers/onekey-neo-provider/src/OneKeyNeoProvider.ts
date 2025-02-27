/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderNeoBase } from './ProviderNeoBase';
import type * as TypeUtils from './type-utils';

const PROVIDER_EVENTS = {
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type NeoRequest = {
  connect: () => Promise<void>;
};

type JsBridgeRequest = {
  [K in keyof NeoRequest]: (
    params: Parameters<NeoRequest[K]>,
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<NeoRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;



export class ProviderNeo extends ProviderNeoBase {
  constructor(props: IInpageProviderConfig & { timeout?: number }) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });
  }

}