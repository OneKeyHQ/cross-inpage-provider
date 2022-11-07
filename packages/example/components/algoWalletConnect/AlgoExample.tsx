/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react';
import { useState, useCallback } from 'react';
import algosdk from 'algosdk';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from 'algorand-walletconnect-qrcode-modal';
import { IInternalEvent } from '@walletconnect/types';

import { Scenario, scenarios, signTxnWithTestAccount } from './scenarios';
import { ChainType, apiSubmitTransactions } from './api';
import { IWalletTransaction, SignTxnParams, IResult } from './types';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';

function stringToChainType(s: string): ChainType {
  switch (s) {
    case ChainType.MainNet.toString():
      return ChainType.MainNet;
    case ChainType.TestNet.toString():
      return ChainType.TestNet;
    default:
      throw new Error(`Unknown chain selected: ${s}`);
  }
}

export default function AlgoExample() {
  const [connector, setConnector] = useState<WalletConnect>();
  const [accounts, setAccounts] = useState<string[]>();
  const [address, setAddress] = useState<string>();
  const [connected, setConnected] = useState<boolean>(false);
  const [chain, setChain] = useState<ChainType>(ChainType.TestNet);
  const [formattedResult, setFormattedResult] = useState<IResult>();
  const [signedTxns, setSignedTxns] = useState<Uint8Array[][]>();

  const handleSessionUpdate = useCallback((accounts: string[]) => {
    const address = accounts[0];
    setAccounts(accounts);
    setAddress(address);
  }, []);

  const handleConnected = useCallback((payload: IInternalEvent) => {
    const { accounts } = payload.params[0];
    const address = accounts[0];
    setAccounts(accounts as string[]);
    setAddress(address as string);
    setConnected(true);
  }, []);

  const handleResetApp = useCallback(() => {
    setAddress('');
    setAccounts([]);
    setConnector(null);
    setConnected(false);
  }, []);

  const handleDisconnected = useCallback(() => {
    handleResetApp();
  }, [handleResetApp]);

  const subscribeToEvents = useCallback(
    (connector: WalletConnect) => {
      if (!connector) {
        return;
      }

      connector.on('session_update', (error, payload: IInternalEvent) => {
        console.log(`algo connector.on("session_update")`, payload);

        if (error) {
          throw error;
        }

        const { accounts } = payload.params[0];
        handleSessionUpdate(accounts as string[]);
      });

      connector.on('connect', (error, payload: IInternalEvent) => {
        console.log(`algo connector.on("connect")`, payload);

        if (error) {
          throw error;
        }

        handleConnected(payload);
      });

      connector.on('disconnect', (error) => {
        console.log(`algo connector.on("disconnect")`);

        if (error) {
          throw error;
        }

        handleDisconnected();
      });

      if (connector.connected) {
        const { accounts } = connector;
        const address = accounts[0];
        setAccounts(accounts);
        setAddress(address);
        setConnected(true);
        handleSessionUpdate(accounts);
      }

      setConnector(connector);
    },
    [handleConnected, handleDisconnected, handleSessionUpdate],
  );

  const handleConnectWallet = useCallback(async () => {
    const bridge = 'https://bridge.walletconnect.org';

    const connector = new WalletConnect({ bridge, qrcodeModal: QRCodeModal });
    // @ts-ignore
    window.wcConnector = connector;
    setConnector(connector);

    if (!connector.connected) {
      await connector.createSession({
        network: 'algo',
      });
    }

    subscribeToEvents(connector);
  }, [subscribeToEvents]);

  const handleSignTxnScenario = useCallback(
    async (scenario: Scenario) => {
      if (!connector) {
        return;
      }

      try {
        const txnsToSign = await scenario(chain, address);
        const flatTxns = txnsToSign.reduce((acc, val) => acc.concat(val), []);

        const walletTxns: IWalletTransaction[] = flatTxns.map(
          ({ txn, signers, authAddr, message }) => ({
            txn: Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64'),
            signers,
            authAddr,
            message,
          }),
        );

        // sign transaction
        const params: SignTxnParams = [walletTxns];
        const result: Array<string | null> = await connector.sendCustomRequest({
          method: 'algo_signTxn',
          params,
        });

        console.log('Raw response:', result);

        const indexToGroup = (index: number) => {
          for (let group = 0; group < txnsToSign.length; group++) {
            const groupLength = txnsToSign[group].length;
            if (index < groupLength) {
              return [group, index];
            }

            index -= groupLength;
          }

          throw new Error(`Index too large for groups: ${index}`);
        };

        const signedPartialTxns: Array<Array<Uint8Array | null>> = txnsToSign.map(() => []);
        result.forEach((r, i) => {
          const [group, groupIndex] = indexToGroup(i);
          const toSign = txnsToSign[group][groupIndex];

          if (r == null) {
            if (toSign.signers !== undefined && toSign.signers?.length < 1) {
              signedPartialTxns[group].push(null);
              return;
            }
            throw new Error(`Transaction at index ${i}: was not signed when it should have been`);
          }

          if (toSign.signers !== undefined && toSign.signers?.length < 1) {
            throw new Error(`Transaction at index ${i} was signed when it should not have been`);
          }

          const rawSignedTxn = Buffer.from(r, 'base64');
          signedPartialTxns[group].push(new Uint8Array(rawSignedTxn));
        });

        const signedTxns: Uint8Array[][] = signedPartialTxns.map(
          (signedPartialTxnsInternal, group) => {
            return signedPartialTxnsInternal.map((stxn, groupIndex) => {
              if (stxn) {
                return stxn;
              }

              return signTxnWithTestAccount(txnsToSign[group][groupIndex].txn);
            });
          },
        );

        const signedTxnInfo: Array<
          Array<{
            txID: string;
            signingAddress?: string;
            signature: string;
          } | null>
        > = signedPartialTxns.map((signedPartialTxnsInternal, group) => {
          return signedPartialTxnsInternal.map((rawSignedTxn, i) => {
            if (rawSignedTxn == null) {
              return null;
            }

            const signedTxn = algosdk.decodeSignedTransaction(rawSignedTxn);
            const txn = signedTxn.txn as unknown as algosdk.Transaction;
            const txID = txn.txID();
            const unsignedTxID = txnsToSign[group][i].txn.txID();

            if (txID !== unsignedTxID) {
              throw new Error(
                `Signed transaction at index ${i} differs from unsigned transaction. Got ${txID}, expected ${unsignedTxID}`,
              );
            }

            if (!signedTxn.sig) {
              throw new Error(`Signature not present on transaction at index ${i}`);
            }

            return {
              txID,
              signingAddress: signedTxn.sgnr ? algosdk.encodeAddress(signedTxn.sgnr) : undefined,
              signature: Buffer.from(signedTxn.sig).toString('base64'),
            };
          });
        });

        // format displayed result
        const formattedResult: IResult = {
          method: 'algo_signTxn',
          body: signedTxnInfo,
        };

        setConnector(connector);
        setSignedTxns(signedTxns);
        setFormattedResult(formattedResult);
      } catch (error) {
        console.error(error);
        setConnector(connector);
        setFormattedResult(null);
      }
    },
    [address, chain, connector],
  );

  const handleSubmitTxs = useCallback(async () => {
    if (signedTxns == null) {
      throw new Error('Transactions to submit are null');
    }

    for (let i = 0; i < signedTxns.length; i++) {
      try {
        const confirmedRound = await apiSubmitTransactions(chain, signedTxns[i]);
        console.log(`Transaction confirmed at round ${confirmedRound}`);
      } catch (err) {
        console.error(`Error submitting transaction at index ${i}:`, err);
      }
    }
  }, [signedTxns, chain]);

  const handleKissSession = useCallback(async () => {
    await connector.killSession();
    handleResetApp();
  }, [connector, handleResetApp]);

  return (
    <div>
      <DAppList dapps={dapps} />
      <main>
        {connected && (
          <p>
            {`Connected to `}
            <select
              onChange={(event) => setChain(stringToChainType(event.target.value))}
              value={chain}
            >
              <option value={ChainType.TestNet}>Algorand TestNet</option>
              <option value={ChainType.MainNet}>Algorand MainNet</option>
            </select>
          </p>
        )}
        {connected ? (
          <>
            <div>
              <pre>Connected as: {address}</pre>
              <button onClick={handleKissSession}>Disconnect</button>
            </div>
            {formattedResult && (
              <div>
                <pre>formattedResult: {JSON.stringify(formattedResult)}</pre>
                <button onClick={handleSubmitTxs}>{'Submit transaction to network.'}</button>
              </div>
            )}
            {scenarios.map(({ name, scenario }) => (
              <button key={name} onClick={() => handleSignTxnScenario(scenario)}>
                {name}
              </button>
            ))}
            <button onClick={() => connector.killSession()}>Disconnect</button>
          </>
        ) : (
          <>
            <button onClick={handleConnectWallet}>Connect Wallet</button>
          </>
        )}
      </main>
    </div>
  );
}
