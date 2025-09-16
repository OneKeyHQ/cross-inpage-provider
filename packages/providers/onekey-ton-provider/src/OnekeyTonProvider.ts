/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { IInpageProviderConfig, IProviderBaseConnectionStatus } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderTonBase } from './ProviderTonBase';
import type * as TypeUtils from './type-utils';
import {
  AppRequest,
  CONNECT_EVENT_ERROR_CODES,
  ConnectEvent,
  ConnectItemReply,
  ConnectRequest,
  DeviceInfo,
  RpcMethod,
  SEND_TRANSACTION_ERROR_CODES,
  TonProofItem,
  WalletEvent,
  WalletResponse,
  WalletResponseSuccess,
  WalletResponseError,
} from '@tonconnect/protocol';
import {
  AccountInfo,
  ConnectEventErrorMessage,
  SendTransactionErrorMessage,
  SignDataRequest,
  SignDataResult,
  SignProofRequest,
  SignProofResult,
  TransactionRequest,
  WalletInfo,
} from './types';

const PROVIDER_EVENTS = {
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

export type TonRequest = {
  'connect': (protocolVersion?: number, message?: ConnectRequest) => Promise<AccountInfo>;
  'disconnect': () => Promise<void>;
  'sendTransaction': (payload: TransactionRequest) => Promise<string>;
  'signData': (payload: SignDataRequest) => Promise<SignDataResult>;
  'signProof': (request: SignProofRequest) => Promise<SignProofResult>;
  'getDeviceInfo': () => Promise<Partial<DeviceInfo>>;
};

const TonResponseError = {
  ParameterError: 1,
  InvalidManifestUrl: 2,
  ContentManifest: 3,
} as const;

type JsBridgeRequest = {
  [K in keyof TonRequest]: (
    params: Parameters<TonRequest[K]>,
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
  send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>>;
  listen(callback: (event: WalletEvent) => void): void;
}

type OneKeyTonProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

export function createTonProviderOpenMask(originalProvider: ProviderTon) {
  return createTonProvider(
    originalProvider,
    {
      appName: 'openmask',
      appVersion: '0.21.1',
    },
    {
      name: 'OpenMask',
      image:
        'https://raw.githubusercontent.com/OpenProduct/openmask-extension/main/public/openmask-logo-288.png',
      about_url: 'https://www.openmask.app/',
    },
  );
}

export function createTonProvider(
  originalProvider: ProviderTon,
  customDeviceInfo: Partial<DeviceInfo>,
  customWalletInfo: Partial<WalletInfo>,
): ProviderTon {
  return new Proxy(originalProvider, {
    get(target, prop, receiver) {
      if (prop === 'deviceInfo') {
        return { ...target.deviceInfo, ...customDeviceInfo };
      }
      if (prop === 'walletInfo') {
        return { ...target.walletInfo, ...customWalletInfo };
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return Reflect.get(target, prop, receiver);
    },
  });
}

// Doc: https://github.com/ton-blockchain/ton-connect/blob/main/requests-responses.md
export class ProviderTon extends ProviderTonBase implements IProviderTon {
  private _accountInfo: AccountInfo | null = null;

  deviceInfo: DeviceInfo = {
    platform: this._getPlatform(),
    appName: 'onekey',
    appVersion: this.version,
    maxProtocolVersion: 2,
    features: ["SendTransaction", { name: 'SendTransaction', maxMessages: 4 }],
  };
  walletInfo?: WalletInfo = {
    name: 'OneKey',
    image: 'https://common.onekey-asset.com/logo/onekey-x288.png',
    about_url: 'https://onekey.so',
  };
  protocolVersion = 2;
  isWalletBrowser = false;
  connectionStatus: IProviderBaseConnectionStatus = 'disconnected';

  constructor(props: OneKeyTonProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    // void this._getDeviceInfo();

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

  async _connect(protocolVersion?: number, message?: ConnectRequest): Promise<ConnectEvent> {
    const id = Date.now();
    const isGetTonAddr =
      !message || (message && message.items.some((item) => item.name === 'ton_addr'));
    const proofItem =
      message &&
      (message.items.find((item) => item.name === 'ton_proof') as TonProofItem | undefined);
    const items = [] as ConnectItemReply[];

    if (isGetTonAddr) {
      if (this._accountInfo) {
        items.push({
          name: 'ton_addr',
          ...this._accountInfo,
        });
      } else {
        let result: AccountInfo | undefined;
        try {
          result = await this._callBridge({
            method: 'connect',
            params: protocolVersion && message ? [protocolVersion, message] : [],
          });
        } catch (error) {
          const { code, message } = error as { code?: number; message?: string };
          if (code === 4001) {
            return {
              event: 'connect_error',
              id,
              payload: {
                code: CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR,
                message: ConnectEventErrorMessage.USER_DECLINED,
              },
            };
          } else if (code === TonResponseError.InvalidManifestUrl || code === TonResponseError.ContentManifest) {
            return {
              event: 'connect_error',
              id,
              payload: {
                code,
                message: message ?? "",
              },
            };
          }
        }

        console.log('=====>>>>> connect result', result);

        if (!result) {
          return {
            event: 'connect_error',
            id,
            payload: {
              code: CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
              message: ConnectEventErrorMessage.UNKNOWN_ERROR,
            },
          };
        }
        items.push({
          name: 'ton_addr',
          ...result,
        });
        this._handleConnected(result, { emit: true });
      }
    }

    if (proofItem) {
      let result: SignProofResult | undefined;
      try {
        result = await this._callBridge({
          method: 'signProof',
          params: [
            {
              payload: proofItem.payload,
            },
          ],
        });
      } catch (error) {
        const { code } = error as { code?: number; message?: string };
        console.log('=====>>>>> signProof error', error);
        if (code === 4001) {
          return {
            event: 'connect_error',
            id,
            payload: {
              code: CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR,
              message: ConnectEventErrorMessage.USER_DECLINED,
            },
          };
        }
      }
      if (!result) {
        return {
          event: 'connect_error',
          id,
          payload: {
            code: CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
            message: ConnectEventErrorMessage.UNKNOWN_ERROR,
          },
        };
      }

      items.push({
        name: 'ton_proof',
        proof: {
          ...result,
          payload: proofItem.payload,
        },
      });
    }

    return {
      event: 'connect',
      id,
      payload: {
        items,
        device: this.deviceInfo,
      },
    };
  }

  connect(protocolVersion?: number, message?: ConnectRequest): Promise<ConnectEvent> {
    try {
      return this._connect(protocolVersion, message).then((res) => {
        console.log('=====>>>>> connect res', res);
        return res;
      });
    } catch (error) {
      console.error('=====>>>>> connect error', error);
      throw error;
    }
  }

  restoreConnection(): Promise<ConnectEvent> {
    return this._connect();
  }

  convertError<T extends RpcMethod>(id: string, error: unknown, method: string): WalletResponseError<T> {
    const { code, message } = error as { code?: number; message?: string };
    if (code === 4001) {
      let errorMessage: string = ConnectEventErrorMessage.USER_DECLINED;
      if(method === 'sendTransaction' || method === 'signData'){
        errorMessage = SendTransactionErrorMessage.USER_REJECTS_ERROR;
      }
      return {
        id,
        error: {
          code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
          message: errorMessage,
        },
      } as WalletResponseError<T>;
    } else if(code === TonResponseError.ParameterError) {
      return {
        id,
        error: {
          code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
          message: message,
        },
      } as WalletResponseError<T>;
    } else {
      return {
        id,
        error: {
          code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
          message: message ?? '',
        },
      } as WalletResponseError<T>;
    }
  }

  async send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>> {
    const id = message.id;

    let res: unknown;
    try {
      const params = message.params.map((p) => {
        if (typeof p === 'string') {
          return JSON.parse(p) as unknown;
        }
        return p;
      });
      if (message.method === 'sendTransaction') {
        res = await this._sendTransaction(params[0] as TransactionRequest);
      } else if (message.method === 'signData') {
        res = await this._signData(params[0] as SignDataRequest);
      } else if (message.method === 'disconnect') {
        await this._disconnect();
        // @ts-expect-error
        return;
      } else {
        return {
          id,
          error: {
            code: SEND_TRANSACTION_ERROR_CODES.METHOD_NOT_SUPPORTED,
            message: SendTransactionErrorMessage.METHOD_NOT_SUPPORTED,
          },
        } as WalletResponseError<T>;
      }
    } catch (error) {
      return this.convertError(id, error,message.method);
    }

    if (res === undefined) {
      return {
        id,
        error: {
          code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
          message: SendTransactionErrorMessage.UNKNOWN_ERROR,
        },
      } as WalletResponseError<T>;
    }

    return {
      id,
      result: res,
    } as WalletResponseSuccess<T>;
  }

  private async _sendTransaction(request: TransactionRequest): Promise<string> {
    return await this._callBridge({
      method: 'sendTransaction',
      params: [request],
    });
  }

  private async _signData(request: SignDataRequest): Promise<SignDataResult> {
    const res = await this._callBridge({
      method: 'signData',
      params: [request],
    });

    return res;
  }

  async disconnect(): Promise<void> {
    await this._disconnect();
  }

  private async _disconnect(): Promise<void> {
    await this._callBridge({
      method: 'disconnect',
      params: [],
    });
    this._handleDisconnected({ emit: true });
  }

  listen(callback: (event: WalletEvent) => void): void {
    super.on('event', callback);
  }
}
