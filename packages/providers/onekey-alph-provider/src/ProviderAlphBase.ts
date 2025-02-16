import { IInjectedProviderNames } from '@onekeyfe/cross-inpage-provider-types';
import { ProviderBase, IInpageProviderConfig, CrossEventEmitter } from '@onekeyfe/cross-inpage-provider-core';
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

export abstract class ProviderAlphBase extends ProviderBase implements InteractiveSignerProvider {
  protected providerName = IInjectedProviderNames.alephium;
  protected bridge: IInpageProviderConfig['bridge'];
  protected onDisconnected?: () => void | Promise<void>;

  constructor(props: IInpageProviderConfig) {
    super(props);
  }

  protected bridgeRequest(data: unknown) {
    if (!this.bridge) {
      throw new Error('Bridge not initialized');
    }
    return this.bridge.request({
      data,
      scope: this.providerName,
    });
  }

  request(data: unknown) {
    return this.bridgeRequest(data);
  }

  async enable(opt?: EnableOptionsBase): Promise<Account> {
    const account = await this.unsafeEnable(opt);
    if (opt?.onDisconnected) {
      this.onDisconnected = opt.onDisconnected;
    }
    return account;
  }

  protected async _handleDisconnected(): Promise<void> {
    if (this.onDisconnected) {
      await this.onDisconnected();
    }
  }

  // Event handling is inherited from ProviderBase

  abstract get nodeProvider(): NodeProvider | undefined;
  abstract get explorerProvider(): ExplorerProvider | undefined;
  protected abstract unsafeGetSelectedAccount(): Promise<Account>;
  protected abstract unsafeEnable(opt?: EnableOptionsBase): Promise<Account>;
  abstract disconnect(): Promise<void>;
  abstract signAndSubmitTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult>;
  abstract signAndSubmitDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult>;
  abstract signAndSubmitExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult>;
  abstract signAndSubmitUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>;
  abstract signUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>;
  abstract signMessage(params: SignMessageParams): Promise<SignMessageResult>;
}
