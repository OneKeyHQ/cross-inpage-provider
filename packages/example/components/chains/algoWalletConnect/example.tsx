/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { SignerTransaction } from './types';
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
import { useCallback, useEffect, useState } from 'react';
import { ChainType, apiSubmitTransactions, clientForChain } from './api';
import { Input } from '../../ui/input';
import {
  formatJsonRpcRequest,
  generateSinglePayTxn,
  getSignTxnRequestParams,
  base64ToUint8Array,
  generateSingleAssetTransferTxn,
  generateSingleAssetCloseTxn,
  generateSingleAppCall,
  generateSingleAppOptIn,
  generateSingleAppCloseOut,
  generateSingleAppClearState,
} from './transaction';

// https://github.com/WalletConnect/walletconnect-monorepo/issues/3251
// https://github.com/algorand/walletconnect-example-dapp
// https://github.com/TxnLab/algorand-wc2
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

// const chainTypeMap = {
//   ['algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k']: ChainType.MainNet,
//   ['algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe']: ChainType.TestNet,
// };

const chainTypeToChainIdMap = {
  [ChainType.MainNet]: 'algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73k',
  [ChainType.TestNet]: 'algorand:SGO1GKSzyE7IEPItTxCByw9x8FmnrCDe',
};

function Example() {
  const { connect, client, session, accounts } = useWalletConnectClient();
  const [account, setAccount] = useState<string>('');
  const chain = ChainType.MainNet;

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    await connect(AlgoNameSpace, AlgoNameSpaceOptional);

    return {
      provider: true,
    };
  };

  useEffect(() => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    }
  }, [accounts]);

  const getAccountInfo = () => {
    const [namespace, reference, address] = account?.split(':');
    return {
      namespace,
      reference,
      address,
    };
  };

  const onCommonExecute = useCallback(async (request: string) => {
    const requestObj = JSON.parse(request);
    const response = await client?.request<(string | number[])[]>({
      chainId: chainTypeToChainIdMap[chain],
      topic: session.topic,
      request: requestObj,
    });

    return JSON.stringify(response);
  }, []);

  const onCommonValidate = useCallback(async (request: string, result: string) => {
    const response = JSON.parse(result);

    const signedTxns =
      typeof response[0] === 'string'
        ? (response as string[]).map(base64ToUint8Array)
        : (response as number[][]).map((item) => Uint8Array.from(item));

    const sentTransaction = await apiSubmitTransactions(chain, signedTxns);

    return JSON.stringify(sentTransaction);
  }, []);

  const generateJsonRpcRequest = useCallback((transaction: SignerTransaction) => {
    const signTxnParams = getSignTxnRequestParams([transaction]);
    const request = formatJsonRpcRequest('algo_signTxn', [signTxnParams]);
    return JSON.stringify(request);
  }, []);

  const getTokenTransferFrom = () => {
    return (
      <>
        <Input
          label="收款地址"
          type="text"
          name="toAddress"
          defaultValue={getAccountInfo()?.address ?? ''}
        />
        <Input label="转账金额" type="number" name="amount" defaultValue="10000" />
        <select name="assetIndex" className="select">
          <option selected>选择 Token</option>
          <option value="31566704">MainNet USDC</option>
          <option value="10458941">TestNet USDC</option>
        </select>
        <Input label="note" type="text" name="note" />
      </>
    );
  };

  const generateSingleAssetTransferCommon = async (
    fromData: Record<string, any>,
    generate: (
      chain: ChainType,
      fromAddress: string,
      toAddress: string,
      assetIndex: string,
      amount: number,
      note: string | undefined,
    ) => Promise<SignerTransaction>,
  ) => {
    const fromAddress = getAccountInfo()?.address ?? '';
    const toAddress = fromData['toAddress'] as string;
    const amount = parseInt(fromData['amount'] as string);
    const assetIndex = fromData['assetIndex'] as string;
    const note = fromData['note'] as string | undefined;

    if (!toAddress || !amount) {
      throw new Error('toAddress or amount is required');
    }
    if (!assetIndex) {
      throw new Error('请选择 Token');
    }

    const transaction = await generate(chain, fromAddress, toAddress, assetIndex, amount, note);
    return generateJsonRpcRequest(transaction);
  };

  const getAppCallFrom = () => {
    return (
      <>
        <Input
          label="收款地址"
          type="text"
          name="toAddress"
          defaultValue={getAccountInfo()?.address ?? ''}
        />
        <select name="appIndex" className="select">
          <option selected>选择 App</option>
          <option value="305162725">MainNet Test App</option>
          <option value="22314999">TestNet Test App</option>
        </select>

        <Input label="note" type="text" name="note" />
      </>
    );
  };

  const generateSingleAppCallCommon = async (
    fromData: Record<string, any>,
    generate: (
      chain: ChainType,
      fromAddress: string,
      appIndex: string,
      note: string | undefined,
      appArgs?: Uint8Array[] | undefined,
    ) => Promise<SignerTransaction>,
  ) => {
    const fromAddress = getAccountInfo()?.address ?? '';
    const toAddress = fromData['toAddress'] as string;
    const appIndex = fromData['appIndex'] as string;
    const note = fromData['note'] as string | undefined;

    if (!toAddress) {
      throw new Error('toAddress is required');
    }
    if (!appIndex) {
      throw new Error('请选择 App');
    }

    const transaction = await generate(chain, fromAddress, appIndex, note);
    return generateJsonRpcRequest(transaction);
  };

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
      <ApiGroup title="algo_signTxn">
        <ApiPayload
          title="algo_signTxn"
          description="给账户转账"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={() => {
            return (
              <>
                <Input
                  label="收款地址"
                  type="text"
                  name="toAddress"
                  defaultValue={getAccountInfo()?.address ?? ''}
                />
                <Input label="转账金额" type="number" name="amount" defaultValue="10000" />
                <Input label="note" type="text" name="note" />
              </>
            );
          }}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            const fromAddress = getAccountInfo()?.address ?? '';
            const toAddress = fromData['toAddress'] as string;
            const amount = parseFloat(fromData['amount'] as string);
            const note = fromData['note'] as string | undefined;

            if (!toAddress || !amount) {
              throw new Error('toAddress or amount is required');
            }

            const transaction = await generateSinglePayTxn(
              chain,
              fromAddress,
              toAddress,
              amount,
              note,
            );

            return generateJsonRpcRequest(transaction);
          }}
        />
        <ApiPayload
          title="algo_signTxn"
          description="AssetTransferTxn 给账户 Token 转账，amount 为 0 时为声明 Token（AssetOptInTxn）"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={getTokenTransferFrom}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            return generateSingleAssetTransferCommon(fromData, generateSingleAssetTransferTxn);
          }}
        />
        <ApiPayload
          title="algo_signTxn"
          description="删除 Token,!!!!! 请谨慎操作 !!!!!"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={getTokenTransferFrom}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            return generateSingleAssetTransferCommon(fromData, generateSingleAssetCloseTxn);
          }}
        />
        <ApiPayload
          title="algo_signTxn"
          description="ApplicationOptInTxn 进入 App 交互"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={getAppCallFrom}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            return generateSingleAppCallCommon(fromData, generateSingleAppOptIn);
          }}
        />
        <ApiPayload
          title="algo_signTxn"
          description="ApplicationNoOpTxn 与 App 交互"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={getAppCallFrom}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            return generateSingleAppCallCommon(fromData, generateSingleAppCall);
          }}
        />
        <ApiPayload
          title="algo_signTxn"
          description="ApplicationCloseOutTxn 与 App 交互"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={getAppCallFrom}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            return generateSingleAppCallCommon(fromData, generateSingleAppCloseOut);
          }}
        />
        <ApiPayload
          title="algo_signTxn"
          description="ApplicationClearStateTxn 与 App 交互"
          onExecute={onCommonExecute}
          onValidate={onCommonValidate}
          generateRequestFrom={getAppCallFrom}
          onGenerateRequest={async (fromData: Record<string, any>) => {
            return generateSingleAppCallCommon(fromData, generateSingleAppClearState);
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
