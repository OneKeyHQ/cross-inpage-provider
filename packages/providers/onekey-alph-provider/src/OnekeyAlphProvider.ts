import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { EnableOptions, RequestMessage } from '@alephium/get-extension-wallet';
import {
  EnableOptionsBase,
  Account,
  SignDeployContractTxParams,
  SignDeployContractTxResult,
  SignExecuteScriptTxParams,
  SignExecuteScriptTxResult,
  SignTransferTxParams,
  SignTransferTxResult,
  SignUnsignedTxParams,
  SignUnsignedTxResult,
  SignMessageParams,
  SignMessageResult
} from './types';
import { ProviderAlphBase } from './ProviderAlphBase';
import { NodeProvider as NodeProviderImpl, ExplorerProvider as ExplorerProviderImpl } from './api-providers';

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

export class ProviderAlph extends ProviderAlphBase {
  public connectionStatus: 'connected' | 'disconnected' = 'disconnected';
  private _id = 'alephium';
  private _name = 'Alephium';
  private _icon = 'https://uni.onekey-asset.com/static/logo/onekey.png';
  private _version = '0.9.4';

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get icon(): string {
    return this._icon;
  }

  get version(): string {
    return this._version;
  }

  public isConnectionStatusChanged(status: 'connected' | 'disconnected'): boolean {
    return this.connectionStatus !== status;
  }

  public async enable(opt?: EnableOptionsBase): Promise<Account> {
    const response = await this.bridgeRequest({
      method: 'enable',
      params: {
        id: this.id,
        networkId: 'mainnet',
        symbol: 'ALPH',
        decimals: 18,
        name: this.name,
        type: 'alph'
      }
    } as unknown as RequestMessage);
    if (opt?.onDisconnected) {
      this.onDisconnected = opt.onDisconnected;
    }
    return response  as Account;
  }

  protected async unsafeEnable(opt?: EnableOptionsBase): Promise<Account> {
    const response = await this.bridgeRequest({
      method: 'unsafeEnable',
      params: opt
    });
    if (opt?.onDisconnected) {
      this.onDisconnected = opt.onDisconnected;
    }
    return response as Account;
  }

  emit(eventName: string, ...args: unknown[]): boolean {
    return super.emit(eventName, ...args);
  }

  on(eventName: string, listener: (...args: unknown[]) => void): this {
    return super.on(eventName, listener);
  }

  off(eventName: string, listener: (...args: unknown[]) => void): this {
    return super.off(eventName, listener);
  }
  // Properties moved to private fields with getters
  _accountInfo: Account | undefined;

  private _nodeProvider: NodeProviderImpl | undefined = undefined;
  private _explorerProvider: ExplorerProviderImpl | undefined = undefined;

  get nodeProvider(): NodeProviderImpl | undefined {
    if (!this._nodeProvider) {
      this._nodeProvider = new NodeProviderImpl('https://node.mainnet.alephium.org');
    }
    return this._nodeProvider;
  }

  get explorerProvider(): ExplorerProviderImpl | undefined {
    if (!this._explorerProvider) {
      this._explorerProvider = new ExplorerProviderImpl('https://backend.mainnet.alephium.org');
    }
    return this._explorerProvider;
  }

  isPreauthorized = (options: EnableOptions): Promise<boolean> => {
    return this.bridgeRequest({
      method: 'isPreauthorized',
      params: options,
    }) as Promise<boolean>;
  };

  enableIfConnected = (options: EnableOptions): Promise<Account | undefined> => {
    if (options.onDisconnected) {
      this.onDisconnected = options.onDisconnected;
    }
    const params: Record<string, unknown> = {};
    Object.keys(options).forEach((key) => {
      if (options[key as keyof EnableOptions] instanceof Function) {
        return;
      }
      params[key] = options[key as keyof EnableOptions];
    });
    return this.bridgeRequest({
      method: 'enableIfConnected',
      params,
    }) as Promise<Account | undefined>;
  };

  // Using bridgeRequest from base class

  constructor(props: OneKeyTonProviderProps) {
    const config = {
      ...props,
      bridge: props.bridge || getOrCreateExtInjectedJsBridge({ timeout: props.timeout }),
    };
    super(config);
    this._registerEvents();
  }

  // Removed duplicate bridgeRequest implementation

  // Event handling is inherited from ProviderBase

  private _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      // Use void to explicitly mark floating promise
      void this._handleDisconnectedEvent().catch(error => {
        console.error('Disconnect event error:', error);
      });
    });

    this.on(PROVIDER_EVENTS.message_low_level, (...args: unknown[]) => {
      const [payload] = args as [{ method: string; params: unknown }];
      if (!payload) return;
      const { method, params } = payload as { method: string; params: unknown };

      if (isWalletEventMethodMatch({ method, name: PROVIDER_EVENTS.accountChanged })) {
        // Use void to explicitly mark floating promise
        void this._handleAccountChange(params as Account).catch(error => {
          console.error('Account change event error:', error);
        });
      }
    });
  }

  private async _handleConnected(accountInfo: Account, options: { emit: boolean } = { emit: true }) {
    try {
      // Validate account info
      if (!accountInfo || typeof accountInfo.address !== 'string') {
        throw new Error('Invalid account info');
      }

      // Ensure async context for state updates
      await Promise.resolve();

      this._accountInfo = accountInfo;
      if (options.emit && this.isConnectionStatusChanged('connected')) {
        this.connectionStatus = 'connected';
        const address = accountInfo.address ?? null;
        this.emit('accountChanged', address);
        // Wait for event emission to complete
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  private async _handleDisconnectedEvent(options: { emit: boolean } = { emit: true }) {
    try {
      this._accountInfo = undefined;

      if (options.emit && this.isConnectionStatusChanged('disconnected')) {
        this.connectionStatus = 'disconnected';
        this.emit('accountChanged', null);
      }
      await this._handleDisconnected();
    } catch (error) {
      console.error('Disconnect event error:', error);
      throw error;
    }
  }

  private _isAccountsChanged(accountInfo: Account | undefined) {
    return accountInfo?.address !== this._accountInfo?.address;
  }

  // trigger by bridge account change event
  private async _handleAccountChange(payload: Account) {
    try {
      const accountInfo = payload;
      if (this._isAccountsChanged(accountInfo)) {
        this.emit('accountChanged', accountInfo?.address || null);
      }
      if (!accountInfo) {
        await this._handleDisconnected();
        return;
      }

      await this._handleConnected(accountInfo, { emit: false });
    } catch (error) {
      console.error('Account change error:', error);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.bridgeRequest({
        method: 'disconnect',
        params: [],
      });
      await this._handleDisconnected();
      await this._handleDisconnectedEvent();
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  get connectedAccount(): Account | undefined {
    return this._accountInfo;
  }

  get connectedNetworkId(): "mainnet" | "testnet" | "devnet" | undefined {
    return "mainnet";
  }

  // All required abstract methods are implemented

  getSelectedAccount(): Promise<Account> {
    return this.unsafeGetSelectedAccount();
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


}
