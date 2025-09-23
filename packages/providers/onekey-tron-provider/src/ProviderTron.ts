/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import dequal from 'fast-deep-equal';
import { TronWeb } from 'tronweb';
import type { UnsignedTransaction, SignedTransaction } from 'tronweb';
import SunWeb from 'sunweb';
import { isEmpty } from 'lodash-es';
import {
  IInpageProviderConfig,
  checkWalletSwitchEnable,
  defineWindowProperty,
} from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';

import { ProviderTronBase } from './ProviderTronBase';
import {
  IProviderTron,
  ProviderEvents,
  ProviderEventsMap,
  ConsoleLike,
  Nodes,
  Callback,
  RequestArguments,
  requestAccountsResponse,
} from './types';
import { isWalletEventMethodMatch } from './utils';
import BigNumber from 'bignumber.js';
type OneKeyTronProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

export const CONTRACT_ADDRESS = {
  MAIN: 'TL9q7aDAHYbW5KdPCwk8oJR3bCDhRwegFf',
  SIDE: 'TGKotco6YoULzbYisTBuP6DWXDjEgJSpYz',
};

export const SIDE_CHAIN_ID = '41E209E4DE650F0150788E8EC5CAFA240A23EB8EB7';

export const AUTO_REQUEST_ACCOUNTS_ORIGIN_WHITE_LIST = [
  'https://tronscan.org',
  'https://tronscan.io',
  'https://app.justlend.org',
];

export const TRON_REQUEST_ACCOUNTS_LOCAL_KEY = 'onekey_tron_request_accounts_local_key';

export const TRON_REQUEST_ACCOUNTS_INTERVAL = 10 * 60 * 1000; // ten minutes

const globalWindow = typeof window !== 'undefined' ? window : global;

class OneKeyTronWeb extends TronWeb {
  constructor(props: any, provider: IProviderTron) {
    super(props);
    this.provider = provider;
    this.defaultAddress = {
      hex: false,
      base58: false,
    };
    this.trx.sign = (transaction: UnsignedTransaction) => provider.sign(transaction);
    this.trx.signMessage = (transaction: UnsignedTransaction) => provider.signMessage(transaction);
    this.trx.signMessageV2 = (message: string | Uint8Array | Array<number>, privateKey?: string | false) => provider.signMessageV2(message, privateKey);
    this.trx.getNodeInfo = (callback?: Callback) => provider.getNodeInfo(callback);
  }
  provider!: IProviderTron;

  override request<T>(args: RequestArguments): Promise<T> {
    return this.provider.request(args);
  }
}

class ProviderTron extends ProviderTronBase implements IProviderTron {
  public readonly isTronLink = true;
  public tronWeb: TronWeb | null = null;
  public sunWeb: SunWeb | null = null;
  public ready = false;

  private _initialized = false;
  private _connected = false;
  private _requestingAccounts = false;
  private _defaultAddress: TronWeb['defaultAddress'] = {
    hex: false,
    base58: false,
  };

  private _accounts: string[] = [];
  private _nodes: Nodes = {
    fullHost: '',
    fullNode: '',
    solidityNode: '',
    eventServer: '',
  };

  private readonly _log: ConsoleLike;

  constructor(props: OneKeyTronProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._log = props.logger ?? window.console;

    if (checkWalletSwitchEnable()) {
      this._registerEvents();

      void this._initialize();
    }
  }

  private _registerTronWeb(nodes: Nodes): { tronWeb: TronWeb; sunWeb: SunWeb } | null {
    if (isEmpty(nodes)) return null;

    const tronWeb: TronWeb = new OneKeyTronWeb(
      {
        ...nodes,
      },
      this,
    );

    const tronWeb1: TronWeb = new OneKeyTronWeb(
      {
        ...nodes,
      },
      this,
    );

    const tronWeb2: TronWeb = new OneKeyTronWeb(
      {
        ...nodes,
      },
      this,
    );

    const sunWeb: SunWeb = new SunWeb(
      tronWeb1,
      tronWeb2,
      CONTRACT_ADDRESS.MAIN,
      CONTRACT_ADDRESS.SIDE,
      SIDE_CHAIN_ID,
    );

    return { tronWeb, sunWeb };
  }

  private async _initialize() {
    try {
      const { accounts, nodes } = await this.request<{
        accounts: string[];
        nodes: Nodes;
      }>({
        method: 'tron_getProviderState',
      });

      const resp = this._registerTronWeb(nodes);

      if (!resp) return;

      const { sunWeb, tronWeb } = resp;

      if (window.tronWeb !== undefined) {
        this._log.warn(
          'OneKey: TronWeb is already initiated. Onekey will overwrite the current instance',
        );
      }

      if (window.sunWeb !== undefined) {
        this._log.warn(
          'OneKey: TronWeb is already initiated. Onekey will overwrite the current instance',
        );
      }

      this.tronWeb = tronWeb;
      this.sunWeb = sunWeb;

      defineWindowProperty('tronWeb', tronWeb);

      defineWindowProperty('sunWeb', sunWeb);

      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const self = this;
      Object.defineProperty(tronWeb, 'defaultAddress', {
        get() {
          if (!self._connected) {
            self._log.warn(
              'OneKey: We recommend that DApp developers use $onekey.tron.request({method: "tron_requestAccounts"}) to request users’ account information at the earliest time possible in order to get a complete TronWeb injection.',
            );

            const origin = globalWindow?.location?.origin || '';

            if (origin && AUTO_REQUEST_ACCOUNTS_ORIGIN_WHITE_LIST.includes(origin)) {
              const requestAccountsLocalStr = localStorage.getItem(TRON_REQUEST_ACCOUNTS_LOCAL_KEY);

              const requestAccountsLocal = requestAccountsLocalStr
                ? JSON.parse(requestAccountsLocalStr)
                : null;

              if (requestAccountsLocal && requestAccountsLocal[origin]) {
                const requestTimeStamp = requestAccountsLocal[origin];

                if (
                  new BigNumber(Date.now())
                    .minus(requestTimeStamp as string)
                    .isGreaterThan(TRON_REQUEST_ACCOUNTS_INTERVAL)
                ) {
                  localStorage.setItem(
                    TRON_REQUEST_ACCOUNTS_LOCAL_KEY,
                    JSON.stringify({
                      ...requestAccountsLocal,
                      [origin]: Date.now(),
                    }),
                  );
                  void self.request({
                    method: 'tron_requestAccounts',
                  });
                }
              } else {
                localStorage.setItem(
                  TRON_REQUEST_ACCOUNTS_LOCAL_KEY,
                  JSON.stringify({
                    ...requestAccountsLocal,
                    [origin]: Date.now(),
                  }),
                );
                void self.request({
                  method: 'tron_requestAccounts',
                });
              }
            }
          }

          return self._defaultAddress;
        },
        set(value) {
          self._defaultAddress = value as TronWeb['defaultAddress'];
        },
      });

      this._handleAccountsChanged(accounts);
      this._dispatch('tronLink#initialized');
      this._initialized = true;
    } catch (error) {
      this._log.error('OneKey: Failed to get initial state. Please report this bug.', error);
    }
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this.__handleDisconnected();
    });

    this.on(ProviderEvents.MESSAGE_LOW_LEVEL, (payload: { method: string; params: any }) => {
      const { method } = payload;

      if (isWalletEventMethodMatch(method, ProviderEvents.ACCOUNTS_CHANGED)) {
        this._handleAccountsChanged(payload.params as string[]);
      }

      if (isWalletEventMethodMatch(method, ProviderEvents.NODES_CHANGED)) {
        if (this._initialized) {
          this._handleNodesChanged(payload.params as { nodes: Nodes; chainId: string });
        } else {
          void this._initialize();
        }
      }
    });
  }

  override isAccountsChanged(accounts: string[]) {
    return !dequal(this._accounts, accounts);
  }

  private _handleAccountsChanged(accounts: string[]) {
    let _accounts = accounts;

    if (!Array.isArray(accounts)) {
      this._log.error(
        'Onekey: Received invalid accounts parameter. Please report this bug.',
        accounts,
      );
      _accounts = [];
    }

    for (const account of _accounts) {
      if (typeof account !== 'string') {
        this._log.error('Onekey: Received non-string account. Please report this bug.', accounts);
        _accounts = [];
        break;
      }
    }

    if (this.isAccountsChanged(_accounts)) {
      this._accounts = _accounts;
      const address = _accounts[0];

      const tronWeb = this.tronWeb as TronWeb;

      if (!tronWeb) {
        return;
      }

      if (tronWeb.isAddress(address)) {
        tronWeb.setAddress(address);
        tronWeb.ready = true;
        this.ready = true;
        this._handleConnected();
      } else {
        tronWeb.defaultAddress = {
          hex: false,
          base58: false,
        };
        tronWeb.ready = false;
        this.ready = false;
        this.__handleDisconnected();
      }

      if (this._initialized) {
        this._postMessage(ProviderEvents.SET_ACCOUNT, {
          address,
        });
        this._postMessage(ProviderEvents.ACCOUNTS_CHANGED, {
          address,
        });
        this.emit(ProviderEvents.ACCOUNTS_CHANGED, [address]);
      }
    }
  }

  private __handleDisconnected() {
    if (this._connected) {
      this._connected = false;
      this._postMessage(ProviderEvents.DISCONNECT);
    }
  }

  private _handleConnected() {
    if (!this._connected) {
      this._connected = true;
      this._postMessage(ProviderEvents.CONNECT);
      this._postMessage(ProviderEvents.ACCEPT_WEB);
    }
  }

  private _postMessage<T>(action: string, data?: T) {
    window.postMessage({
      message: {
        action,
        data,
      },
      isTronLink: true,
    });
  }

  private _dispatch(event: string) {
    window.dispatchEvent(new Event(event));
  }

  override isNetworkChanged(nodes: Nodes) {
    return !dequal(nodes, this._nodes);
  }
  private _handleNodesChanged({ nodes, chainId }: { nodes: Nodes; chainId: string }) {
    if (isEmpty(nodes)) return;

    if (this.isNetworkChanged(nodes)) {
      this._nodes = nodes;

      this.tronWeb?.setFullNode(nodes.fullNode ?? nodes.fullHost);
      this.tronWeb?.setSolidityNode(nodes.solidityNode ?? nodes.fullHost);
      this.tronWeb?.setEventServer(nodes.eventServer ?? nodes.fullHost);

      this._postMessage(ProviderEvents.NODES_CHANGED, {
        ...nodes,
      });

      this._postMessage(ProviderEvents.SET_NODE, {
        ...nodes,
        node: {
          chainId,
          chain: '_',
        },
      });

      this.emit(ProviderEvents.CHAIN_CHANGED, chainId);
    }
  }

  private async _requestAccounts(args: RequestArguments): Promise<requestAccountsResponse> {
    if (this._requestingAccounts) {
      return {
        code: 4001,
        message: 'in the request queue',
      };
    }

    this._requestingAccounts = true;

    try {
      const accounts = (await this.bridgeRequest(args)) as string[];

      this._handleAccountsChanged(accounts);

      this._requestingAccounts = false;

      if (accounts.length > 0) {
        return {
          code: 200,
          message: 'ok',
        };
      }

      return {
        code: 4000,
        message: 'user rejected',
      };
    } catch (e) {
      this._requestingAccounts = false;
      return {
        code: 4000,
        message: 'user rejected',
      };
    }
  }

  async request<T>(args: RequestArguments): Promise<T> {
    const { method, params } = args;

    if (!method || typeof method !== 'string' || method.length === 0) {
      throw web3Errors.rpc.methodNotFound();
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw web3Errors.rpc.invalidParams();
    }

    if (method === 'tron_requestAccounts') {
      const result = await this._requestAccounts(args);
      this._postMessage(ProviderEvents.TAB_REPLY, result);
      return result as unknown as T;
    }

    const resp = await this.bridgeRequest(args);

    return resp as T;
  }

  async sign(transaction: UnsignedTransaction): Promise<SignedTransaction> {
    if (this.tronWeb?.utils.isString(transaction)) {
      // @ts-ignore
      if (!this.tronWeb?.utils.isHex(transaction)) {
          throw new Error('Expected hex message input');
      }
      return this.request({
        method: 'signMessageV1',
        params: transaction,
      });
    }

    return this.request({
      method: 'tron_signTransaction',
      params: transaction,
    });
  }

  async signMessage(transaction: UnsignedTransaction): Promise<string> {
    let messageStr;
    if(typeof transaction === 'string') {
      messageStr = transaction;
    } else {
      throw new Error('Expected hex message input');
    }

    return this.request({
      method: 'signMessageV1',
      params: [messageStr],
    });
  }

  async signMessageV2(message: string | Uint8Array | Array<number>): Promise<string> {
    let messageStr;
    if(typeof message === 'string') {
      const bytes = this.tronWeb?.utils?.ethersUtils?.toUtf8Bytes(message);
      if(!bytes) {
        throw new Error('Expected message input');
      }
      messageStr = Buffer.from(bytes).toString('hex');
    } else {
      messageStr = Buffer.from(message).toString('hex');
    }

    return this.request({
      method: 'signMessageV2',
      params: [messageStr],
    });
  }

  async getNodeInfo(callback: Callback) {
    const info = await this.request({
      method: 'tron_getNodeInfo',
    });
    if (!callback) return info;
    callback(null, info);
  }
}

export { ProviderTron };
export {
  IProviderTron,
  ProviderEvents,
  ProviderEventsMap,
  ConsoleLike,
  Nodes,
  RequestArguments,
  TronWeb,
};
