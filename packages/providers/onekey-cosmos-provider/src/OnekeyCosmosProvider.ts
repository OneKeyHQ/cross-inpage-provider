/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable tsdoc/syntax */
import { bytesToHex, hexToBytes, checkEnableDefineProperty, checkWalletSwitchEnable, type IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { ProviderCosmosBase } from './ProviderCosmosBase';
import type * as TypeUtils from './type-utils';
import type { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';

import type {
  AminoSignResponse,
  BroadcastMode,
  ChainInfoWithoutEndpoints,
  DirectSignResponse,
  DirectSignResponseHex,
  EthSignType,
  KeplrIntereactionOptions,
  KeplrMode,
  KeplrSignOptions,
  Key,
  KeyHex,
  OfflineAminoSigner,
  OfflineDirectSigner,
  StdSignature,
  StdSignDoc,
} from './types';
// @ts-ignore
import Long from 'long';
import { CosmJSOfflineSigner, CosmJSOfflineSignerOnlyAmino } from './cosmjs';
import { isArray } from 'lodash-es';
import { JSONUint8Array } from './utils/uint8-array';

const PROVIDER_EVENTS = {
  'connect': 'connect',
  'disconnect': 'disconnect',
  'keplr_keystorechange': 'keplr_keystorechange',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

type CosmosProviderEventsMap = {
  [PROVIDER_EVENTS.connect]: (account: Key) => void;
  [PROVIDER_EVENTS.disconnect]: () => void;
  [PROVIDER_EVENTS.keplr_keystorechange]: () => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
};

export type CosmosRequest = {
  // babylon
  'babylonConnectWallet': () => Promise<string>;

  'babylonGetKey': () => Promise<KeyHex>;

  // keplr
  'enable': (chainIds: string[]) => Promise<void>;

  'disconnect': (chainIds: string[]) => Promise<void>;

  'experimentalSuggestChain': (chain: any) => Promise<void>;

  'getKey': (chainId: string) => Promise<KeyHex>;

  'signAmino': (
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: KeplrSignOptions,
  ) => Promise<AminoSignResponse>;
  'signDirect': (
    chainId: string,
    signer: string,
    signDoc: {
      /** SignDoc bodyBytes */
      bodyBytes?: string | null;

      /** SignDoc authInfoBytes */
      authInfoBytes?: string | null;

      /** SignDoc chainId */
      chainId?: string | null;

      /** SignDoc accountNumber */
      accountNumber?: string | null;
    },
    signOptions?: KeplrSignOptions,
  ) => Promise<DirectSignResponseHex>;

  'sendTx': (chainId: string, tx: string, mode: BroadcastMode) => Promise<string>;

  'signArbitrary': (
    chainId: string,
    signer: string,
    data: string | Uint8Array,
  ) => Promise<StdSignature>;
  'verifyArbitrary': (
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature,
  ) => Promise<boolean>;

  'signEthereum': (
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType,
  ) => Promise<string>;

  'getChainInfosWithoutEndpoints':() => Promise<ChainInfoWithoutEndpoints[]>;

  'getChainInfoWithoutEndpoints':(chainId: string) => Promise<ChainInfoWithoutEndpoints>;

  // 'suggestToken'(
  //   chainId: string,
  //   contractAddress: string,
  //   viewingKey?: string
  // ): Promise<void>;
  // 'getSecret20ViewingKey'(
  //   chainId: string,
  //   contractAddress: string
  // ): Promise<string>;
  // 'getEnigmaUtils'(chainId: string): SecretUtils;

  // // Related to Enigma.
  // // But, recommended to use `getEnigmaUtils` rather than using below.
  // 'getEnigmaPubKey'(chainId: string): Promise<Uint8Array>;
  // 'getEnigmaTxEncryptionKey'(
  //   chainId: string,
  //   nonce: Uint8Array
  // ): Promise<Uint8Array>;
  // 'enigmaEncrypt'(
  //   chainId: string,
  //   contractCodeHash: string,
  //   // eslint-disable-next-line @typescript-eslint/ban-types
  //   msg: object
  // ): Promise<Uint8Array>;
  // 'enigmaDecrypt'(
  //   chainId: string,
  //   ciphertext: Uint8Array,
  //   nonce: Uint8Array
  // ): Promise<Uint8Array>;
};

type JsBridgeRequest = {
  [K in keyof CosmosRequest]: (
    params: Parameters<CosmosRequest[K]>[0],
  ) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<CosmosRequest[K]>>>>;
};

type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0];

type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

export interface IProviderCosmos {
  readonly mode: KeplrMode;
  defaultOptions: KeplrIntereactionOptions;

  enable(chainIds: string | string[]): Promise<void>;

  babylonConnectWallet(): Promise<string>;

  babylonGetKey(): Promise<Key>;

  getKey(chainId: string): Promise<Key>;

  experimentalSuggestChain(chain: any): Promise<void>;

  signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: KeplrSignOptions,
  ): Promise<AminoSignResponse>;
  signDirect(
    chainId: string,
    signer: string,
    signDoc: {
      /** SignDoc bodyBytes */
      bodyBytes?: Uint8Array | null;

      /** SignDoc authInfoBytes */
      authInfoBytes?: Uint8Array | null;

      /** SignDoc chainId */
      chainId?: string | null;

      /** SignDoc accountNumber */
      accountNumber?: Long | null;
    },
    signOptions?: KeplrSignOptions,
  ): Promise<DirectSignResponse>;

  sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode): Promise<Uint8Array>;

  signArbitrary(chainId: string, signer: string, data: string | Uint8Array): Promise<StdSignature>;
  verifyArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature,
  ): Promise<boolean>;

  signEthereum(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType,
  ): Promise<Uint8Array>;

  getOfflineSigner(chainId: string): OfflineAminoSigner & OfflineDirectSigner;
  getOfflineSignerOnlyAmino(chainId: string): OfflineAminoSigner;
  getOfflineSignerAuto(chainId: string): Promise<OfflineAminoSigner | OfflineDirectSigner>;

  getChainInfosWithoutEndpoints(): Promise<ChainInfoWithoutEndpoints[]>;
}

export type OneKeySuiProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

class ProviderCosmos extends ProviderCosmosBase implements IProviderCosmos {
  public readonly mode: KeplrMode = 'extension';
  protected _account: Key | null = null;
  public defaultOptions: KeplrIntereactionOptions = {};

  constructor(props: OneKeySuiProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._registerEvents();
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      if (!payload) return;
      const { method, params } = payload;

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        this._handleAccountChange(params as KeyHex | undefined);
      }
    });

    this.on(PROVIDER_EVENTS.keplr_keystorechange, () => {
      window.dispatchEvent(new Event(PROVIDER_EVENTS.keplr_keystorechange));
    })

    window.addEventListener('message', (e) => {
      const data = e.data as undefined | {
        type: string;
        method: string;
        args: any[];
        id: string;
      };
      if(!checkWalletSwitchEnable()) return;
      const hasHandle = data && data.type && data.type.startsWith('proxy-request') && data.type !== 'proxy-request-response';
      if (data && hasHandle && data.method) {
        const method = data.method as 'enable';
        if (this[method]) {
          const unwrapedArgs = JSONUint8Array.unwrap(data.args) as object[];
          (this[method] as (...args: any[]) => Promise<any>)(...unwrapedArgs, {
            typeLongToString: true,
          }).then((res) => {
            window.postMessage({
              type: 'proxy-request-response',
              id: data.id,
              result: JSONUint8Array.wrap({
                return: res as object,
              }) as {
                return: any;
              },
            });
          }).catch((err: { message: string }) => {
            window.postMessage({
              type: 'proxy-request-response',
              id: data.id,
              result: {
                error: err.message,
              },
            });
          })
        } else {
          window.postMessage({
            type: 'proxy-request-response',
            id: data.id,
            result: {
              error: 'not found method',
            },
          });
        }
      }
    });
  }

  private _callBridge<T extends keyof JsBridgeRequest>(params: {
    method: T;
    params: JsBridgeRequestParams<T>;
  }): JsBridgeRequestResponse<T> {
    return this.bridgeRequest(params) as JsBridgeRequestResponse<T>;
  }

  private _handleConnected(account: KeyHex, options: { emit: boolean } = { emit: true }) {
    this._account = account;
    if (options.emit && this.isConnectionStatusChanged('connected')) {
      this.connectionStatus = 'connected';
      const address = account ?? null;
      this.emit('connect', address);
      // this.emit('keplr_keystorechange');
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._account = null;

    if (options.emit && this.isConnectionStatusChanged('disconnected')) {
      this.connectionStatus = 'disconnected';
      this.emit('disconnect');
      // this.emit('keplr_keystorechange');
    }
  }

  isAccountsChanged(account: KeyHex | undefined) {
    if (!account) return false;
    if (!this._account) return true;

    return account.pubKey !== this._account.pubKey;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: KeyHex | undefined) {
    const account = payload;
    if (this.isAccountsChanged(account)) {
      this.emit(PROVIDER_EVENTS.keplr_keystorechange);
    }
    if (!account) {
      this._handleDisconnected();
      return;
    }

    this._handleConnected(account, { emit: false });
  }

  private _network: string | null | undefined;
  isNetworkChanged(network: string) {
    return this._network === undefined || network !== this._network;
  }

  isConnected() {
    return this._account !== null;
  }

  on<E extends keyof CosmosProviderEventsMap>(
    event: E,
    listener: CosmosProviderEventsMap[E],
  ): this {
    return super.on(event, listener);
  }

  emit<E extends keyof CosmosProviderEventsMap>(
    event: E,
    ...args: Parameters<CosmosProviderEventsMap[E]>
  ): boolean {
    return super.emit(event, ...args);
  }

  enable(chainIds: string | string[]): Promise<void> {
    return this._callBridge({
      method: 'enable',
      params: isArray(chainIds) ? chainIds : [chainIds],
    });
  }

  babylonConnectWallet(): Promise<string> {
    return this._callBridge({
      method: 'babylonConnectWallet',
      params: undefined,
    });
  }

  async babylonGetKey(): Promise<Key> {
    const key = await this._callBridge({
      method: 'babylonGetKey',
      params: undefined,
    });
    return {
      ...key,
      // @ts-expect-error
      pubKey: hexToBytes(key.pubKey),
      // @ts-expect-error
      address: hexToBytes(key.address),
    };
  }

  disconnect(): Promise<void> {
    return this._callBridge({
      method: 'disconnect',
      // @ts-expect-error
      params: undefined,
    });
  }

  async getKey(chainId: string): Promise<Key> {
    const key = await this._callBridge({
      method: 'getKey',
      params: chainId,
    });

    return {
      ...key,
      // @ts-expect-error
      pubKey: hexToBytes(key.pubKey),
      // @ts-expect-error
      address: hexToBytes(key.address),
    };
  }

  ping(): Promise<void> {
    return Promise.resolve();
  }

  experimentalSuggestChain(chain: any): Promise<void> {
    return this._callBridge({
      method: 'experimentalSuggestChain',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      params: chain,
    });
  }

  signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: KeplrSignOptions | undefined,
  ): Promise<AminoSignResponse> {
    return this._callBridge({
      method: 'signAmino',
      // @ts-expect-error
      params: {
        chainId,
        signer,
        signDoc,
        signOptions,
      },
    });
  }

  async signDirect(
    chainId: string,
    signer: string,
    signDoc: {
      /** SignDoc bodyBytes */
      bodyBytes?: Uint8Array | null | undefined;
      /** SignDoc authInfoBytes */
      authInfoBytes?: Uint8Array | null | undefined;
      /** SignDoc chainId */
      chainId?: string | null | undefined;
      /** SignDoc accountNumber */
      accountNumber?: Long | null | undefined;
    },
    signOptions?: KeplrSignOptions | undefined,
    customOptions?: {
      typeLongToString?: boolean;
    },
  ): Promise<DirectSignResponse> {
    const res = await this._callBridge({
      method: 'signDirect',
      // @ts-expect-error
      params: {
        chainId,
        signer,
        signDoc: {
          bodyBytes: signDoc?.bodyBytes ? bytesToHex(signDoc?.bodyBytes) : null,
          authInfoBytes: signDoc?.authInfoBytes ? bytesToHex(signDoc?.authInfoBytes) : null,
          chainId: signDoc.chainId,
          accountNumber: signDoc?.accountNumber?.toString(),
        },
        signOptions,
      },
    });

    return {
      ...res,
      signed: {
        // @ts-expect-error
        bodyBytes: hexToBytes(res.signed.bodyBytes),
        // @ts-expect-error
        authInfoBytes: hexToBytes(res.signed.authInfoBytes),
        // @ts-ignore
        accountNumber: customOptions?.typeLongToString ? res.signed.accountNumber?.toString() : Long.fromString(res.signed.accountNumber),
        chainId: res.signed.chainId,
      },
    };
  }

  async sendTx(chainId: string, tx: Uint8Array, mode: BroadcastMode): Promise<Uint8Array> {
    const res = await this._callBridge({
      method: 'sendTx',
      // @ts-expect-error
      params: {
        chainId,
        tx: bytesToHex(tx),
        mode,
      },
    });

    return hexToBytes(res);
  }

  signArbitrary(chainId: string, signer: string, data: string | Uint8Array): Promise<StdSignature> {
    const newData = typeof data === 'string' ? data : bytesToHex(data);
    return this._callBridge({
      method: 'signArbitrary',
      // @ts-expect-error
      params: {
        chainId,
        signer,
        data: newData,
      },
    });
  }

  verifyArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    signature: StdSignature,
  ): Promise<boolean> {
    return this._callBridge({
      method: 'verifyArbitrary',
      // @ts-expect-error
      params: {
        chainId,
        signer,
        data: typeof data === 'string' ? data : bytesToHex(data),
        signature,
      },
    });
  }

  async signEthereum(
    chainId: string,
    signer: string,
    data: string | Uint8Array,
    type: EthSignType,
  ): Promise<Uint8Array> {
    const res = await this._callBridge({
      method: 'signEthereum',
      // @ts-expect-error
      params: {
        chainId,
        signer,
        data: typeof data === 'string' ? data : bytesToHex(data),
        type,
      },
    });
    return hexToBytes(res);
  }

  getOfflineSigner(chainId: string): OfflineAminoSigner & OfflineDirectSigner {
    return new CosmJSOfflineSigner(chainId, this);
  }

  getOfflineSignerOnlyAmino(chainId: string): OfflineAminoSigner {
    return new CosmJSOfflineSignerOnlyAmino(chainId, this);
  }

  async getOfflineSignerAuto(chainId: string): Promise<OfflineAminoSigner | OfflineDirectSigner> {
    const key = await this.getKey(chainId);
    if (key.isNanoLedger) {
      return new CosmJSOfflineSignerOnlyAmino(chainId, this);
    }
    return new CosmJSOfflineSigner(chainId, this);
  }

  async getChainInfosWithoutEndpoints(): Promise<ChainInfoWithoutEndpoints[]> {
    return this._callBridge({
      method: 'getChainInfosWithoutEndpoints',
      params: undefined,
    });
  }

  async getChainInfoWithoutEndpoints(chainId: string): Promise<ChainInfoWithoutEndpoints> {
    return this._callBridge({
      method: 'getChainInfoWithoutEndpoints',
      params: chainId,
    });
  }
}

export { ProviderCosmos };
