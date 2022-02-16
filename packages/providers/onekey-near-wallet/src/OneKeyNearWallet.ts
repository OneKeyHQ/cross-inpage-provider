import depd from 'depd';
import { ProviderNearBase } from './ProviderNearBase';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import entries from 'lodash/entries';
import isString from 'lodash/isString';
import { baseDecode } from 'borsh';
import { Account, Connection, utils, transactions } from 'near-api-js';
import type { Action as NearTransactionAction } from 'near-api-js/lib/transaction';
import {
  IInpageProviderConfig,
  injectedProviderReceiveHandler,
  injectJsBridge,
} from '@onekeyfe/cross-inpage-provider-core';
import { JsBridgeExtInjected } from '@onekeyfe/extension-bridge-injected';

export type NearAccountInfo = {
  accountId: string;
  publicKey: string;
  allKeys?: string[];
};

export type NearChainChangedPayload = {
  networkId: string;
  nodeUrls?: string[];
};

export type NearAccountsChangedPayload = {
  accounts: Array<NearAccountInfo>;
};

export type NearUnlockChangedPayload = {
  isUnlocked: boolean;
};
export type NearBlockInfoHeader = {
  hash: string;
};
export type NearBlockInfo = {
  header: NearBlockInfoHeader;
};
export type NearConnectionProvider = {
  sendJsonRpc: (method: string, params: object) => Promise<any>;
  block: (params: object) => Promise<NearBlockInfo>;
  query: (...args: any) => Promise<any>;
};
export type NearConnection = {
  provider: NearConnectionProvider;
};

export type TransactionCreatorParams = {
  accountId: string;
  publicKey: string;
  receiverId: string;
  nonce: number;
  actions: NearTransactionAction[];
  blockHash: Buffer;
};
export type TransactionCreator = (params: TransactionCreatorParams) => any;

export type OneKeyNearWalletProps = {
  connection: NearConnection | any;
  networkId: string;
  transactionCreator: TransactionCreator;
  keyPrefix?: string;
  enablePageReload?: boolean;
} & IInpageProviderConfig;

export type OneKeyWalletAccountProps = {
  wallet: OneKeyNearWallet;
  connection: unknown;
  accountId: string;
};

export type SignInOptions = {
  contractId?: string;
  methodNames?: string[];
  successUrl?: string;
  failureUrl?: string;
};

export type NearTransaction = {
  encode: () => Uint8Array;
};

export type NearAccountAccessKey = {
  nonce: number;
};
export type NearAccountAccessKeyInfo = {
  public_key: string;
  access_key: NearAccountAccessKey;
};

export type SignTransactionsOptions = {
  transactions: NearTransaction[];
  callbackUrl?: string;
  meta?: unknown | string;
  send?: boolean;
};

export type SignMessagesOptions = {
  messages: string[];
  meta?: unknown | string | object;
};

export type CreateTransactionOptions = {
  receiverId: string;
  actions: NearTransactionAction[];
  nonceOffset?: number;
};

export type SignAndSendTransactionOptions = {
  receiverId: string;
  actions: NearTransactionAction[];
  meta?: object;
  callbackUrl?: string;
};

function serializeTransaction({ transaction }: { transaction: NearTransaction }) {
  if (isString(transaction)) {
    return transaction;
  }
  const message = transaction.encode();
  return Buffer.from(message).toString('base64');
}

const DEFAULT_AUTH_DATA = {
  accountId: '',
  publicKey: '', // ed25519:****
  allKeys: [],
};

const PROVIDER_METHODS = {
  near_accounts: 'near_accounts',
  near_networkId: 'near_networkId',

  near_requestSignIn: 'near_requestSignIn',
  near_signOut: 'near_signOut',

  near_requestSignTransactions: 'near_requestSignTransactions',
  near_sendTransactions: 'near_sendTransactions',

  near_signTransactions: 'near_signTransactions',

  near_requestSignMessages: 'near_requestSignMessages',
  near_signMessages: 'near_signMessages',
};

function isWalletEventMethodMatch({ method, name }: { method: string; name: string }) {
  return method === `metamask_${name}` || method === `wallet_events_${name}`;
}

function defaultTransactionCreator({
  accountId,
  publicKey,
  receiverId,
  nonce,
  actions,
  blockHash,
}: TransactionCreatorParams) {
  const publicKeyBuffer = utils.PublicKey.fromString(publicKey);
  return transactions.createTransaction(accountId, publicKeyBuffer, receiverId, nonce, actions, blockHash);
}

// TODO move to JsBridgeExtInjected
function getOrCreateExtInjectedJsBridge() {
  // create ext bridge by default
  const bridgeCreator = () =>
    new JsBridgeExtInjected({
      receiveHandler: injectedProviderReceiveHandler,
    }) as unknown;
  const bridge = injectJsBridge(bridgeCreator);
  return bridge;
}

// TODO import { ethErrors } from 'eth-rpc-errors';
// TODO check methods return type match web wallet

// TODO console.log remove

class OneKeyNearWallet extends ProviderNearBase {
  _enablePageReload?: boolean = false;
  _authData: NearAccountInfo = DEFAULT_AUTH_DATA;
  _authDataKey = '@OneKeyNearWalletAuthData';
  _account?: OneKeyWalletAccount | null;

  _connection: NearConnection;
  _networkId = '';
  _selectedNetworkId = '';
  _transactionCreator: TransactionCreator;

  _isInstalled = false;
  _isInstalledDetected = false;
  _isUnlocked = false;

  // TODO connectEager
  constructor({
    connection,
    keyPrefix = '',
    enablePageReload,
    networkId,
    transactionCreator,
    bridge,
    logger,
    shouldSendMetadata,
    maxEventListeners,
  }: OneKeyNearWalletProps) {
    // TODO props: logger, shouldSendMetadata
    super({
      bridge: bridge || getOrCreateExtInjectedJsBridge(),
    });
    if (!networkId) {
      throw new Error('OneKeyNearWallet init error: networkId is required.');
    }
    this._authDataKey = keyPrefix + this._authDataKey;
    this._enablePageReload = enablePageReload;
    this._connection = connection as NearConnection;
    this._networkId = networkId;
    this._selectedNetworkId = networkId;
    // TODO remove transactionCreator in ref-ui
    this._transactionCreator = transactionCreator || defaultTransactionCreator;
    this._initAuthDataFromStorage();
    this._registerEvents();
    void this.detectWalletInstalled().then((installed) => {
      if (installed) {
        // TODO metamask_sendDomainMetadata
        void this.request({ method: PROVIDER_METHODS.near_accounts, params: [] });
        void this.request({ method: PROVIDER_METHODS.near_networkId, params: [] });
      }
    });
  }

  _initializedEmitted = false;
  async detectWalletInstalled() {
    if (this._isInstalledDetected) {
      return this._isInstalled;
    }
    const isInstalled = await this._isBridgeConnected();
    if (isInstalled && !this._initializedEmitted) {
      this._initializedEmitted = true;
      this.emit('near#initialized');
      window.dispatchEvent(new Event('near#initialized'));
    }
    this._isInstalled = isInstalled;
    this._isInstalledDetected = true;
    if (!isInstalled && this.isSignedIn()) {
      this._clearAuthData();
    }
    return isInstalled;
  }

  _registerEvents() {
    this.events.on('notification', (payload: IJsonRpcRequest) => {
      const { method, params } = payload;
      if (
        isWalletEventMethodMatch({
          method,
          name: 'accountsChanged',
        })
      ) {
        this._handleAccountsChanged(params as NearAccountsChangedPayload);
      } else if (
        isWalletEventMethodMatch({
          method,
          name: 'unlockStateChanged',
        })
      ) {
        this._handleUnlockStateChanged(params as NearUnlockChangedPayload);
      } else if (
        isWalletEventMethodMatch({
          method,
          name: 'chainChanged',
        }) ||
        isWalletEventMethodMatch({
          method,
          name: 'networkChanged',
        })
      ) {
        this._handleChainChanged(params as NearChainChangedPayload);
      } else if (
        isWalletEventMethodMatch({
          method,
          name: 'messageNotification',
        })
      ) {
        this._handleMessageNotificationEvent(params);
      }
    });
  }

  _handleMessageNotificationEvent(payload: any) {
    this.emit('message', payload);
  }

  _handleAccountsChanged(payload: NearAccountsChangedPayload) {
    const accounts = payload?.accounts || [];
    const account = accounts?.[0];
    if (account && account?.accountId !== this.getAccountId()) {
      this.emit('accountsChanged', payload);
      this._saveAuthData(account);
    } else if (!account && this.isSignedIn()) {
      this.emit('accountsChanged', { accounts: [] });
      this._clearAuthData();
    }
  }

  _handleChainChanged(payload: NearChainChangedPayload) {
    if (payload && payload.networkId && payload.networkId !== this._selectedNetworkId) {
      this.emit('networkChanged', payload);
      this.emit('chainChanged', payload);
      this._selectedNetworkId = payload.networkId;
    }
  }

  _handleUnlockStateChanged(payload: NearUnlockChangedPayload) {
    const isUnlocked = payload?.isUnlocked;
    if (typeof isUnlocked !== 'boolean') {
      console.error('Received invalid isUnlocked parameter. Please report this bug.');
      return;
    }
    if (isUnlocked !== this._isUnlocked) {
      this.emit('unlockChanged', payload);
      this._isUnlocked = isUnlocked;
    }
  }

  // TODO move to base class, add timeout, manifest v3 check
  //      in html head script init test
  async _isBridgeConnected({ timeout = 3000 } = {}): Promise<boolean> {
    // eslint-disable-next-line no-async-promise-executor,@typescript-eslint/no-misused-promises
    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, timeout);
      try {
        const result = (await this._callBridgeRequest({
          method: 'ping',
          params: [{ time: Date.now() }],
        })) as {
          pong?: boolean;
        };
        if (result && result['pong']) {
          resolve(true);
        }
        resolve(false);
      } catch (err) {
        resolve(false);
      } finally {
        clearTimeout(timer);
      }
    });
  }

  _initAuthDataFromStorage() {
    try {
      const data = localStorage.getItem(this._authDataKey);
      const authData = (data ? JSON.parse(data) : null) as NearAccountInfo;
      if (authData) {
        this._authData = authData;
      } else {
        this._authData = DEFAULT_AUTH_DATA;
      }
    } catch (e) {
      this._authData = DEFAULT_AUTH_DATA;
    }
  }

  _reloadPage({ url, query = {} }: { url?: string; query?: Record<string, any> | unknown } = {}) {
    if (this._enablePageReload) {
      if (url) {
        const urlObj = new URL(url);
        entries(query as object).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v = v.join(',');
          }
          urlObj.searchParams.set(k, v as string);
        });
        window.location.assign(urlObj.toString());
      } else {
        window.location.reload();
      }
    }
  }

  // TODO isInstalled check and throw custom error
  //      import { ethErrors } from 'eth-rpc-errors';
  //      ethErrors.provider.custom({ code, message })
  _callBridgeRequest(payload: any) {
    // TODO rename to _bridgeRequest
    return this.bridgeRequest({
      ...payload,
      requestInfo: {
        accountId: this.getAccountId(),
        publicKey: this.getPublicKey(),
        networkId: this.getNetworkId(),
        selectedNetworkId: this.getSelectedNetworkId(),
      },
    });
  }

  isInstalled() {
    return this._isInstalled;
  }

  isUnlocked() {
    return this._isUnlocked;
  }

  isSignedIn() {
    return !!this.getAccountId();
  }

  getAccountId() {
    return this._authData?.accountId || '';
  }

  getPublicKey() {
    return this._authData?.publicKey || '';
  }

  getNetworkId() {
    return this._networkId;
  }

  getSelectedNetworkId() {
    return this._selectedNetworkId;
  }

  _saveAuthData(data: NearAccountInfo) {
    localStorage.setItem(this._authDataKey, JSON.stringify(data));
    this._initAuthDataFromStorage();
  }

  async requestSignIn(signInOptions: SignInOptions) {
    let options;
    if (typeof signInOptions === 'string') {
      const contractId = signInOptions;
      const deprecate = depd('requestSignIn(contractId, title)');
      deprecate('`title` ignored; use `requestSignIn({ contractId, successUrl, failureUrl })` instead');
      // eslint-disable-next-line prefer-rest-params
      const successUrl = arguments[2] as string;
      // eslint-disable-next-line prefer-rest-params
      const failureUrl = arguments[3] as string;
      options = {
        contractId,
        methodNames: [],
        successUrl,
        failureUrl,
      };
    } else {
      options = signInOptions;
    }

    /*
      { accountId, allKeys: [], publicKey }
     */
    const res = (await this._callBridgeRequest({
      method: PROVIDER_METHODS.near_requestSignIn,
    })) as NearAccountInfo;

    this._handleAccountsChanged({
      accounts: [res],
    });

    if (res && res.accountId) {
      this._saveAuthData(res);
      // TODO successUrl, failureUrl callback
      this._reloadPage();
    }
    console.log('requestSignIn', options);
    return res;
  }

  // TODO check if account is activated, and show ApprovalPopup message
  async requestSignTransactions(signTransactionsOptions: SignTransactionsOptions) {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    let options = signTransactionsOptions;
    if (Array.isArray(args[0])) {
      const deprecate = depd('WalletConnection.requestSignTransactions(transactions, callbackUrl, meta)');
      deprecate('use `WalletConnection.requestSignTransactions(RequestSignTransactionsOptions)` instead');
      options = {
        transactions: args[0] as NearTransaction[],
        callbackUrl: args[1] as string,
        meta: args[2],
      };
    }

    console.log('requestSignTransactions', options);
    const { transactions = [], callbackUrl = window.location.href, meta = {}, send = true } = options;
    const txSerialized = transactions.map((tx) =>
      serializeTransaction({
        transaction: tx,
      })
    );
    // sign and send
    const res = await this._callBridgeRequest({
      method: PROVIDER_METHODS.near_requestSignTransactions,
      params: [{ transactions: txSerialized, meta, send }],
    });
    console.log('requestSignTransactions', options);
    this._reloadPage({
      url: callbackUrl,
      query: res,
    });
    return res;
  }

  async requestSignMessages({ messages = [], meta = {} }: SignMessagesOptions) {
    const res = await this._callBridgeRequest({
      method: PROVIDER_METHODS.near_requestSignMessages,
      params: [{ messages, meta }],
    });
    return res;
  }

  // TODO requestBatch

  async request({ method, params }: IJsonRpcRequest = { method: '', params: [] }) {
    const paramsArr = ([] as any[]).concat(params);
    const paramObj = paramsArr[0] as unknown;

    if (method === PROVIDER_METHODS.near_requestSignIn) {
      return this.requestSignIn(paramObj as SignInOptions);
    }
    if (
      method === PROVIDER_METHODS.near_sendTransactions ||
      method === PROVIDER_METHODS.near_requestSignTransactions ||
      method === PROVIDER_METHODS.near_signTransactions // sign only, do not send
    ) {
      const options = paramObj as SignTransactionsOptions;
      const optionsNew = { ...options };
      optionsNew.send = method !== PROVIDER_METHODS.near_signTransactions;
      return this.requestSignTransactions(optionsNew);
    }
    if (method === PROVIDER_METHODS.near_signMessages || method === PROVIDER_METHODS.near_requestSignMessages) {
      return this.requestSignMessages(paramObj as SignMessagesOptions);
    }

    return await this._callBridgeRequest({
      method,
      params,
    });
  }

  sendJsonRpc(method: string, params: object) {
    const provider = this._connection.provider;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return provider.sendJsonRpc(method, params);
  }

  // SpecialWallet required
  createTransaction({ receiverId, actions, nonceOffset = 1 }: CreateTransactionOptions) {
    return this.account().createTransaction({
      receiverId,
      actions,
      nonceOffset,
    });
  }

  _clearAuthData() {
    localStorage.setItem(this._authDataKey, '');
    this._account = null;
    this._initAuthDataFromStorage();
  }

  signOut() {
    void this._callBridgeRequest({
      method: PROVIDER_METHODS.near_signOut,
      params: this._authData,
    });
    this._clearAuthData();

    // signOut() in near web wallet does not reload page
    // this._reloadPage();
  }

  account() {
    const accountId = this.getAccountId();
    if (!this._account || this._account.accountId !== accountId) {
      this._account = new OneKeyWalletAccount({
        wallet: this,
        connection: this._connection,
        accountId,
      });
    }
    return this._account;
  }
}

class OneKeyWalletAccount extends Account {
  _wallet: OneKeyNearWallet;

  constructor({ wallet, connection, accountId }: OneKeyWalletAccountProps) {
    super(connection as Connection, accountId);
    this._wallet = wallet;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  async signAndSendTransaction(signAndSendTransactionOptions: SignAndSendTransactionOptions) {
    let options = signAndSendTransactionOptions;
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    if (typeof args[0] === 'string') {
      options = {
        receiverId: args[0],
        actions: args[1] as NearTransactionAction[],
      };
    }

    const { receiverId, actions, meta, callbackUrl } = options;

    const transaction = await this.createTransaction({
      receiverId,
      actions,
    });

    const txHashList = await this._wallet.requestSignTransactions({
      transactions: [transaction],
      meta: {
        ...meta,
      },
      callbackUrl,
    });
    // TODO return typeof this.connection.provider.sendTransaction
    // same type to pending tx polling result
    return txHashList;
  }

  async _fetchAccountAccessKey({ publicKey, accountId }: { publicKey: string; accountId: string }) {
    const keys = await this.getAccessKeys();
    const keyInfo = keys.find((item) => item.public_key === publicKey);
    if (keyInfo && keyInfo.access_key) {
      const accessKey = keyInfo.access_key;
      return {
        accessKey,
        publicKey,
        accountId,
      };
    }
    throw new Error(`near account access key not found for: ${accountId}`);
  }

  async createTransaction({ receiverId, actions, nonceOffset = 1 }: CreateTransactionOptions) {
    const _authData = this._wallet._authData;
    const publicKey = _authData.publicKey;
    const accountId = _authData.accountId;

    if (!accountId) {
      throw new Error('createTransaction failed: accountId is empty.');
    }

    const accessKeyInfo = await this._fetchAccountAccessKey({
      accountId,
      publicKey,
    });
    const nonce = accessKeyInfo.accessKey.nonce + nonceOffset;

    const block = await this.connection.provider.block({ finality: 'final' });
    const blockHash = baseDecode(block.header.hash);

    // TODO nonce invalid retry
    const transaction = this._wallet._transactionCreator({
      accountId,
      publicKey,
      receiverId,
      nonce,
      actions,
      blockHash,
    }) as NearTransaction;
    return transaction;
  }
}

export { OneKeyNearWallet, OneKeyWalletAccount, serializeTransaction };
