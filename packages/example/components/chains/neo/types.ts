export interface IProviderApi {
  isOneKey?: boolean;
  on(event: string, listener: (...args: any[]) => void): this;
  removeListener(event: string, listener: (...args: any[]) => void): this;
  requestAccounts(): Promise<string[]>;
  getAccounts(): Promise<string[]>;
  getNetwork(): Promise<string>;
  switchNetwork(network: string): Promise<string>;
  getProvider(): Promise<{
    name: string;
    website: string;
    version: string;
    compatibility: string[];
    extra?: object;
  }>;
  // Common Methods
  getNetworks(): Promise<{
    networks: string[];
    chainId: number;
    defaultNetwork: string;
  }>;
  getAccount(): Promise<{
    address: string;
    label?: string;
    isLedger: boolean;
  }>;
  getPublicKey(): Promise<{
    address: string;
    publicKey: string;
  }>;
  // Read Methods
  getBalance(params?: {
    params: {
      address: string;
      contracts: string[];
    }[];
  }): Promise<{
    [address: string]: {
      contract: string;
      symbol: string;
      amount: string;
    }[];
  }>;
  getStorage(params?: {
    scriptHash: string;
    key: string;
  }): Promise<{
    result: string;
  }>;
  getBlock(params: {
    blockHeight: number;
  }): Promise<any>;
  getTransaction(params: {
    txid: string;
  }): Promise<any>;
  getApplicationLog(params: {
    txid: string;
  }): Promise<any>;
  verifyMessage(params: {
    message: string;
    data: string;
    publicKey: string;
  }): Promise<{
    result: boolean;
  }>;
  verifyMessageV2(params: {
    message: string;
    data: string;
    publicKey: string;
  }): Promise<{
    result: boolean;
  }>;
  invokeRead(params: {
    scriptHash: string;
    operation: string;
    args: any[];
    signers: any[];
  }): Promise<{
    script: string;
    state: string;
    gas_consumed: string;
    stack: any[];
  }>;
  invokeReadMulti(params: {
    invokeReadArgs: {
      scriptHash: string;
      operation: string;
      args: any[];
    }[];
    signers: any[];
  }): Promise<{
    script: string;
    state: string;
    gas_consumed: string;
    stack: any[];
  }>;
  pickAddress(): Promise<{
    label: string;
    address: string;
  }>;
  AddressToScriptHash(params: {
    address: string;
  }): Promise<{
    scriptHash: string;
  }>;
  ScriptHashToAddress(params: {
    scriptHash: string;
  }): Promise<{
    address: string;
  }>;
  // Write Methods
  send(params: {
    fromAddress: string;
    toAddress: string;
    asset: string;
    amount: string;
    fee?: string;
    broadcastOverride?: boolean;
  }): Promise<{
    txid: string;
    nodeURL?: string;
    signedTx?: string;
  }>;
  invoke(params: {
    scriptHash: string;
    operation: string;
    args: any[];
    fee?: string;
    extraSystemFee?: string;
    overrideSystemFee?: string;
    broadcastOverride?: boolean;
    signers: any[];
  }): Promise<{
    txid?: string;
    nodeURL?: string;
    signedTx?: string;
  }>;
  invokeMultiple(params: {
    fee?: string;
    extraSystemFee?: string;
    overrideSystemFee?: string;
    invokeArgs?: {
      scriptHash: string;
      operation: string;
      args: any[];
    }[];
    broadcastOverride?: boolean;
    signers: any[];
  }): Promise<{
    txid?: string;
    nodeURL?: string;
    signedTx?: string;
  }>;
  signMessage(params: {
    message: string;
    isJsonObject?: boolean;
  }): Promise<{
    publicKey: string;
    data: string;
    salt: string;
    message: string;
  }>;
  signMessageV2(params: {
    message: string;
    isJsonObject?: boolean;
  }): Promise<{
    publicKey: string;
    data: string;
    salt: string;
    message: string;
  }>;
  signMessageWithoutSalt(params: {
    message: string;
    isJsonObject?: boolean;
  }): Promise<{
    publicKey: string;
    data: string;
    message: string;
  }>;
  signMessageWithoutSaltV2(params: {
    message: string;
    isJsonObject?: boolean;
  }): Promise<{
    publicKey: string;
    data: string;
    message: string;
  }>;
  signTransaction(params: {
    transaction: any;
    magicNumber?: number;
  }): Promise<{
    transaction: any;
  }>;
  switchWalletNetwork(params: {
    chainId: number;
  }): Promise<{
    result: boolean;
  }>;
  switchWalletAccount(): Promise<{
    address: string;
    label?: string;
    isLedger: boolean;
  }>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
