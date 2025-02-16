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
  SignMessageResult
} from './types';

export abstract class SignerProvider {
  abstract get nodeProvider(): NodeProvider | undefined;
  abstract get explorerProvider(): ExplorerProvider | undefined;
  protected abstract unsafeGetSelectedAccount(): Promise<Account>;

  async getSelectedAccount(): Promise<Account> {
    const account = await this.unsafeGetSelectedAccount();
    SignerProvider.validateAccount(account);
    return account;
  }

  static validateAccount(account: Account): void {
    // Account validation will be implemented in utility functions
  }

  abstract signAndSubmitTransferTx(params: SignTransferTxParams): Promise<SignTransferTxResult>;
  abstract signAndSubmitDeployContractTx(params: SignDeployContractTxParams): Promise<SignDeployContractTxResult>;
  abstract signAndSubmitExecuteScriptTx(params: SignExecuteScriptTxParams): Promise<SignExecuteScriptTxResult>;
  abstract signAndSubmitUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>;
  abstract signUnsignedTx(params: SignUnsignedTxParams): Promise<SignUnsignedTxResult>;
  abstract signMessage(params: SignMessageParams): Promise<SignMessageResult>;
}

export abstract class InteractiveSignerProvider extends SignerProvider {
  protected abstract unsafeEnable(opt?: EnableOptionsBase): Promise<Account>;
  
  async enable(opt?: EnableOptionsBase): Promise<Account> {
    const account = await this.unsafeEnable(opt);
    SignerProvider.validateAccount(account);
    return account;
  }
  
  abstract disconnect(): Promise<void>;
}
