import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { AlephiumWindowObject, EnableOptions, RequestMessage } from '@alephium/get-extension-wallet';
import {
  EnableOptionsBase,
  Account,
  NodeProvider,
  ExplorerProvider,
  SignDeployContractTxParams,
  SignDeployContractTxResult,
  SignExecuteScriptTxParams,
  SignExecuteScriptTxResult,
  SignTransferTxParams,
  SignTransferTxResult,
  SignUnsignedTxParams,
  SignUnsignedTxResult,
  SignMessageParams,
  SignMessageResult,
  InteractiveSignerProvider
} from '@alephium/web3';
import { ProviderAlphBase } from './ProviderAlphBase';

const PROVIDER_EVENTS = {
  'disconnect': 'disconnect',
  'accountChanged': 'accountChanged',
  'message_low_level': 'message_low_level',
} as const;

type OneKeyTonProviderProps = IInpageProviderConfig & {
  timeout?: number;
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `wallet_events_${name}`;
}

export class ProviderAlph extends InteractiveSignerProvider implements AlephiumWindowObject {
  _base: ProviderAlphBase

  id = 'alephium';
  name = 'Alephium';
  // id = 'onekey';
  // name = 'OneKey';
  icon = 'https://uni.onekey-asset.com/static/logo/onekey.png';
  version = '0.9.4';
  _accountInfo: Account | undefined;

  onDisconnected: (() => void | Promise<void>) | undefined = undefined
  #nodeProvider: NodeProvider | undefined = undefined
  #explorerProvider: ExplorerProvider | undefined = undefined

  constructor(props: OneKeyTonProviderProps) {
    super();

    this._base = new ProviderAlphBase({
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    });

    this.version = this._base.version;
    this._registerEvents();
  }

  private bridgeRequest(data: unknown) {
    return this._base.request(data);
  }

  on(eventName: string | symbol, listener: (...args: unknown[]) => void) {
    this._base.on(eventName, listener);
  }

  off(eventName: string | symbol, listener: (...args: unknown[]) => void) {
    this._base.off(eventName, listener);
  }

  emit(eventName: string, ...args: unknown[]) {
    return this._base.emit(eventName, ...args);
  }

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleDisconnected();
    });

    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      if (!payload) return;
      const { method, params } = payload as { method: string; params: unknown };

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        this._handleAccountChange(params as Account);
      }
    });
  }

  private _handleConnected(accountInfo: Account, options: { emit: boolean } = { emit: true }) {
    this._accountInfo = accountInfo;
    if (options.emit && this._base.isConnectionStatusChanged('connected')) {
      this._base.connectionStatus = 'connected';
      const address = accountInfo.address ?? null;
      this.emit('accountChanged', address);
    }
  }

  private _handleDisconnected(options: { emit: boolean } = { emit: true }) {
    this._accountInfo = undefined;

    if (options.emit && this._base.isConnectionStatusChanged('disconnected')) {
      this._base.connectionStatus = 'disconnected';
      this.emit('accountChanged', null);
    }
  }

  private _isAccountsChanged(accountInfo: Account | undefined) {
    return accountInfo?.address !== this._accountInfo?.address;
  }

  // trigger by bridge account change event
  private _handleAccountChange(payload: Account) {
    const accountInfo = payload;
    if (this._isAccountsChanged(accountInfo)) {
      this.emit('accountChanged', accountInfo?.address || null);
    }
    if (!accountInfo) {
      this._handleDisconnected();
      return;
    }

    this._handleConnected(accountInfo, { emit: false });
  }

  async disconnect(): Promise<void> {
    await this.bridgeRequest({
      method: 'disconnect',
      params: [],
    });
    if (this.onDisconnected !== undefined) {
      await this.onDisconnected()
    }
    this.onDisconnected = undefined;
    this._handleDisconnected();
  }

  isPreauthorized(options: EnableOptions) {
    return this.bridgeRequest({
      method: 'isPreauthorized',
      params: options,
    }) as Promise<boolean>;
  }

  enableIfConnected(options: EnableOptions): Promise<Account | undefined> {
    if (options.onDisconnected) {
      this.onDisconnected = options.onDisconnected
    }
    const params: Record<string, unknown> = {};
    Object.keys(options).forEach((key) => {
      if (options[key as keyof EnableOptions] instanceof Function) {
        return;
      }
      params[key] = options[key as keyof EnableOptions];
    })
    return this.bridgeRequest({
      method: 'enableIfConnected',
      params,
    }) as Promise<Account | undefined>;
  }

  get connectedAccount(): Account | undefined {
    return this._accountInfo;
  }

  get connectedNetworkId(): "mainnet" | "testnet" | "devnet" | undefined {
    return "mainnet";
  }

  unsafeEnable(opt?: EnableOptionsBase | undefined): Promise<Account> {
    let params: Record<string, unknown> = {};
    if (opt) {
      if (opt.onDisconnected) {
        this.onDisconnected = opt.onDisconnected
      }
      params = {}
      Object.keys(opt).forEach((key) => {
        if (opt[key as keyof EnableOptionsBase] instanceof Function) {
          return;
        }
        params[key] = opt[key as keyof EnableOptionsBase];
      })
    }
    return this.bridgeRequest({ method: 'unsafeEnable', params }) as Promise<Account>;
  }

  get nodeProvider(): NodeProvider | undefined {
    if (!this.#nodeProvider) {
      this.#nodeProvider = new NodeProvider('https://node.mainnet.alephium.org');
    }
    return this.#nodeProvider;
  }

  get explorerProvider(): ExplorerProvider | undefined {
    if (!this.#explorerProvider) {
      this.#explorerProvider = new ExplorerProvider('https://backend.mainnet.alephium.org');
    }
    return this.#explorerProvider;
  }

  unsafeGetSelectedAccount(): Promise<Account> {
    return this.bridgeRequest({ method: 'unsafeGetSelectedAccount' }) as Promise<Account>;
  }

  signAndSubmitDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult> {
    return this.bridgeRequest({ method: 'signAndSubmitDeployContractTx', params: JSON.stringify(params) }) as Promise<SignDeployContractTxResult>;
  }

  signAndSubmitExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult> {
    return this.bridgeRequest({ method: 'signAndSubmitExecuteScriptTx', params: JSON.stringify(params) }) as Promise<SignExecuteScriptTxResult>;
  }

  signAndSubmitTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult> {
    return this.bridgeRequest({ method: 'signAndSubmitTransferTx', params: JSON.stringify(params) }) as Promise<SignTransferTxResult>;
  }

  signAndSubmitUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult> {
    return this.bridgeRequest({ method: 'signAndSubmitUnsignedTx', params: JSON.stringify(params) }) as Promise<SignUnsignedTxResult>;
  }

  signUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult> {
    return this.bridgeRequest({ method: 'signUnsignedTx', params: JSON.stringify(params) }) as Promise<SignUnsignedTxResult>;
  }

  signMessage(params: SignMessageParams): Promise<SignMessageResult> {
    return this.bridgeRequest({ method: 'signMessage', params: JSON.stringify(params) }) as Promise<SignMessageResult>;
  }

  request(message: RequestMessage) {
    return this.bridgeRequest({ method: 'addNewToken', params: message.params }) as Promise<boolean>;
  }
}
