import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { IInpageProviderConfig, CrossEventEmitter } from '@onekeyfe/cross-inpage-provider-core';
import {
  Account,
  EnableOptionsBase,
  NodeProvider,
  ExplorerProvider,
  SignTransferTxParams,
  SignTransferTxResult,
  SignDeployContractTxParams,
  SignDeployContractTxResult,
  SignExecuteScriptTxParams,
  SignExecuteScriptTxResult,
  SignUnsignedTxParams,
  SignUnsignedTxResult,
  SignMessageParams,
  SignMessageResult,
  InteractiveSignerProvider
} from './types';

export abstract class ProviderAlphBase extends InteractiveSignerProvider {
  protected providerName = IInjectedProviderNames.alephium;
  protected bridge: IInpageProviderConfig['bridge'];
  private emitter = new CrossEventEmitter();

  constructor(props: IInpageProviderConfig) {
    super();
    this.bridge = props.bridge;
  }

  emit(eventName: string, ...args: unknown[]): boolean {
    return this.emitter.emit(eventName, ...args);
  }

  on(eventName: string, listener: (...args: unknown[]) => void): this {
    this.emitter.on(eventName, listener);
    return this;
  }

  off(eventName: string, listener: (...args: unknown[]) => void): this {
    this.emitter.off(eventName, listener);
    return this;
  }

  protected bridgeRequest(data: unknown): Promise<unknown> {
    if (!this.bridge) {
      throw new Error('Bridge not initialized');
    }
    return this.bridge.request({
      data,
      scope: this.providerName,
    }) as Promise<unknown>;
  }

  abstract get nodeProvider(): NodeProvider | undefined;
  abstract get explorerProvider(): ExplorerProvider | undefined;
  abstract enable(opt?: EnableOptionsBase): Promise<Account>;
  abstract disconnect(): Promise<void>;
  abstract signAndSubmitTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult>;
  abstract signAndSubmitDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult>;
  abstract signAndSubmitExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult>;
  abstract signAndSubmitUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>;
  abstract signUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>;
  abstract signMessage(params: SignMessageParams): Promise<SignMessageResult>;
  protected abstract unsafeGetSelectedAccount(): Promise<Account>;
  protected abstract unsafeEnable(opt?: EnableOptionsBase): Promise<Account>;

  onDisconnected?: () => void | Promise<void>;

  protected async _handleDisconnected(): Promise<void> {
    try {
      if (this.onDisconnected) {
        await this.onDisconnected();
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }
}
