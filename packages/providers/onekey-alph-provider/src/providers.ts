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
    if (!account || typeof account !== 'object') {
      throw new Error('Invalid account object');
    }
    if (typeof account.address !== 'string' || !account.address) {
      throw new Error('Invalid account address');
    }
    if (typeof account.publicKey !== 'string' || !account.publicKey) {
      throw new Error('Invalid account public key');
    }
    if (typeof account.keyType !== 'string' || !['default', 'bip340-schnorr'].includes(account.keyType)) {
      throw new Error('Invalid account key type');
    }
    if (typeof account.group !== 'number' || account.group < 0) {
      throw new Error('Invalid account group');
    }
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
    if (opt?.onDisconnected) {
      this.onDisconnected = opt.onDisconnected;
    }
    return account;
  }

  onDisconnected?: () => void | Promise<void>;
  
  abstract disconnect(): Promise<void>;
  
  protected _handleDisconnected(): void {
    if (this.onDisconnected) {
      void this.onDisconnected();
    }
  }
}
