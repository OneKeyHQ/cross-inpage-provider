// Basic types
export type Number256 = string | bigint;
export type Address = string;
export type KeyType = 'default' | 'bip340-schnorr';
export type NetworkId = 'mainnet' | 'testnet' | 'devnet';

// Token related
export interface Token {
  id: string;
  amount: Number256;
}

// Account related
export interface Account {
  keyType: KeyType;
  address: string;
  group: number;
  publicKey: string;
}

// Transaction params and results
export interface SignerAddress {
  signerAddress: string;
  signerKeyType?: KeyType;
}

export interface OutputRef {
  hint: number;
  key: string;
}

export interface Destination {
  address: string;
  attoAlphAmount: Number256;
  tokens?: Token[];
  lockTime?: number;
  message?: string;
}

export interface SignTransferTxParams extends SignerAddress {
  destinations: Destination[];
  utxos?: OutputRef[];
  gasAmount?: number;
  gasPrice?: Number256;
}

export interface SignTransferTxResult {
  fromGroup: number;
  toGroup: number;
  unsignedTx: string;
  txId: string;
  signature: string;
  gasAmount: number;
  gasPrice: Number256;
}

export interface SignDeployContractTxParams extends SignerAddress {
  bytecode: string;
  initialAttoAlphAmount?: Number256;
  initialTokenAmounts?: Token[];
  issueTokenAmount?: Number256;
  issueTokenTo?: string;
  gasAmount?: number;
  gasPrice?: Number256;
}

export interface SignDeployContractTxResult {
  groupIndex: number;
  unsignedTx: string;
  txId: string;
  signature: string;
  contractId: string;
  contractAddress: string;
  gasAmount: number;
  gasPrice: Number256;
}

export interface SignExecuteScriptTxParams extends SignerAddress {
  bytecode: string;
  attoAlphAmount?: Number256;
  tokens?: Token[];
  gasAmount?: number;
  gasPrice?: Number256;
  gasEstimationMultiplier?: number;
}

export interface SignExecuteScriptTxResult {
  groupIndex: number;
  unsignedTx: string;
  txId: string;
  signature: string;
  gasAmount: number;
  gasPrice: Number256;
  simulatedOutputs: Output[];
}

export interface SignUnsignedTxParams extends SignerAddress {
  unsignedTx: string;
}

export interface SignUnsignedTxResult {
  fromGroup: number;
  toGroup: number;
  unsignedTx: string;
  txId: string;
  signature: string;
  gasAmount: number;
  gasPrice: Number256;
}

export type MessageHasher =
  | 'alephium' // Message is prefixed with 'Alephium signed message: ' before hashed with blake2b
  | 'sha256'
  | 'blake2b'
  | 'identity'; // No hash is used, the message to be 32 bytes

export interface SignMessageParams extends SignerAddress {
  message: string;
  messageHasher: MessageHasher;
}

export interface SignMessageResult {
  signature: string;
}

export interface SubmitTransactionParams {
  unsignedTx: string;
  signature: string;
}

export interface SubmissionResult {
  txId: string;
  fromGroup: number;
  toGroup: number;
}

export interface EnableOptionsBase {
  addressGroup?: number;
  keyType?: KeyType;
  networkId?: NetworkId;
  onDisconnected: () => Promise<void> | void;
}

// Output types
export interface Output {
  hint: number;
  key: string;
  attoAlphAmount: string;
  address: string;
  tokens: Token[];
  lockTime?: number;
  message?: string;
  type: string;
}

// Provider base classes (will be moved to separate files later)
export abstract class SignerProvider {
  abstract get nodeProvider(): NodeProvider | undefined;
  abstract get explorerProvider(): ExplorerProvider | undefined;
  protected abstract unsafeGetSelectedAccount(): Promise<Account>;
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
    return account;
  }
  abstract disconnect(): Promise<void>;
}

// Provider interfaces (will be implemented in api-providers.ts)
export interface NodeProvider {
  request(args: any): Promise<any>;
}

export interface ExplorerProvider {
  request(args: any): Promise<any>;
}
