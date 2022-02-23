import depd from 'depd';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { IInpageProviderConfig } from '@onekeyfe/cross-inpage-provider-core';
import { getOrCreateExtInjectedJsBridge } from '@onekeyfe/extension-bridge-injected';
import { web3Errors } from '@onekeyfe/cross-inpage-provider-errors';
import entries from 'lodash/entries';
import isString from 'lodash/isString';
import { baseEncode, baseDecode } from 'borsh';
import { Account, Connection, utils, transactions } from 'near-api-js';
import type {
  Action as NearTransactionAction,
  Transaction as NearTransaction,
} from 'near-api-js/lib/transaction';
import type {
  AccessKeyInfoView,
  BlockResult,
  FinalExecutionOutcome,
} from 'near-api-js/lib/providers/provider';
import type { JsonRpcProvider } from 'near-api-js/lib/providers';
import { ProviderNearBase } from './ProviderNearBase';

export type NearAccountInfo = {
  accountId: string;
  publicKey: string;
  allKeys?: string[];
};

export type NearNetworkInfo = {
  networkId: string;
  nodeUrls?: string[];
};

export type NearNetworkChangedPayload = NearNetworkInfo;

export type NearProviderState = {
  accounts: Array<NearAccountInfo>;
  network: NearNetworkChangedPayload;
};

export type NearAccountsChangedPayload = {
  accounts: Array<NearAccountInfo>;
};

export type NearUnlockChangedPayload = {
  isUnlocked: boolean;
};

export type NearConnection = Connection;

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
  connection?: NearConnection | any;
  networkId?: string;
  connectEagerly?: boolean;
  enablePageReload?: boolean;
  timeout?: number;
  keyPrefix?: string;
  transactionCreator?: TransactionCreator;
} & IInpageProviderConfig;

export type OneKeyWalletAccountProps = {
  wallet: OneKeyNearProvider;
  connection: unknown;
  accountId: string;
};

export type CommonOptionsMeta = unknown | string | object;

export type SignInOptions = {
  contractId?: string;
  methodNames?: string[];
  successUrl?: string;
  failureUrl?: string;
};

export type SignInResult = NearAccountsChangedPayload;

export type SignTransactionsOptions = {
  transactions: NearTransaction[];
  callbackUrl?: string;
  meta?: CommonOptionsMeta;
  send?: boolean;
};

export type SignTransactionsResult = {
  transactionHashes: string[];
};

export type SignMessagesOptions = {
  messages: string[];
  meta?: CommonOptionsMeta;
};

export type SignMessagesResult = {
  signatures: string[];
};

export type CreateTransactionOptions = {
  receiverId: string;
  actions: NearTransactionAction[];
  nonceOffset?: number;
};

export type SignAndSendTransactionOptions = {
  receiverId: string;
  actions: NearTransactionAction[];
  meta?: CommonOptionsMeta;
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

const DEFAULT_NETWORK_INFO = {
  networkId: '',
  nodeUrls: [],
};
const PROVIDER_METHODS = {
  near_accounts: 'near_accounts',

  near_network: 'near_network',
  near_networkInfo: 'near_networkInfo',

  near_requestAccounts: 'near_requestAccounts',
  near_requestSignIn: 'near_requestSignIn',

  near_signOut: 'near_signOut',

  near_requestSignTransactions: 'near_requestSignTransactions',
  near_sendTransactions: 'near_sendTransactions',

  near_signTransactions: 'near_signTransactions',

  near_signMessages: 'near_signMessages',
  near_requestSignMessages: 'near_requestSignMessages',
};

const PROVIDER_EVENTS = {
  accountsChanged: 'accountsChanged',
  networkChanged: 'networkChanged',
  message: 'message', // alias notification
  message_low_level: 'message_low_level',
  initialized: 'near#initialized',
  // legacy events
  connect: 'connect', // alias open (bridge connect)
  disconnect: 'disconnect', // alias close (bridge disconnect)
  chainChanged: 'chainChanged', // alias networkChanged
  unlockChanged: 'unlockChanged',
} as const;

export type PROVIDER_EVENTS_STRINGS = keyof typeof PROVIDER_EVENTS;

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
    blockHash,
  );
}

type OneKeyNearProviderEventsMap = {
  [PROVIDER_EVENTS.accountsChanged]: (payload: NearAccountsChangedPayload) => void;
  [PROVIDER_EVENTS.networkChanged]: (payload: NearNetworkChangedPayload) => void;
  [PROVIDER_EVENTS.chainChanged]: (payload: NearNetworkChangedPayload) => void;
  [PROVIDER_EVENTS.message]: (payload: any) => void;
  [PROVIDER_EVENTS.message_low_level]: (payload: IJsonRpcRequest) => void;
  [PROVIDER_EVENTS.initialized]: (payload?: any) => void;
  [PROVIDER_EVENTS.connect]: (payload?: any) => void;
  [PROVIDER_EVENTS.disconnect]: (payload?: any) => void;
  [PROVIDER_EVENTS.unlockChanged]: (payload: NearUnlockChangedPayload) => void;
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare interface OneKeyNearProvider {
  on<U extends keyof OneKeyNearProviderEventsMap>(
    event: U,
    listener: OneKeyNearProviderEventsMap[U],
    context?: any,
  ): this;
  emit<U extends keyof OneKeyNearProviderEventsMap>(
    event: U,
    ...args: Parameters<OneKeyNearProviderEventsMap[U]>
  ): boolean;
}

// TODO check methods return type match official web wallet

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
class OneKeyNearProvider extends ProviderNearBase {
  _enablePageReload?: boolean = false;
  _connectEagerly?: boolean = true;
  _authData: NearAccountInfo = DEFAULT_AUTH_DATA;
  _authDataKey = '@OneKeyNearWalletAuthData';
  _account?: OneKeyWalletAccount | null;

  _connection: NearConnection;
  _networkId = '';
  _selectedNetwork: NearNetworkChangedPayload = DEFAULT_NETWORK_INFO;
  _transactionCreator: TransactionCreator;

  _isInstalled = false;
  _isInstalledDetected = false;
  _isUnlocked = false;

  // TODO package.json version (process.env.npm_package_version)

  constructor({
    connection,
    networkId,
    enablePageReload,
    connectEagerly = true,
    timeout,
    logger,
    keyPrefix = '',
    transactionCreator,
    bridge,
    shouldSendMetadata = true,
    maxEventListeners,
  }: OneKeyNearWalletProps) {
    super({
      bridge: bridge || getOrCreateExtInjectedJsBridge({ timeout }),
      logger,
      shouldSendMetadata,
      maxEventListeners,
    });
    if (!networkId) {
      // throw new Error('OneKeyNearWallet init error: networkId required.');
    }
    this._authDataKey = keyPrefix + this._authDataKey;
    this._enablePageReload = enablePageReload;
    this._connectEagerly = connectEagerly;
    this._connection = connection as NearConnection;
    this._networkId = networkId || '';
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
            accounts: providerState.accounts || [],
          },
          { emit: false },
        );
      }
      if (providerState?.network) {
        this._handleNetworkChanged(providerState.network, { emit: false });
      }
    }

    this._isInstalled = isInstalled;
    this._isInstalledDetected = true;
    if (!isInstalled && this.isSignedIn()) {
      this._handleAccountsChanged(
        {
          accounts: [],
        },
        { emit: false },
      );
    }

    if (isInstalled && !this._initializedEmitted) {
      this._initializedEmitted = true;
      window.dispatchEvent(new Event(PROVIDER_EVENTS.initialized));
      this.emit(PROVIDER_EVENTS.initialized);
      this.emit(PROVIDER_EVENTS.connect);
    }
    return isInstalled;
  }

  _registerEvents() {
    window.addEventListener('onekey_bridge_disconnect', () => {
      this._handleBridgeDisconnect();
    });
    this.on(PROVIDER_EVENTS.message_low_level, (payload) => {
      const { method, params } = payload;
      if (
        // wallet_events_accountsChanged
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
        // wallet_events_chainChanged
        isWalletEventMethodMatch({
          method,
          name: 'chainChanged',
        }) ||
        isWalletEventMethodMatch({
          method,
          name: 'networkChanged',
        })
      ) {
        this._handleNetworkChanged(params as NearNetworkChangedPayload);
      } else if (
        // wallet_events_message
        isWalletEventMethodMatch({
          method,
          name: 'message',
        })
      ) {
        this._handleMessageNotificationEvent(params);
      }
    });
  }

  _handleMessageNotificationEvent(payload: any) {
    this.emit(PROVIDER_EVENTS.message, payload);
  }

  _handleBridgeDisconnect() {
    this._handleAccountsChanged({
      accounts: [],
    });
    this._handleNetworkChanged(DEFAULT_NETWORK_INFO);
    this._isInstalled = false;
    this.emit(PROVIDER_EVENTS.disconnect);
  }

  _handleAccountsChanged(payload: NearAccountsChangedPayload, { emit = true } = {}) {
    const accounts = payload?.accounts || [];
    const account = accounts?.[0];
    const hasAccount = account && account?.accountId;
    if (hasAccount && account?.accountId !== this.getAccountId()) {
      this._saveAuthData(account);
      emit && this.emit(PROVIDER_EVENTS.accountsChanged, payload);
    } else if (!hasAccount && this.isSignedIn()) {
      this._clearAuthData();
      emit && this.emit(PROVIDER_EVENTS.accountsChanged, { accounts: [] });
    }
  }

  _handleNetworkChanged(payload: NearNetworkChangedPayload, { emit = true } = {}) {
    if (payload && payload.networkId !== this._selectedNetwork?.networkId) {
      this._selectedNetwork = payload;
      emit && this.emit(PROVIDER_EVENTS.networkChanged, payload);
      emit && this.emit(PROVIDER_EVENTS.chainChanged, payload);
    }
  }

  _handleUnlockStateChanged(payload: NearUnlockChangedPayload) {
    const isUnlocked = payload?.isUnlocked;
    if (typeof isUnlocked !== 'boolean') {
      console.error('Received invalid isUnlocked parameter. Please report this bug.');
      return;
    }
    if (isUnlocked !== this._isUnlocked) {
      this._isUnlocked = isUnlocked;
      this.emit(PROVIDER_EVENTS.unlockChanged, payload);
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
      // const error = web3Errors.provider.custom({ code, message })
      const error = web3Errors.provider.disconnected();
      throw error;
    }
    return this.bridgeRequest({
      ...payload,
      requestInfo: {
        accountId: this.getAccountId(),
        publicKey: this.getPublicKey(),
        networkId: this._networkId,
        selectedNetworkId: this.getNetworkInfo()?.networkId || '',
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

  getAccountInfo() {
    return this._authData || DEFAULT_AUTH_DATA;
  }

  getNetworkInfo() {
    return this._selectedNetwork || DEFAULT_NETWORK_INFO;
  }

  _saveAuthData(data: NearAccountInfo) {
    localStorage.setItem(this._authDataKey, JSON.stringify(data));
    this._initAuthDataFromStorage();
  }

  async requestSignIn(signInOptions: SignInOptions = {}): Promise<SignInResult> {
    let options: SignInOptions;
    if (typeof signInOptions === 'string') {
      const contractId = signInOptions;
      const deprecate = depd('requestSignIn(contractId, title)');
      deprecate(
        '`title` ignored; use `requestSignIn({ contractId, successUrl, failureUrl })` instead',
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

    const res = (await this._callBridgeRequest({
      method: PROVIDER_METHODS.near_requestSignIn,
      params: [options],
    })) as SignInResult;

    const accounts = res?.accounts || [];
    const account = accounts?.[0];

    if (account && account.accountId) {
      this._handleAccountsChanged({
        accounts: accounts.filter(Boolean),
      });

      this._reloadPage({
        url: options.successUrl || window.location.href,
        query: {
          account_id: account.accountId,
          public_key: account.publicKey,
          all_keys: account.allKeys,
        },
      });
    } else {
      this._handleAccountsChanged({
        accounts: [],
      });

      this._reloadPage({
        url: options.failureUrl || window.location.href,
        query: DEFAULT_AUTH_DATA,
      });
    }
    return res;
  }

  // TODO check if account is activated on chain, and show ApprovalPopup message
  //      DO NOT allow inactivated account approve connection
  async requestSignTransactions(
    signTransactionsOptions: SignTransactionsOptions,
  ): Promise<SignTransactionsResult> {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments;
    let options = signTransactionsOptions;
    if (Array.isArray(args[0])) {
      const deprecate = depd(
        'WalletConnection.requestSignTransactions(transactions, callbackUrl, meta)',
      );
      deprecate(
        'use `WalletConnection.requestSignTransactions(RequestSignTransactionsOptions)` instead',
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
      }),
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
    return res as SignTransactionsResult;
  }

  async requestSignMessages({
    messages = [],
    meta = {},
  }: SignMessagesOptions): Promise<SignMessagesResult> {
    const res = await this._callBridgeRequest({
      method: PROVIDER_METHODS.near_requestSignMessages,
      params: [{ messages, meta }],
    });
    return res as SignMessagesResult;
  }

  // TODO requestBatch

  async request({ method, params }: IJsonRpcRequest = { method: '', params: [] }) {
    const paramsArr = ([] as any[]).concat(params);
    const paramObj = paramsArr[0] as unknown;

    if (method === PROVIDER_METHODS.near_network) {
      method = PROVIDER_METHODS.near_networkInfo;
    }

    if (
      method === PROVIDER_METHODS.near_requestAccounts ||
      method === PROVIDER_METHODS.near_requestSignIn
    ) {
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

    if (method === PROVIDER_METHODS.near_signOut) {
      return this.signOut();
    }

    return await this._callBridgeRequest({
      method,
      params,
    });
  }

  sendJsonRpc(method: string, params: object) {
    const provider = this._connection.provider as JsonRpcProvider;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return provider.sendJsonRpc(method, params);
  }

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
    this._handleAccountsChanged({ accounts: [] });

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
  _wallet: OneKeyNearProvider;

  constructor({ wallet, connection, accountId }: OneKeyWalletAccountProps) {
    super(connection as Connection, accountId);
    this._wallet = wallet;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  async signAndSendTransaction(
    signAndSendTransactionOptions: SignAndSendTransactionOptions,
  ): Promise<FinalExecutionOutcome> {
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
      meta,
      callbackUrl,
    });
    const txHash = txHashList?.transactionHashes?.[0];
    if (txHash) {
      // near-api-js/lib/providers/json-rpc-provider.js
      //    async txStatus(txHash, accountId)
      const txHashStr = typeof txHash === 'string' ? txHash : baseEncode(txHash);
      const res = (await this._wallet.request({
        method: 'tx',
        params: [txHashStr, this.accountId],
      })) as FinalExecutionOutcome;
      return res;
    }
    throw web3Errors.rpc.internal({
      message: 'Transaction sign and send failed: transactionHash not found',
    });
  }

  async getAccessKeys(): Promise<AccessKeyInfoView[]> {
    // near-api-js/lib/account.js
    //    async getAccessKeys() { ... }
    const response = await this._wallet.request({
      method: 'query',
      params: {
        request_type: 'view_access_key_list',
        account_id: this.accountId,
        finality: 'optimistic',
      },
    });
    // A breaking API change introduced extra information into the
    // response, so it now returns an object with a `keys` field instead
    // of an array: https://github.com/nearprotocol/nearcore/pull/1789
    if (Array.isArray(response)) {
      return response as AccessKeyInfoView[];
    }
    return (response as { keys: AccessKeyInfoView[] }).keys;
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

  async createTransaction({
    receiverId,
    actions,
    nonceOffset = 1,
  }: CreateTransactionOptions): Promise<NearTransaction> {
    const _authData = this._wallet._authData;
    const publicKey = _authData.publicKey;
    const accountId = _authData.accountId;

    if (!accountId) {
      const error = web3Errors.provider.unauthorized();
      throw error;
    }

    const accessKeyInfo = await this._fetchAccountAccessKey({
      accountId,
      publicKey,
    });
    const nonce = accessKeyInfo.accessKey.nonce + nonceOffset;

    // near-api-js/lib/providers/json-rpc-provider.js
    //    async block(blockQuery) {...}
    const block = (await this._wallet.request({
      method: 'block',
      params: { block_id: undefined, finality: 'final' },
    })) as BlockResult;
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

export { OneKeyNearProvider, OneKeyWalletAccount, serializeTransaction };
