/* eslint-disable @typescript-eslint/no-explicit-any */
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderTonBase } from './ProviderTonBase';
import type * as TypeUtils from './type-utils';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import { AccountInfo, AppRequest, ConnectEvent, ConnectEventErrorCode, ConnectEventErrorMessage, ConnectRequest, DeviceInfo, SignDataPayload, SignDataResult, TransactionPayload, WalletEvent, WalletInfo, WalletResponse } from './types';

const PROVIDER_EVENTS = {
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type TonRequest = {
  'connect': (protocolVersion?: number, message?: ConnectRequest) => Promise<AccountInfo>;
  'disconnect': () => Promise<void>;
  'sendTransaction': (payload: TransactionPayload) => Promise<string>;
  'signData': (payload: SignDataPayload) => Promise<SignDataResult>;
  'getDeviceInfo': () => Promise<Partial<DeviceInfo>>;
};

type JsBridgeRequest = {
  [K in keyof TonRequest]: (
    params: Parameters<TonRequest[K]>
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<TonRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

export interface IProviderTon extends ProviderTonBase {
  deviceInfo: DeviceInfo; // see Requests/Responses spec
  walletInfo?: WalletInfo;
  protocolVersion: number; // max supported Ton Connect version (e.g. 2)
  isWalletBrowser: boolean; // if the page is opened into wallet's browser
  connect(protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent>;
  restoreConnection(): Promise<ConnectEvent>;
  send(message: AppRequest): Promise<WalletResponse>;
  listen(callback: (event: WalletEvent) => void): void;
}

type OneKeyTonProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

export class ProviderTon extends ProviderTonBase implements IProviderTon {
  private _accountInfo: AccountInfo | null = null;

  deviceInfo: DeviceInfo = {
    platform: this._getPlatform(),
    appName: 'OneKey',
    appVersion: '5.0.0',
    maxProtocolVersion: 2,
    features: [
      { name: 'SendTransaction', maxMessages: 4 },
      { name: 'SignData' },
    ],
  };
  walletInfo?: WalletInfo;
  protocolVersion = 2;
  isWalletBrowser = true;

  constructor(props: OneKeyTonProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    void this._getDeviceInfo();

    this._registerEvents();
  }

  private _getPlatform() {
    const userAgent = window.navigator.userAgent,
      platform = window.navigator.platform,
      macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
      windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
      iosPlatforms = ['iPhone', 'iPad'];
    let os = 'windows';

    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'mac';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      if (platform === 'iPhone') {
        os = 'iphone';
      } else {
        os = 'ipad';
      }
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'windows';
    } else if (/Android/.test(userAgent)) {
      os = 'android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'linux';
    }

    return os as 'iphone' | 'ipad' | 'android' | 'windows' | 'mac' | 'linux';
  }

  private async _getDeviceInfo() {
    const deviceInfo = await this._callBridge({
      method: 'getDeviceInfo',
      params: [],
    });
    Object.assign(this.deviceInfo, deviceInfo);
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      if (!payload) return;
      const { method, params } = payload as { method: string; params: unknown };

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        this._handleAccountChange(params as AccountInfo);
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleConnected(accountInfo: AccountInfo, options: { emit: boolean } = { emit: true }) {
    this._accountInfo = accountInfo;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      const address = accountInfo.address ?? null;
      this.emit('connect', address);
      this.emit('accountChanged', address);
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._accountInfo = null;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      this.emit('accountChanged', null);
    }
  }

  override isAccountsChanged(accountInfo: AccountInfo | undefined) {
    return accountInfo?.address !== this._accountInfo?.address;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: AccountInfo) {
    const accountInfo = payload;
    if (this.isAccountsChanged(accountInfo)) {
      this.emit('accountChanged', accountInfo?.address || null);
    }
    if (!accountInfo) {
      this._handleDisconnected();
      return;
    }

    this._handleConnected(accountInfo, { emit: false });
  }

  private _network: string | null | undefined;
  override isNetworkChanged(network: string) {
    return this._network === undefined || network !== this._network;
  }

  private _id = 0;
  async _connect(protocolVersion?: number, message?: ConnectRequest): Promise<ConnectEvent> {
    const id = ++this._id;
    if (this._accountInfo) {
      return {
        event: 'connect',
        id,
        payload: {
          items: [{
            name: "ton_addr",
            ...this._accountInfo,
          }],
          device: this.deviceInfo,
        },
      }
    }

    const result = await this._callBridge({
      method: 'connect',
      params: (protocolVersion && message) ? [protocolVersion, message] : [],
    });

    if (!result) {
      return {
        event: "connect_error",
        id,
        payload: {
          code: ConnectEventErrorCode.UNKNOWN_ERROR,
          message: ConnectEventErrorMessage.UNKNOWN_ERROR
        }
      }
    }

    this._handleConnected(result, { emit: true });

    return {
      event: 'connect',
      id,
      payload: {
        items: [{
          name: "ton_addr",
          ...result,
        }],
        device: this.deviceInfo,
      },
    };
  }

  connect(protocolVersion?: number, message?: ConnectRequest): Promise<ConnectEvent> {
    return this._connect(protocolVersion, message);
  }

  restoreConnection(): Promise<ConnectEvent> {
    return this._connect();
  }

  async send(message: AppRequest): Promise<WalletResponse> {
    const id = message.id;
    
    let res: unknown;
    if (message.method === 'sendTransaction') {
      res = await this._sendTransaction(message.params[0] as TransactionPayload);
    } else if (message.method === 'signData') {
      res = await this._signData(message.params[0] as SignDataPayload);
    } else if (message.method === 'disconnect') {
      await this._disconnect();
      res = '';
    } else {
      throw web3Errors.provider.unsupportedMethod();
    }

    if (res === undefined) {
      throw web3Errors.provider.unauthorized();
    }

    return {
      id,
      result: res,
    };
  }

  private async _sendTransaction(payload: TransactionPayload): Promise<Uint8Array> {
    const txid = await this._callBridge({
      method: 'sendTransaction',
      params: [payload],
    });

    return Buffer.from(txid, 'hex');
  }

  private async _signData(payload: SignDataPayload): Promise<SignDataResult> {
    const res = await this._callBridge({
      method: 'signData',
      params: [payload],
    });

    return res;
  }

  private async _disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: [],
    });
    this._handleDisconnected();
  }

  listen(callback: (event: WalletEvent) => void): void {
    super.on('event', callback);
  }
}
