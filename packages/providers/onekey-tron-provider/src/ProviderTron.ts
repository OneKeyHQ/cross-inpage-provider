import dequal from 'fast-deep-equal';
import TronWeb, { UnsignedTransaction, SignedTransaction } from 'tronweb';
import { isEmpty } from 'lodash';
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
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
type OneKeyTronProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class OneKeyTronWeb extends TronWeb {
  constructor(props: any, provider: IProviderTron) {
    super(props);
    this.provider = provider;
    this.defaultAddress = {
      hex: false,
      base58: false,
    };
    this.trx.sign = (transaction: UnsignedTransaction) => provider.sign(transaction);
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
  public sunWeb = {};
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

    this._registerEvents();

    void this._initialize();
  }

  private _registerTronWeb(nodes: Nodes): TronWeb | null {
    if (isEmpty(nodes)) return null;

    const tronWeb: TronWeb = new OneKeyTronWeb(
      {
        ...nodes,
      },
      this,
    );

    tronWeb.getFullnodeVersion();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    Object.defineProperty(tronWeb, 'defaultAddress', {
      get() {
        if (!self._connected) {
          self._log.warn(
            'OneKey: We recommend that DApp developers use tronLink.request({method: "tron_requestAccounts"}) to request users’ account information at the earliest time possible in order to get a complete TronWeb injection.',
          );
          void self.request({
            method: 'tron_requestAccounts',
          });
        }
        return self._defaultAddress;
      },
      set(value) {
        self._defaultAddress = value as TronWeb['defaultAddress'];
      },
    });

    return tronWeb;
  }

  private async _initialize() {
    try {
      const { accounts, nodes } = await this.request<{
        accounts: string[];
        nodes: Nodes;
      }>({
        method: 'tron_getProviderState',
      });

      const tronWeb = this._registerTronWeb(nodes);

      if (!tronWeb) return;

      if (window.tronWeb !== undefined) {
        this._log.warn(
          'OneKey: TronWeb is already initiated. Onekey will overwrite the current instance',
        );
      }

      window.tronWeb = this.tronWeb = tronWeb;
      // some DApp also check if the sunWeb object exists before requesting accounts
      window.sunWeb = {};

      this._initialized = true;

      this._handleAccountsChanged(accounts);

      this._dispatch('tronLink#initialized');
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
          this._handleNodesChanged(payload.params as Nodes);
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

      if (this._initialized) {
        this._postMessage(ProviderEvents.ACCOUNTS_CHANGED, {
          address,
        });
        this._postMessage(ProviderEvents.SET_ACCOUNT, {
          address,
        });

        const tronWeb = this.tronWeb as TronWeb;

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
  private _handleNodesChanged(nodes: Nodes) {
    if (isEmpty(nodes)) return;

    if (this.isNetworkChanged(nodes)) {
      this._nodes = nodes;

      this.tronWeb?.setFullNode(nodes.fullNode ?? nodes.fullHost);
      this.tronWeb?.setSolidityNode(nodes.solidityNode ?? nodes.fullHost);
      this.tronWeb?.setEventServer(nodes.eventServer ?? nodes.fullHost);

      this._postMessage(ProviderEvents.NODES_CHANGED, {
        ...nodes,
      });
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
    return this.request({
      method: 'tron_signTransaction',
      params: transaction,
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
