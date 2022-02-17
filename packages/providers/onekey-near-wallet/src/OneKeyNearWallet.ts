import depd from 'depd';
import { ProviderNearBase } from './ProviderNearBase';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import entries from 'lodash/entries';
import isString from 'lodash/isString';
import { baseDecode } from 'borsh';
import { Account, Connection, utils, transactions } from 'near-api-js';
import type { Action as NearTransactionAction } from 'near-api-js/lib/transaction';
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';

export type NearAccountInfo = {
  accountId: string;
  publicKey: string;
  allKeys?: string[];
};

export type NearChainChangedPayload = {
  networkId: string;
  nodeUrls?: string[];
};

export type NearProviderState = {
  accounts: Array<NearAccountInfo>;
  network: NearChainChangedPayload;
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
  connectEagerly?: boolean;
  enablePageReload?: boolean;
  keyPrefix?: string;
  transactionCreator?: TransactionCreator;
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
  near_networkInfo: 'near_networkInfo',

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
  return transactions.createTransaction(
    accountId,
    publicKeyBuffer,
    receiverId,
    nonce,
    actions,
    blockHash
  );
}

// TODO check methods return type match official web wallet

class OneKeyNearWallet extends ProviderNearBase {
  _enablePageReload?: boolean = false;
  _connectEagerly?: boolean = false;
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

  constructor({
    connection,
    keyPrefix = '',
    enablePageReload,
    connectEagerly = false,
    networkId,
    transactionCreator,
    bridge,
    logger,
    shouldSendMetadata,
    maxEventListeners,
  }: OneKeyNearWalletProps) {
    super({
      bridge: bridge || getOrCreateExtInjectedJsBridge(),
      logger,
      shouldSendMetadata,
      maxEventListeners,
    });
    if (!networkId) {
      throw new Error('OneKeyNearWallet init error: networkId required.');
    }
    this._authDataKey = keyPrefix + this._authDataKey;
    this._enablePageReload = enablePageReload;
    this._connectEagerly = connectEagerly;
    this._connection = connection as NearConnection;
    this._networkId = networkId;
    this._transactionCreator = transactionCreator || defaultTransactionCreator;
    this._initAuthDataFromStorage();
    this._registerEvents();
    void this.detectWalletInstalled().then(() => {
      this._removeCallbackUrlParams();
    });
  }

  _initializedEmitted = false;
  async detectWalletInstalled() {
    if (this._isInstalledDetected) {
      return this._isInstalled;
    }
    const walletInfo = await this.getConnectWalletInfo();
    const isInstalled = Boolean(walletInfo);

    if (isInstalled) {
      const providerState = walletInfo?.providerState as NearProviderState | null;
      if (providerState?.accounts && this._connectEagerly) {
        this._handleAccountsChanged(
          {
            accounts: providerState.accounts,
          },
          { emit: false }
        );
      }
      if (providerState?.network) {
        this._handleChainChanged(providerState.network, { emit: false });
      }
    }

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

  _handleAccountsChanged(payload: NearAccountsChangedPayload, { emit = true } = {}) {
    const accounts = payload?.accounts || [];
    const account = accounts?.[0];
    if (account && account?.accountId !== this.getAccountId()) {
      emit && this.emit('accountsChanged', payload);
      this._saveAuthData(account);
    } else if (!account && this.isSignedIn()) {
      emit && this.emit('accountsChanged', { accounts: [] });
      this._clearAuthData();
    }
  }

  _handleChainChanged(payload: NearChainChangedPayload, { emit = true } = {}) {
    if (payload && payload.networkId && payload.networkId !== this._selectedNetworkId) {
      emit && this.emit('networkChanged', payload);
      emit && this.emit('chainChanged', payload);
      this._selectedNetworkId = payload.networkId;
    }
  }

  _handleUnlockStateChanged(payload: NearUnlockChangedPayload) {
    const isUnlocked = payload?.isUnlocked;
    if (typeof isUnlocked !== 'boolean') {
      this.logger.error('Received invalid isUnlocked parameter. Please report this bug.');
      return;
    }
    if (isUnlocked !== this._isUnlocked) {
      this.emit('unlockChanged', payload);
      this._isUnlocked = isUnlocked;
    }
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

  //  similar to WalletConnection._completeSignInWithAccessKey
  _removeCallbackUrlParams() {
    try {
      if (this._enablePageReload) {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('public_key');
        currentUrl.searchParams.delete('all_keys');
        currentUrl.searchParams.delete('account_id');
        currentUrl.searchParams.delete('meta');
        currentUrl.searchParams.delete('transactionHashes');
        window.history.replaceState({}, document.title, currentUrl.toString());
      }
    } catch (err) {
      //noop
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

  _callBridgeRequest(payload: any) {
    if (!this.isInstalled()) {
      // web3Errors.provider.custom({ code, message })
      throw web3Errors.provider.disconnected();
    }
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
    let options: SignInOptions;
    if (typeof signInOptions === 'string') {
      const contractId = signInOptions;
      const deprecate = depd('requestSignIn(contractId, title)');
      deprecate(
        '`title` ignored; use `requestSignIn({ contractId, successUrl, failureUrl })` instead'
      );
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
      this._reloadPage({
        url: options.successUrl || window.location.href,
        query: {
          account_id: res.accountId,
          public_key: res.publicKey,
          all_keys: res.allKeys,
        },
      });
    } else {
      this._clearAuthData();
      this._reloadPage({
        url: options.failureUrl || window.location.href,
        query: DEFAULT_AUTH_DATA,
      });
    }
    return res;
  }

  // TODO check if account is activated on chain, and show ApprovalPopup message
  async requestSignTransactions(signTransactionsOptions: SignTransactionsOptions) {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    let options = signTransactionsOptions;
    if (Array.isArray(args[0])) {
      const deprecate = depd(
        'WalletConnection.requestSignTransactions(transactions, callbackUrl, meta)'
      );
      deprecate(
        'use `WalletConnection.requestSignTransactions(RequestSignTransactionsOptions)` instead'
      );
      options = {
        transactions: args[0] as NearTransaction[],
        callbackUrl: args[1] as string,
        meta: args[2],
      };
    }

    const {
      transactions = [],
      callbackUrl = window.location.href,
      meta = {},
      send = true,
    } = options;
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
    if (
      method === PROVIDER_METHODS.near_signMessages ||
      method === PROVIDER_METHODS.near_requestSignMessages
    ) {
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
      throw web3Errors.provider.unauthorized();
    }

    const accessKeyInfo = await this._fetchAccountAccessKey({
      accountId,
      publicKey,
    });
    const nonce = accessKeyInfo.accessKey.nonce + nonceOffset;

    const block = await this.connection.provider.block({ finality: 'final' });
    const blockHash = baseDecode(block.header.hash);

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
