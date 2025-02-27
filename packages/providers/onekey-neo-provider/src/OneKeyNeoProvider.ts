/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderNeoBase } from './ProviderNeoBase';
import { IN3DapiMethods } from './types';
import { versionInfo } from '@onekeyfe/cross-inpage-provider-core'

const PROVIDER_EVENTS = {
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

/**
 * send NEOLine.N3.EVENT.READY event to notify the page that Neo Provider is ready
 */
function emitNeoReadyEvent(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  const readyEvent = new Event('NEOLine.N3.EVENT.READY');
  window.dispatchEvent(readyEvent);
}

/**
 * NEOLineN3 is a class to provide compatibility with Neo dAPI
 */
class NEOLineN3 {
  static instance: ProviderNeo | null = null;

  static Init = class Init implements IN3DapiMethods {
    public provider: ProviderNeo;

    constructor() {
      if (!NEOLineN3.instance) {
        throw new Error('NEOLineN3 instance not available');
      }
      this.provider = NEOLineN3.instance;
    }

    async getProvider(): Promise<{ name: string; website: string; version: string; compatibility: string[] }> {
      return this.provider.getProvider();
    }
  }
}

/**
 * ProviderNeo is the core implementation that communicates with OneKey Wallet
 */
class ProviderNeo extends ProviderNeoBase implements IN3DapiMethods {
  constructor(props: IInpageProviderConfig & { timeout?: number }) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });
  }

  getProvider(): Promise<{ name: string; website: string; version: string; compatibility: string[] }> {
    return Promise.resolve({
      name: 'OneKey Wallet',
      website: 'https://onekey.so',
      version: versionInfo.version || '1.0.0',
      compatibility: [],
    });
  }
}

export { NEOLineN3, ProviderNeo, emitNeoReadyEvent };
