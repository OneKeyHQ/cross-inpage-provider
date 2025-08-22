type IAccountResources = {
  freeNetUsed?: number;
  freeNetLimit?: number;
  NetUsed?: number;
  NetLimit?: number;
  EnergyUsed?: number;
  EnergyLimit?: number;
};

type ISendTrxCall = {
  parameter: {
    value: {
      amount: number;
      owner_address: string;
      to_address: string;
    };
  };
  type: 'TransferContract';
};

type ITriggerSmartContractCall = {
  parameter: {
    value: {
      data: string;
      owner_address: string;
      contract_address: string;
    };
  };
  type: 'TriggerSmartContract';
};

type IUnsignedTransaction = {
  txID: string;
  raw_data: {
    contract: Array<ISendTrxCall | ITriggerSmartContractCall>;
    ref_block_btytes: string;
    ref_block_hash: string;
    expiration: number;
    timestamp: number;
    fee_limit?: number;
  };
  raw_data_hex: string;
};

type ITransactionWithResult = IUnsignedTransaction & {
  ret: [{ contractRet?: string }];
};

type ISignedTransaction = IUnsignedTransaction & {
  signature: string[];
};

type Callback = false | ((err: Error | null, info: any) => any);

type HttpProvider = {
  new (host: string): HttpProvider;
  request(endpoint: string, payload: unknown, method = 'get'): Promise<any>;
};

declare module 'tronweb' {
  export class TronWeb {
    utils: {
      isHex: (string: string) => boolean;
      isString: (string: unknown) => boolean;
      ethersUtils: {
        toUtf8Bytes: (string: string) => Uint8Array;
      };
    };
    ready: boolean;
    constructor(options: any);

    defaultAddress: {
      hex: string | false;
      base58: string | false;
    };

    isAddress(address: string): boolean;
    request<T>(args): Promise<T>;
    getFullnodeVersion(): void;
    setPrivateKey(): any;
    setAddress(address: string): void;
    setFullNode(node: string): any;
    setSolidityNode(node: string): any;
    setEventServer(node: string): any;
    setHeader(header: any): any;

    contract: () => {
      at: (address: string) => Promise<ITokenContract>;
    };

    fullNode: {
      request: (string, any?, string?) => Promise<any> | undefined;
      configure: (node) => void;
    };
    solidityNode: {
      request: (string, any?, string?) => Promise<any>;
      configure: (node) => void;
    };

    eventServer: {
      request: (string, any?, string?) => Promise<any>;
      configure: (node) => void;
    };

    trx: {
      sign: (
        transaction: IUnsignedTransaction,
        privateKey: any,
        useTronHeader: boolean,
        callback?: Callback,
      ) => Promise<any>;
      signMessage: (
        transaction: IUnsignedTransaction,
        privateKey: any,
        useTronHeader: boolean,
        callback?: Callback,
      ) => Promise<string>;
      signMessageV2: (message: string | Uint8Array | Array<number>, privateKey?: string | false) => Promise<string>;
      getAccount: (string) => Promise<{ address: string }>;
      getAccountResources: (string) => Promise<IAccountResources>;
      getBalance: (string) => Promise<number>;
      getChainParameters: () => Promise<Array<{ key: string; value: any }>>;
      getConfirmedTransaction: (string) => Promise<ITransactionWithResult>;
      sendRawTransaction: (any) => Promise<{ code?: string; message?: string; result?: boolean }>;
      getTransaction: (string) => Promise<ITransactionWithResult>;
      getNodeInfo: (callback?: Callback) => Promise<any>;
    };

    transactionBuilder: {
      triggerSmartContract: (
        string, // contract address
        string, // function
        any, // options
        any, // parameters to call the function
        string, // from address
      ) => Promise<{
        result: { result: boolean };
        transaction: IUnsignedTransaction;
      }>;
      sendTrx: (string, number, string) => Promise<IUnsignedTransaction>;
      sendToken: (string, number, string, string) => Promise<IUnsignedTransaction>;
    };

    static isAddress: (string) => boolean;

    static address: {
      fromHex: (string) => string;
    };

    static providers: {
      HttpProvider: HttpProvider;
    };

    [index: string]: any;
  }

  export type UnsignedTransaction = IUnsignedTransaction;

  export type SignedTransaction = ISignedTransaction;

  export default TronWeb;
}
