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

declare module 'tronweb' {
  export class TronWeb {
    ready: boolean;
    constructor(e: any);

    defaultAddress: {
      hex: string | false;
      base58: string | false;
    };

    isAddress: (address: string) => boolean;
    setAddress: (address: string) => void;
    setFullNode: (node: string) => void;
    setSolidityNode: (node: string) => void;
    setEventServer: (node: string) => void;
    request: <T>(args) => Promise<T>;

    contract: () => {
      at: (address: string) => Promise<ITokenContract>;
    };

    fullNode: {
      request: (string, any?, string?) => Promise<any>;
    };

    trx: {
      sign: (
        transaction: IUnsignedTransaction,
        privateKey: any,
        useTronHeader: boolean,
        callback?: any,
      ) => Promise<any>;
      getAccount: (string) => Promise<{ address: string }>;
      getAccountResources: (string) => Promise<IAccountResources>;
      getBalance: (string) => Promise<number>;
      getChainParameters: () => Promise<Array<{ key: string; value: any }>>;
      getConfirmedTransaction: (string) => Promise<ITransactionWithResult>;
      sendRawTransaction: (any) => Promise<{ code?: string; message?: string; result?: boolean }>;
      getTransaction: (string) => Promise<ITransactionWithResult>;
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
  }

  export type UnsignedTransaction = IUnsignedTransaction;

  export type SignedTransaction = ISignedTransaction;

  export default TronWeb;
}
