/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { IProviderApi, IResult, IWalletTransaction, SignTxnParams } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import {
  ClientContextProvider,
  useWalletConnectClient,
} from '../../../components/walletConnect/ClientContext';
import { ProposalTypes } from '@walletconnect/types';
import InfoLayout from '../../../components/InfoLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { useCallback, useState } from 'react';
import { Scenario, scenarios, signTxnWithTestAccount } from './scenarios';
import { ChainType } from './api';
import algosdk from 'algosdk';

// https://github.com/WalletConnect/walletconnect-monorepo/issues/3251
// https://github.com/algorand/walletconnect-example-dapp
const chainName = 'algorand';
const namespace = 'wGHE2Pwdvd7S12BL5FaOP20EGYesN73k';
const AlgoNameSpace: ProposalTypes.RequiredNamespaces = {
  algorand: {
    chains: [`${chainName}:${namespace}`],
    methods: [],
    events: [],
  },
  // eip155: {
  //   chains: [`eip155:1`],
  //   methods: ['eth_sendTransaction', 'personal_sign'],
  //   events: ['chainChanged', 'accountsChanged'],
  // },
};
const AlgoNameSpaceOptional: ProposalTypes.OptionalNamespaces = {
  algorand: {
    chains: [`${chainName}:${namespace}`],
    methods: ['algo_signTx'],
    events: [],
  },
  // eip155: {
  //   chains: [`eip155:1`],
  //   methods: [
  //     'eth_signTransaction',
  //     'eth_sign',
  //     'eth_signTypedData',
  //     'eth_signTypedData_v4',
  //     'wallet_getCapabilities',
  //     'wallet_sendCalls',
  //     'wallet_getCallsStatus',
  //   ],
  //   events: [],
  // },
};

const chainTypeMap = {
  ['algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k']: ChainType.MainNet,
};

function Example() {
  const { connect, client, session, accounts } = useWalletConnectClient();
  const [account, setAccount] = useState<string>('');

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    await connect(AlgoNameSpace, AlgoNameSpaceOptional);

    return {
      provider: true,
    };
  };

  const handleSignTxnScenario = useCallback(
    async (scenario: Scenario, chainId: string, address: string) => {
      // @ts-expect-error
      const chain = chainTypeMap?.[chainId] ?? ChainType.MainNet;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
      const result = await client?.request<Array<string | null>>({
        chainId,
        topic: session.topic,
        request: {
          method: 'algo_signTx',
          params,
        },
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

      return JSON.stringify(formattedResult);
    },
    [client, session],
  );

  if (!client) {
    return <div>Initializing...</div>;
  }

  return (
    <>
      <ConnectButton<any>
        fetchWallets={() => {
          return Promise.resolve([
            {
              id: 'algorand',
              name: 'Algorand Wallet Connect V2',
            },
          ]);
        }}
        onConnect={onConnectWallet}
        onDisconnect={async () => {
          if (session) {
            setAccount('');
            return await client.disconnect({
              topic: session.topic,
              reason: {
                code: 0,
                message: 'User disconnected',
              },
            });
          }
        }}
      />
      <InfoLayout title="选择账户">
        <Select defaultValue={account} onValueChange={setAccount}>
          <SelectTrigger className="w-full">
            <SelectValue className="text-base font-medium" placeholder="选择参数" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((item) => {
              return (
                <SelectItem key={item} value={item} className="text-base font-medium">
                  {item}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </InfoLayout>
      <ApiGroup title="Basics">
        <ApiPayload
          title="getPublicKey"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const [namespace, reference, address] = account.split(':');
            const chainId = `${namespace}:${reference}`;
            return handleSignTxnScenario(scenarios[0].scenario, chainId, account);
          }}
        />
      </ApiGroup>
      <DappList dapps={dapps} />
    </>
  );
}

export default function App() {
  return (
    <ClientContextProvider>
      <Example />
    </ClientContextProvider>
  );
}
