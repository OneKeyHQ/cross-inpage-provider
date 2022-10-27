import dequal from 'fast-deep-equal';
import TronWeb, { UnsignedTransaction, SignedTransaction } from 'tronweb';
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
  RequestArguments,
  requestAccountsResponse,
} from './types';
import { isWalletEventMethodMatch } from './utils';
type OneKeyConfluxProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

class ProviderTron extends ProviderTronBase implements IProviderTron {
  public readonly isTronLink = true;
  public tronWeb: TronWeb | null = null;
  public sunWeb = {};
  public ready = false;

  private _initialized = false;
  private _connected = false;
  private _requestingAccounts = false;

  private _accounts: string[] = [];

  private readonly _log: ConsoleLike;

  constructor(props: OneKeyConfluxProviderProps) {
    super({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this._log = props.logger ?? window.console;

    void this._initialize();
  }

  private _registerTronWeb(nodes: Nodes): TronWeb {
    const tronWeb = new TronWeb({
      ...nodes,
    });
    tronWeb.trx.sign = (transaction: UnsignedTransaction) => this.sign(transaction);

    tronWeb.request = (args: RequestArguments) => this.request(args);

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

      if (window.tronWeb !== undefined) {
        this._log.warn('TronWeb is already initiated. Onekey will overwrite the current instance');
      }

      window.tronWeb = this.tronWeb = tronWeb;
      window.sunWeb = {};

      this._dispatch('tronLink#initialized');
      this._initialized = true;

      this._registerEvents(tronWeb);
      this._handleAccountsChanged(accounts, tronWeb);
    } catch (error) {
      this._log.error('OneKey: Failed to get initial state. Please report this bug.', error);
    }
  }

  private _registerEvents(tronWeb: TronWeb) {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this.__handleDisconnected();
    });

    this.on(ProviderEvents.MESSAGE_LOW_LEVEL, (payload: { method: string; params: any }) => {
      const { method } = payload;

      if (isWalletEventMethodMatch(method, ProviderEvents.ACCOUNTS_CHANGED)) {
        this._handleAccountsChanged(payload.params as string[], tronWeb);
      }

      if (isWalletEventMethodMatch(method, ProviderEvents.NODES_CHANGED)) {
        this._handleNodesChanged(payload.params as Nodes, tronWeb);
      }
    });
  }

  private _handleAccountsChanged(accounts: string[], tronWeb: TronWeb) {
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

    if (!dequal(this._accounts, _accounts)) {
      this._accounts = _accounts;
      const address = _accounts[0];

      if (this._initialized) {
        this._postMessage(ProviderEvents.ACCOUNTS_CHANGED, {
          address,
        });
        this._postMessage(ProviderEvents.SET_ACCOUNT, {
          address,
        });

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

  private _handleNodesChanged(nodes: Nodes, tronWeb: TronWeb) {
    tronWeb.setFullNode(nodes.fullNode);
    tronWeb.setSolidityNode(nodes.solidityNode);
    tronWeb.setEventServer(nodes.eventServer);

    this._postMessage(ProviderEvents.NODES_CHANGED, {
      ...nodes,
    });
  }

  private async _requestAccounts(args: RequestArguments): Promise<requestAccountsResponse> {
    if (this._requestingAccounts) {
      return {
        code: 4001,
        message: 'in the request queue',
      };
    }

    this._requestingAccounts = true;

    const accounts = (await this.bridgeRequest(args)) as string[];

    this._handleAccountsChanged(accounts, this.tronWeb as TronWeb);

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
