/* eslint-disable @typescript-eslint/restrict-plus-operands */
import {
  OneKeyNearProvider,
  NearAccountsChangedPayload,
  NearNetworkChangedPayload,
  TransactionCreatorParams,
  SignMessagesResult,
  SignInResult,
  SignTransactionsResult,
} from '@onekeyfe/onekey-near-provider';
import { useCallback, useEffect, useState } from 'react';
import * as NearApi from 'near-api-js';
import { random } from 'lodash';

const hasWindow = typeof window !== 'undefined';

function defaultTransactionCreator({
  accountId,
  publicKey,
  receiverId,
  nonce,
  actions,
  blockHash,
}: TransactionCreatorParams) {
  const publicKeyBuffer = NearApi.utils.PublicKey.fromString(publicKey);
  return NearApi.transactions.createTransaction(
    accountId,
    publicKeyBuffer,
    receiverId,
    nonce,
    actions,
    blockHash,
  );
}

export default function NearExample() {
  const [provider, setProvider] = useState<OneKeyNearProvider | null>(null);
  const [accountId, setAccountId] = useState('');
  const [networkId, setNetworkId] = useState('');

  const createSampleBatchTransactions = useCallback(async () => {
    if (!provider) {
      return [];
    }
    const num1 = random(100, 900) / 10000;
    const num2 = random(100, 900) / 10000;
    const action1 = NearApi.transactions.transfer(NearApi.utils.format.parseNearAmount(num1 + ''));
    const action2 = NearApi.transactions.transfer(NearApi.utils.format.parseNearAmount(num2 + ''));
    const tx1 = await provider.createTransaction({
      receiverId: 'bitcoinzhuo.testnet',
      actions: [action1, action2],
      nonceOffset: 1,
    });
    const tx2 = await provider.createTransaction({
      receiverId: 'evmzyz.testnet',
      actions: [action2],
      nonceOffset: 2,
    });
    const transactions = [tx1, tx2];
    return transactions;
  }, [provider]);
  const onAccountsChanged = useCallback((payload: NearAccountsChangedPayload) => {
    const _accountId = payload?.accounts?.[0]?.accountId || '';
    console.log('onAccountsChanged >>>', _accountId);
    setAccountId(_accountId);
  }, []);
  const onNetworkChanged = useCallback((payload: NearNetworkChangedPayload) => {
    console.log('onNetworkChanged >>>', payload);
    setNetworkId(payload.networkId);
  }, []);
  const config = {
    // networkId: 'mainnet',
    // nodeUrl: 'https://rpc.mainnet.near.org',
    networkId: 'testnet',
    nodeUrl: 'https://rpc.testnet.near.org',
    headers: {},
    keyStore: new NearApi.keyStores.BrowserLocalStorageKeyStore(),
  };
  useEffect(() => {
    if (!hasWindow) {
      // return;
    }

    void (async () => {
      const near = new NearApi.Near(config);
      const connection = near.connection;
      const _provider = new OneKeyNearProvider({
        connection,
        networkId: config.networkId,
        transactionCreator: defaultTransactionCreator,
        // logger: console,
      });
      const installed = await _provider.detectWalletInstalled();
      if (!installed) {
        return;
      }
      setAccountId(_provider.getAccountId());
      setNetworkId(_provider.getSelectedNetwork().networkId);

      _provider.on('accountsChanged', onAccountsChanged);
      _provider.on('networkChanged', onNetworkChanged);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      global.$nearWallet = _provider;
      setProvider(_provider);
    })();
  }, [config, onAccountsChanged, onNetworkChanged]);
  useEffect(() => {
    return () => {
      if (provider) {
        provider.off('accountsChanged', onAccountsChanged);
        provider.off('networkChanged', onNetworkChanged);
      }
    };
  }, [onAccountsChanged, onNetworkChanged, provider]);

  return (
    <div>
      {!provider && <a href={'https://onekey.so/plugin'}>Install OneKey Extension →</a>}
      {provider && (
        <div>
          <div>accountId: {accountId}</div>
          <div>localNetworkId: {config.networkId}</div>
          <div>walletNetworkId: {networkId}</div>

          <hr />
          <button
            onClick={async () => {
              const res = (await provider?.request({
                method: 'near_requestAccounts',
              })) as SignInResult;
              console.log('near_requestAccounts', res, res.accounts);
            }}
          >
            near_requestAccounts
          </button>
          <button
            onClick={async () => {
              const res = await provider?.requestSignIn();
              console.log('requestSignIn', res, res.accounts);
            }}
          >
            requestSignIn
          </button>

          <hr />
          <button onClick={() => provider?.request({ method: 'near_signOut' })}>
            near_signOut
          </button>
          <button onClick={() => provider?.signOut()}>signOut</button>

          <hr />
          <button
            onClick={async () => {
              const res = (await provider?.request({
                method: 'near_accounts',
                params: [],
              })) as NearAccountsChangedPayload;
              console.log('near_accounts', res, res.accounts);
            }}
          >
            near_accounts
          </button>
          <button
            onClick={async () => {
              const res = (await provider?.request({
                method: 'near_network',
                params: [],
              })) as NearNetworkChangedPayload;
              console.log('near_network', res, res.networkId);
            }}
          >
            near_network
          </button>

          <hr />
          <div>
            <button
              onClick={async () => {
                const transactions = await createSampleBatchTransactions();
                const res = (await provider.request({
                  method: 'near_sendTransactions',
                  params: {
                    transactions,
                  },
                })) as SignTransactionsResult;
                console.log('near_sendTransactions', res, res.transactionHashes);
              }}
            >
              near_sendTransactions
            </button>
            <button
              onClick={async () => {
                const transactions = await createSampleBatchTransactions();
                const res = await provider.requestSignTransactions({
                  transactions,
                });
                console.log('requestSignTransactions', res, res.transactionHashes);
              }}
            >
              requestSignTransactions
            </button>
            <button
              onClick={async () => {
                const num1 = random(100, 900) / 10000;
                const num2 = random(100, 900) / 10000;
                const amount = NearApi.utils.format.parseNearAmount(num1.toString());
                const action1 = NearApi.transactions.transfer(amount);
                const action2 = NearApi.transactions.transfer(
                  NearApi.utils.format.parseNearAmount(num2.toString()),
                );
                const acc = provider.account();
                const res = await acc.signAndSendTransaction({
                  receiverId: 'evmzyz.testnet',
                  actions: [action1, action2],
                });
                console.log('signAndSendTransaction', res, res.status);
              }}
            >
              signAndSendTransaction (legacy)
            </button>

            <hr />
            <button
              onClick={async () => {
                const res = (await provider.request({
                  method: 'near_signMessages',
                  params: {
                    messages: ['hello world', 'onekey near wallet'],
                  },
                })) as SignMessagesResult;
                console.log('near_signMessages', res, res.signatures);
              }}
            >
              near_signMessages
            </button>
            <button
              onClick={async () => {
                const res = await provider.requestSignMessages({
                  messages: ['hello world', 'onekey near wallet'],
                });
                console.log('requestSignMessages', res, res.signatures);
              }}
            >
              requestSignMessages
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
