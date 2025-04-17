/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands,@typescript-eslint/ban-ts-comment */
import React from 'react';
import {
  OneKeyNearProvider,
  NearAccountsChangedPayload,
  NearNetworkChangedPayload,
  TransactionCreatorParams,
  SignMessagesResult,
  SignInResult,
  SignTransactionsResult,
} from '@onekeyfe/onekey-near-provider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as NearApi from 'near-api-js';
import { random } from 'lodash';
import BN from 'bn.js';

import DAppList from '../../DAppList';
import { dapps } from './dapps.config';

const hasWindow = typeof window !== 'undefined';

declare global {
  interface Window {
    provider: OneKeyNearProvider;
    nearAPI: typeof NearApi;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    OneKeyNearProvider: any;
  }
}

window.nearAPI = NearApi;
window.OneKeyNearProvider = OneKeyNearProvider;

// TODO mobile web
// TODO Toggle debugLogger button
// TODO 0.0.7

function toBN(value: string | null | undefined) {
  return new BN(value ?? '', 10);
}

// fix: Error: Class Action is missing in schema: actions.actions
function transactionCreator({
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
  const [publicKey, setPublicKey] = useState('');
  const [networkId, setNetworkId] = useState('');

  const createSampleBatchTransactions = useCallback(async () => {
    if (!provider) {
      return [];
    }
    const num1 = random(100, 900) / 10000;
    const num2 = random(100, 900) / 10000;
    const action1 = NearApi.transactions.transfer(
      toBN(NearApi.utils.format.parseNearAmount(`${num1}`)),
    );
    const action2 = NearApi.transactions.transfer(
      toBN(NearApi.utils.format.parseNearAmount(`${num2}`)),
    );
    // TODO custom createTransaction, call near_accountNonce near_blockInfo
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
    const _publicKey = payload?.accounts?.[0]?.publicKey || '';
    console.log('near onAccountsChanged >>>', _accountId, _publicKey);
    setAccountId(_accountId);
    setPublicKey(_publicKey);
  }, []);
  const onNetworkChanged = useCallback((payload: NearNetworkChangedPayload) => {
    console.log('near onNetworkChanged >>>', payload);
    setNetworkId(payload.networkId);
  }, []);
  const config = useMemo(
    () => ({
      // networkId: 'mainnet',
      // nodeUrl: 'https://rpc.mainnet.near.org',
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      headers: {},
      keyStore: new NearApi.keyStores.BrowserLocalStorageKeyStore(),
    }),
    [],
  );

  useEffect(() => {
    if (!hasWindow) {
      // return;
    }

    // const near = new NearApi.Near(config);
    // const connection = near.connection;
    const _provider = new OneKeyNearProvider({
      // connection,
      // networkId: config.networkId,
      // connectEagerly: true, // auto connect wallet accounts even if localStorage cleared
      transactionCreator: process.env.NODE_ENV !== 'production' ? transactionCreator : undefined,
      // logger: console,
    });
    _provider.on('accountsChanged', onAccountsChanged);
    _provider.on('networkChanged', onNetworkChanged);

    window.provider = _provider;

    void (async () => {
      const installed = await _provider.detectWalletInstalled();
      if (installed) {
        setProvider(_provider);

        const res1 = (await _provider.request({
          method: 'near_accounts',
        })) as NearAccountsChangedPayload;
        setAccountId(res1?.accounts?.[0]?.accountId || '');
        setPublicKey(res1?.accounts?.[0]?.publicKey || '');
        // setAccountId(provider.getAccountId());

        const res2 = (await _provider.request({
          method: 'near_networkInfo',
        })) as NearNetworkChangedPayload;
        setNetworkId(res2?.networkId || '');
        // setNetworkId(provider.getNetworkInfo().networkId);
      }
    })();

    return () => {
      _provider.off('accountsChanged', onAccountsChanged);
      _provider.off('networkChanged', onNetworkChanged);
    };
  }, [config, onAccountsChanged, onNetworkChanged]);

  return (
    <div>
      <DAppList dapps={dapps} />
      {!provider && (
        <a target="_blank" href={'https://www.onekey.so/download/'}>
          Install OneKey Extension →
        </a>
      )}
      {provider && (
        <div>
          <div>
            accountId: <strong>{accountId}</strong>
          </div>
          <div>
            publicKey: <strong>{publicKey}</strong>
          </div>
          <div>
            localNetworkId: <strong>{provider._networkId}</strong> <button>switch TODO</button>
          </div>
          <div>
            walletNetworkId: <strong>{networkId}</strong>
          </div>
          <div>
            providerVersion: <strong>v{provider.version}</strong>
          </div>

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
                method: 'near_networkInfo',
                params: [],
              })) as NearNetworkChangedPayload;
              console.log('near_networkInfo', res, res.networkId);
            }}
          >
            near_networkInfo
          </button>
          <button
            onClick={async () => {
              const res = await provider?.request({
                method: 'near_accountNonce',
                params: [],
              });
              console.log('near_accountNonce', res);
            }}
          >
            near_accountNonce
          </button>
          <button
            onClick={async () => {
              const res = await provider?.request({
                method: 'near_blockInfo',
                params: [],
              });
              console.log('near_blockInfo', res);
            }}
          >
            near_blockInfo
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
                const transactions = await createSampleBatchTransactions();
                const res = (await provider.request({
                  method: 'near_signTransactions',
                  params: {
                    transactions,
                  },
                })) as SignMessagesResult;
                console.log('near_signTransactions', res, res.signatures);
              }}
            >
              near_signTransactions
            </button>
            <button>TODO Send USDT Token (mainnet only)</button>
            <button
              onClick={async () => {
                const num1 = random(100, 900) / 10000;
                const num2 = random(100, 900) / 10000;
                const amount = NearApi.utils.format.parseNearAmount(num1.toString());
                const action1 = NearApi.transactions.transfer(toBN(amount));
                const action2 = NearApi.transactions.transfer(
                  toBN(NearApi.utils.format.parseNearAmount(num2.toString())),
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

            <hr />
            <button
              onClick={async () => {
                const res = await provider.request({
                  'method': 'query',
                  'params': {
                    'request_type': 'view_access_key_list',
                    'account_id':
                      'c3be856133196da252d0f1083614cdc87a85c8aa8abeaf87daff1520355eec53',
                    'finality': 'optimistic',
                  },
                });
                console.log('RPC Call: view_access_key_list', res);
              }}
            >
              RPC Call: view_access_key_list
            </button>
            <button
              onClick={async () => {
                const res = await provider.request({
                  'method': 'gas_price',
                  'params': [null],
                });
                console.log('RPC Call: gas_price', res);
              }}
            >
              RPC Call: gas_price
            </button>
            <button
              onClick={async () => {
                const res = await provider.request({
                  'method': 'status',
                  'params': [],
                });
                console.log('RPC Call: status', res);
              }}
            >
              RPC Call: status
            </button>
            <button
              onClick={async () => {
                const res = await provider.request({
                  'method': 'network_info',
                  'params': [],
                });
                console.log('RPC Call: network_info', res);
              }}
            >
              RPC Call: network_info
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
