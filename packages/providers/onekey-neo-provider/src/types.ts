import type * as TypeUtils from './type-utils';
export interface IAccount {
  address: string;
}

export interface INeoGetProviderResponse {
  name: string;
  website: string;
  version: string;
  compatibility: string[]
}

export interface INeoNetworkResponse {
  networks: string[];  // Array of network names the wallet provider has available
  chainId: number;     // ChainId the wallet is currently set to
  defaultNetwork: string; // Network the wallet is currently set to
}

export interface IGetAccountResponse {
  address: string;    // Address of the connected account
  label?: string;     // A label the users has set to identify their wallet
  isLedger: boolean;  // Whether the connected account is a ledger account
}

export interface IGetPublicKeyResponse {
  address: string;    // Address of the connected account
  publicKey: string;  // Public key of the connected account
}

export interface IBalanceRequest {
  address: string;    // Address to check balance(s)
  contracts: string[]; // contracts is a list of contract hash
}

export interface IBalanceResponse {
  contract: string;   // contract of the given hash
  symbol: string;     // Symbol of the given contract
  amount: string;     // Double Value of the balance represented as a String
}

export interface IGetBalanceParams {
  params: IBalanceRequest[];  // A list of Balance Request Objects
}

export interface IGetBalanceResponse {
  [address: string]: IBalanceResponse[];  // Key is the actual address of the query
}

export interface IGetStorageParams {
  scriptHash: string;  // Script hash of the smart contract to invoke a read on
  key: string;         // Key of the storage value to retrieve from the contract
}

export interface IGetStorageResponse {
  result: string;      // The raw value that's stored in the contract
}

export interface IVerifyMessageV2Params {
  message: string;    // Salt prefix + original message
  data: string;       // Signed message
  publicKey: string;  // Public key of account that signed message
}

export interface IVerifyMessageV2Response {
  result: boolean;    // Whether the provided signature matches the provided message and public key
}

export interface ISignMessageV2Params {
  message: string;      // The message to sign
  isJsonObject?: boolean; // Whether message is a json object
}

export interface ISignMessageV2Response {
  publicKey: string;    // Public key of account that signed message
  data: string;         // Original message signed
  salt: string;         // Salt added to original message as prefix, before signing
  message: string;      // Signed message
}

export interface ISignMessageWithoutSaltV2Params {
  message: string;      // The message to sign
  isJsonObject?: boolean; // Whether message is a json object
}

export interface ISignMessageWithoutSaltV2Response {
  publicKey: string;    // Public key of account that signed message
  data: string;         // Original message signed
  message: string;      // Signed message
}

// NEO transaction type (simplified representation, can be expanded as needed)
export interface TransactionLike {
  [key: string]: any;   // Generic structure for Neo transaction
}

export interface ISignTransactionParams {
  transaction: TransactionLike; // The transaction to sign
  magicNumber?: number;         // Magic number of network found in protocol.json
}

export interface ISignTransactionResponse {
  transaction: TransactionLike; // Signed transaction
}

export interface ISwitchWalletNetworkParams {
  chainId: number;     // Switch the chainId of the network
}

export interface ISwitchWalletNetworkResponse {
  result: boolean;     // Whether the network switch was successful
}

export interface IArgument {
  type: 'String' | 'Boolean' | 'Hash160' | 'Hash256' | 'Integer' | 'ByteArray' | 'Array' | 'Address';
  value: any;
}

export interface IInvokeArguments {
  scriptHash: string;
  operation: string;
  args: IArgument[];
}

export interface ISigners {
  account: string;
  scopes: string;
  allowedContracts?: string[];
  allowedGroups?: string[];
  rules?: IWitnessRule[];
}

export interface IWitnessRule {
  action: string;
  condition: any;
}

export interface IInvokeMultipleParams {
  fee?: string;
  extraSystemFee?: string;
  overrideSystemFee?: string;
  invokeArgs?: IInvokeArguments[];
  broadcastOverride?: boolean;
  signers: ISigners[];
}

export interface IInvokeParams {
  scriptHash: string;
  operation: string;
  args: IArgument[];
  fee?: string;
  extraSystemFee?: string;
  overrideSystemFee?: string;
  broadcastOverride?: boolean;
  signers: ISigners[];
}

export interface IInvokeResponse {
  txid?: string;
  nodeURL?: string;
  signedTx?: string;
}

export interface ISendParams {
  fromAddress: string;
  toAddress: string;
  asset: string;
  amount: string;
  fee?: string;
  broadcastOverride?: boolean;
}

export interface ISendResponse {
  txid: string;
  nodeURL?: string;
  signedTx?: string;
}

export interface IInvokeReadParams {
  scriptHash: string;
  operation: string;
  args: IArgument[];
  signers: ISigners[];
}

export interface IInvokeReadResponse {
  script: string;
  state: string;
  gas_consumed: string;
  stack: IArgument[];
}

export interface IInvokeReadMultiParams {
  invokeReadArgs: {
    scriptHash: string;
    operation: string;
    args: IArgument[];
  }[]
  signers: ISigners[];
}

export interface IVerifyMessageParams {
  message: string;
  data: string;
  publicKey: string;
}

export interface IVerifyMessageResponse {
  result: boolean;
}

export interface IGetBlockParams {
  blockHeight: number;
}

export interface IGetTransactionParams {
  txid: string;
}

export interface IGetApplicationLogParams {
  txid: string;
}

export interface IPickAddressResponse {
  label: string;
  address: string;
}

export interface IAddressToScriptHashParams {
  address: string;
}

export interface IAddressToScriptHashResponse {
  scriptHash: string;
}

export interface IScriptHashToAddressParams {
  scriptHash: string;
}

export interface IScriptHashToAddressResponse {
  address: string;
}

export interface IRpcResponse {
  [key: string]: any;
}

export interface INeoProviderMethods {
  /** Common Methods */
  getNetworks(): Promise<INeoNetworkResponse>;
  getAccount(): Promise<IGetAccountResponse>;
  getPublicKey(): Promise<IGetPublicKeyResponse>;
  /** Read Methods */
  getProvider(): Promise<INeoGetProviderResponse>;
  getBalance(params?: IGetBalanceParams): Promise<IGetBalanceResponse>;
  getStorage(params?: IGetStorageParams): Promise<IGetStorageResponse>;
  getBlock(params: IGetBlockParams): Promise<IRpcResponse>;
  getTransaction(params: IGetTransactionParams): Promise<IRpcResponse>;
  getApplicationLog(params: IGetApplicationLogParams): Promise<IRpcResponse>;
  verifyMessage(params: IVerifyMessageParams): Promise<IVerifyMessageResponse>;
  verifyMessageV2(params: IVerifyMessageV2Params): Promise<IVerifyMessageV2Response>;
  invokeRead(params: IInvokeReadParams): Promise<IInvokeReadResponse>;
  invokeReadMulti(params: IInvokeReadMultiParams): Promise<IInvokeReadResponse>;
  pickAddress(): Promise<IPickAddressResponse>;
  AddressToScriptHash(params: IAddressToScriptHashParams): Promise<IAddressToScriptHashResponse>;
  ScriptHashToAddress(params: IScriptHashToAddressParams): Promise<IScriptHashToAddressResponse>;
  /** Write Methods */
  send(params: ISendParams): Promise<ISendResponse>;
  invoke(params: IInvokeParams): Promise<IInvokeResponse>;
  invokeMultiple(params: IInvokeMultipleParams): Promise<IInvokeResponse>;
  signMessage(params: ISignMessageV2Params): Promise<ISignMessageV2Response>;
  signMessageV2(params: ISignMessageV2Params): Promise<ISignMessageV2Response>;
  signMessageWithoutSalt(params: ISignMessageWithoutSaltV2Params): Promise<ISignMessageWithoutSaltV2Response>;
  signMessageWithoutSaltV2(params: ISignMessageWithoutSaltV2Params): Promise<ISignMessageWithoutSaltV2Response>;
  signTransaction(params: ISignTransactionParams): Promise<ISignTransactionResponse>;
  switchWalletNetwork(params: ISwitchWalletNetworkParams): Promise<ISwitchWalletNetworkResponse>;
  switchWalletAccount(): Promise<IGetAccountResponse>;
}

export interface NeoProviderEventsMap {
  connect: () => void;
  disconnect: () => void;
  accountChanged: () => void;
  message_low_level: (payload: { method: string; [key: string]: any }) => void;
}

export type JsBridgeRequest = {
  [K in keyof INeoProviderMethods]: (params: Parameters<INeoProviderMethods[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<INeoProviderMethods[K]>>>>
}

export type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

export type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>
