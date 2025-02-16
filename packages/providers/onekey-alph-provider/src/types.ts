// Basic types
// Use string type to avoid BigInt conversion issues with dapps
export type Number256 = string;
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
  // Keep number type for compatibility with AlephiumWindowObject
  gasAmount: number;
  gasPrice: string;
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
  // Keep number type for compatibility with AlephiumWindowObject
  gasAmount: number;
  gasPrice: string;
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
  // Keep number type for compatibility with AlephiumWindowObject
  gasAmount: number;
  gasPrice: string;
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
  // All numeric fields use string type to avoid BigInt conversion issues
  gasAmount?: string;
  gasPrice?: string;
  attoAlphAmount?: string;
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
import {
  NodeInfo,
  NodeVersion,
  ChainParams,
  SelfClique,
  InterCliquePeerInfo,
  BrokerInfo,
  PeerMisbehavior,
  MisbehaviorAction,
  DiscoveryAction,
  HashRateResponse,
  CurrentDifficulty,
  MinerAddresses,
  ExplorerInfo
} from './api-types';

export interface NodeProvider extends NodeProviderBase {
  request(data: unknown): Promise<unknown>;
}

export interface ExplorerProvider extends ExplorerProviderBase {
  request(data: unknown): Promise<unknown>;
}

export interface NodeProviderBase {
  baseUrl: string;
  apiKey?: string;
  getNodeInfo(): Promise<NodeInfo>;
  getNodeVersion(): Promise<NodeVersion>;
  getChainParams(): Promise<ChainParams>;
  getSelfClique(): Promise<SelfClique>;
  getInterCliquePeerInfo(): Promise<InterCliquePeerInfo[]>;
  getDiscoveredNeighbors(): Promise<BrokerInfo[]>;
  getMisbehaviors(): Promise<PeerMisbehavior[]>;
  postMisbehaviors(action: MisbehaviorAction): Promise<void>;
  getUnreachable(): Promise<string[]>;
  postDiscovery(action: DiscoveryAction): Promise<void>;
  getHistoryHashrate(fromTs: string, toTs?: string): Promise<HashRateResponse>;
  getCurrentHashrate(timespan?: string): Promise<HashRateResponse>;
  getCurrentDifficulty(): Promise<CurrentDifficulty>;
  getMinerAddresses(): Promise<MinerAddresses>;
}

export interface ExplorerProviderBase {
  baseUrl: string;
  apiKey?: string;
  getExplorerInfo(): Promise<ExplorerInfo>;
}
