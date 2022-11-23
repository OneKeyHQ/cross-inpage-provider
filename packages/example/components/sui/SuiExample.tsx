import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { ProviderSui } from '@onekeyfe/onekey-sui-provider';

import { DAppList } from '../dappList/DAppList';
import { dapps } from './dapps.config';
import { Coin, JsonRpcProvider, SignableTransaction, SUI_TYPE_ARG, GetObjectDataResponse, getObjectId, MoveCallTransaction, LocalTxnDataSerializer, Base64DataBuffer } from '@mysten/sui.js';

declare global {
  interface Window {
    // @ts-expect-error
    suiWallet: ProviderSui;
  }
}

const useProvider = () => {
  const [provider, setProvider] = useState<ProviderSui>();

  useEffect(() => {
    const injectedProvider = window.suiWallet as ProviderSui;
    const suiProvider =
      injectedProvider ||
      new ProviderSui({
        // use mock api provider bridge for development
        // bridge: new CustomBridge(),
      });
    setProvider(suiProvider);
  }, []);

  return provider;
};

const DEFAULT_GAS_BUDGET_FOR_PAY = 150;

const INIT_MOVE_CALL: MoveCallTransaction = {
  packageObjectId: '0x0000000000000000000000000000000000000002',
  module: 'devnet_nft',
  function: 'mint',
  typeArguments: [],
  arguments: ["Example NFT", "An NFT created by Sui Wallet", "ipfs://QmZPWWy5Si54R3d26toaqRiqvCH7HkGdXkxwUgCm2oKKM2?filename=img-sq-01.png"],
  gasBudget: 2000,
}

export default function App() {
  const provider = useProvider();

  const [network, setNetwork] = useState<string>('TestNet');
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);

  const [moveCall, setMoveCall] = useState<MoveCallTransaction>(INIT_MOVE_CALL);


  const rpcProvider = useMemo(() => {
    if (network.toLowerCase() === 'testnet') {
      return new JsonRpcProvider('https://fullnode.testnet.sui.io', {
        faucetURL: 'https://faucet.testnet.sui.io/gas',
      });
    } else {
      return new JsonRpcProvider('https://fullnode.devnet.sui.io', {
        faucetURL: 'https://faucet.devnet.sui.io/gas',
      });
    }
  }, [network])

  useEffect(() => {
    if (!provider) return;
    // try to eagerly connect
    // provider.connect().catch((err) => {
    //     err;
    //     // fail silently
    // });

    try {
      provider.on('connect', (address: string) => {
        setConnected(true);
        setAddress(address);
        console.log(`suiWallet.on [connect] ${address}`);
      });
    } catch (e) {
      // ignore
    }
    try {
      provider.on('disconnect', () => {
        setAddress(null);
        setConnected(false);
        console.log('suiWallet.on [disconnect] 👋');
      });
    } catch (e) {
      // ignore
    }
    try {
      provider.on('networkChange', (network: string) => {
        setNetwork(network);
        console.log(`suiWallet.on [networkChange] ${network}`);
      });
    } catch (e) {
      // ignore
    }
    try {
      provider.on('accountChanged', (address: string) => {
        setAddress(address);
        setConnected(address ? true : false);
        console.log(`suiWallet.on [accountChange] ${address}`);
      });
    } catch (e) {
      // ignore
    }
    return () => {
      void provider.disconnect();
    };
  }, [provider]);

  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const hasPermissions = async () => {
    try {
      const has = await provider.hasPermissions();
      console.log('[hasPermissions]', has);
    } catch (err) {
      console.warn(err);
      console.log(`[error] hasPermissions: ${JSON.stringify(err)}`);
    }
  };

  const requestPermissions = async () => {
    try {
      const has = await provider.requestPermissions();
      console.log('[requestPermissions]', has);
      return has
    } catch (err) {
      console.warn(err);
      console.log(`[error] requestPermissions: ${JSON.stringify(err)}`);
    }
  };

  const getAccounts = async () => {
    try {
      const accounts = await provider.getAccounts();
      console.log('[getAccounts]', accounts);
      return accounts
    } catch (err) {
      console.warn(err);
      console.log(`[error] getAccounts: ${JSON.stringify(err)}`);
    }
  };

  const connectWallet = async () => {
    try {
      const has = await requestPermissions();
      if (has) {
        const accounts = await getAccounts()
        setAddress(accounts[0]);
        setNetwork(network);
        setConnected(true);

        console.log('[connectWallet] account', accounts, network);
      } else {
        console.log('[error] connectWallet', has, network);
      }
    } catch (err) {
      console.warn(err);
      console.log(`[error] connectWallet: ${JSON.stringify(err)}`);
    }
  };

  const requestSuiFromFaucet = async () => {
    try {
      const faucet = await rpcProvider.requestSuiFromFaucet(address);
      console.log('[requestSuiFromFaucet] faucet success:', faucet);
    } catch (err) {
      console.warn(err);
      console.log(`[error] requestSuiFromFaucet: ${JSON.stringify(err)}`);
    }
  }

  const disconnectWallet = async () => {
    try {
      await provider.disconnect();
    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };

  const computeGasBudgetForPay = (
    coins: GetObjectDataResponse[],
    amount: string,
  ) => {
    const numInputCoins = Coin.selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
      coins,
      BigInt(amount),
    );
    return DEFAULT_GAS_BUDGET_FOR_PAY * Math.max(2, Math.min(100, numInputCoins.length / 2));
  }

  const buildTransfer = async (
    to: string,
    amount: string,
    argType?: string,
  ): Promise<SignableTransaction> => {
    const recipient = to;
    const sender = address;
    const isSuiTransfer = argType == null || argType === '';

    const typeArg = isSuiTransfer ? SUI_TYPE_ARG : argType;
    const readyCoins = await rpcProvider.getCoinBalancesOwnedByAddress(
      sender,
      typeArg,
    );
    const totalBalance = Coin.totalBalance(readyCoins);
    const gasBudget = computeGasBudgetForPay(readyCoins, amount);

    let amountAndGasBudget = isSuiTransfer
      ? BigInt(amount) + BigInt(gasBudget)
      : BigInt(amount);
    if (amountAndGasBudget > totalBalance) {
      amountAndGasBudget = totalBalance;
    }

    const inputCoins = Coin.selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
      readyCoins,
      amountAndGasBudget,
    ) as GetObjectDataResponse[];

    const selectCoinIds = inputCoins.map((object) => getObjectId(object));

    const txCommon = {
      inputCoins: selectCoinIds,
      recipients: [recipient],
      amounts: [parseInt(amount)],
      gasBudget,
    };

    let encodedTx: SignableTransaction;
    if (isSuiTransfer) {
      encodedTx = {
        kind: 'paySui',
        data: {
          ...txCommon,
        },
      };
    } else {
      // Get native coin objects
      const gasFeeCoins = await rpcProvider.selectCoinsWithBalanceGreaterThanOrEqual(
        sender,
        BigInt(gasBudget),
        SUI_TYPE_ARG,
      );

      const gasCoin = Coin.selectCoinWithBalanceGreaterThanOrEqual(
        gasFeeCoins,
        BigInt(gasBudget),
      ) as GetObjectDataResponse | undefined;

      if (!gasCoin) {
        console.log(`[error] gas coin not found`);
        return null
      }

      encodedTx = {
        kind: 'pay',
        data: {
          ...txCommon,
          gasPayment: getObjectId(gasCoin),
        },
      };
    }

    return encodedTx;
  }

  const buildTransferPay = async (
    to: string,
    amount: string
  ): Promise<SignableTransaction> => {
    const recipient = to;
    const sender = address;

    const typeArg = SUI_TYPE_ARG;
    const readyCoins = await rpcProvider.getCoinBalancesOwnedByAddress(
      sender,
      typeArg,
    );
    const totalBalance = Coin.totalBalance(readyCoins);
    const gasBudget = computeGasBudgetForPay(readyCoins, amount);

    let amountAndGasBudget = BigInt(amount) + BigInt(gasBudget)
    if (amountAndGasBudget > totalBalance) {
      amountAndGasBudget = totalBalance;
    }

    const inputCoins = Coin.selectCoinSetWithCombinedBalanceGreaterThanOrEqual(
      readyCoins,
      amountAndGasBudget,
    ) as GetObjectDataResponse[];

    const selectCoinIds = inputCoins.map((object) => getObjectId(object));

    return {
      kind: 'pay',
      data: {
        inputCoins: selectCoinIds,
        recipients: [recipient],
        amounts: [parseInt(amount)],
        gasBudget,
      }
    }
  }

  const signAndExecuteTransaction = async (hasBytes = false) => {
    try {
      const transfer = hasBytes ? (await buildTransferPay(address, '100000')) : (await buildTransfer(address, '100000'));

      let res: unknown = null
      if (hasBytes) {
        const serializer = new LocalTxnDataSerializer(rpcProvider)

        let tnx: Base64DataBuffer = null
        if (transfer.kind === 'paySui') {
          tnx = await serializer.newPaySui(address, transfer.data)
        } else if (transfer.kind === 'pay') {
          tnx = await serializer.newPay(address, transfer.data)
        }

        if (!tnx) throw new Error('tnx is null')

        res = await provider.signAndExecuteTransaction({
          kind: 'bytes',
          data: tnx.getData()
        });
      } else {
        res = await provider.signAndExecuteTransaction(transfer);
      }

      console.log('[signAndExecuteTransaction]', res);
    } catch (err) {
      console.warn(err);
      console.log(`[error] signAndExecuteTransaction: ${JSON.stringify(err)}`);
    }
  };

  const buildMoveCall = async (): Promise<MoveCallTransaction> => {
    const gasBudget = 2000;
    const sender = address;

    // Get native coin objects
    const gasFeeCoins = await rpcProvider.selectCoinsWithBalanceGreaterThanOrEqual(
      sender,
      BigInt(gasBudget),
      SUI_TYPE_ARG,
    );

    const gasCoin = Coin.selectCoinWithBalanceGreaterThanOrEqual(
      gasFeeCoins,
      BigInt(gasBudget),
    ) as GetObjectDataResponse | undefined;

    if (!gasCoin) {
      console.log(`[error] gas coin not found`);
      return null
    }

    return {
      packageObjectId: '0x0000000000000000000000000000000000000002',
      module: 'devnet_nft',
      function: 'mint',
      typeArguments: [],
      arguments: ["Example NFT", "An NFT created by Sui Wallet", "ipfs://QmZPWWy5Si54R3d26toaqRiqvCH7HkGdXkxwUgCm2oKKM2?filename=img-sq-01.png"],
      gasPayment: getObjectId(gasCoin),
      gasBudget,
    }
  }

  const buildCustomMoveCall = async (): Promise<MoveCallTransaction> => {
    const gasBudget = moveCall.gasBudget;
    const sender = address;

    // Get native coin objects
    const gasFeeCoins = await rpcProvider.selectCoinsWithBalanceGreaterThanOrEqual(
      sender,
      BigInt(gasBudget),
      SUI_TYPE_ARG,
    );

    const gasCoin = Coin.selectCoinWithBalanceGreaterThanOrEqual(
      gasFeeCoins,
      BigInt(gasBudget),
    ) as GetObjectDataResponse | undefined;

    if (!gasCoin) {
      console.log(`[error] gas coin not found`);
      return null
    }

    return {
      ...moveCall,
      gasPayment: getObjectId(gasCoin),
    }
  }

  const executeMoveCall = async () => {
    try {
      const moveCall = await buildMoveCall()
      const tx = await provider.executeMoveCall(moveCall);

      console.log('[executeMoveCall]', tx);
    } catch (err) {
      console.warn(err);
      console.log(`[error] executeMoveCall: ${JSON.stringify(err)}`);
    }
  }

  const customExecuteMoveCall = async () => {
    try {
      const moveCall = await buildCustomMoveCall()
      const tx = await provider.executeMoveCall(moveCall);

      console.log('[executeMoveCall]', tx);
    } catch (err) {
      console.warn(err);
      console.log(`[error] executeMoveCall: ${JSON.stringify(err)}`);
    }
  }

  const executeSerializedMoveCall = async () => {
    try {
      const moveCall = await buildMoveCall()

      const serializer = new LocalTxnDataSerializer(rpcProvider)

      const tnx = await serializer.newMoveCall(address, moveCall)

      const tx = await provider.executeSerializedMoveCall(tnx.toString());

      console.log('[executeSerializedMoveCall]', tx);
    } catch (err) {
      console.warn(err);
      console.log(`[error] executeSerializedMoveCall: ${JSON.stringify(err)}`);
    }
  }

  const customExecuteSerializedMoveCall = async () => {
    try {
      const moveCall = await buildCustomMoveCall()

      const serializer = new LocalTxnDataSerializer(rpcProvider)

      const tnx = await serializer.newMoveCall(address, moveCall)

      const tx = await provider.executeSerializedMoveCall(tnx.toString());

      console.log('[executeSerializedMoveCall]', tx);
    } catch (err) {
      console.warn(err);
      console.log(`[error] executeSerializedMoveCall: ${JSON.stringify(err)}`);
    }
  }


  return (
    <div>
      <DAppList dapps={dapps} />
      {!provider && (
        <a target="_blank" href={'https://www.onekey.so/download/'}>
          Install OneKey Extension →
        </a>
      )}
      <main>
        {provider && connected ? (
          <>
            <div>
              <pre>Network: <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                <option value="TestNet">TestNet</option>
                <option value="DevNet">DevNet</option>
              </select></pre>
              <pre>Connected as: {address}</pre>
              <button onClick={requestSuiFromFaucet}>Faucet SUI</button>
            </div>

            <br />
            <button onClick={hasPermissions}>Has Permissions</button>
            <button onClick={requestPermissions}>Request Permissions</button>
            <button onClick={getAccounts}>Get Accounts</button>
            <button onClick={async () => await signAndExecuteTransaction()}>Sign & Execute Transaction</button>
            <button onClick={async () => await signAndExecuteTransaction(true)}>Sign & Execute Transaction (Bytes)</button>
            <button onClick={executeMoveCall}>Execute MoveCall (DevNet Mint Nft)</button>
            <button onClick={executeSerializedMoveCall}>Execute Serialized MoveCall (DevNet Mint Nft)</button>
            <button onClick={() => disconnectWallet()}>Disconnect</button>

            <br />
            <br />
            <div style={{ border: '1px solid #cccccc', flexDirection: 'column' }}>
              <pre><button onClick={customExecuteMoveCall}>Custom Execute MoveCall</button><button onClick={customExecuteSerializedMoveCall}>Custom Execute Serialized MoveCall</button></pre>
              <textarea
                rows={12}
                cols={80}
                value={JSON.stringify(moveCall, null, 4)}
                onChange={(e) => {
                  try {
                    setMoveCall(JSON.parse(e.target.value) as MoveCallTransaction)
                  } catch (error) {
                    console.log('[input] Custom Execute MoveCall error');
                  }
                }}
              />
            </div>
          </>
        ) : (
          <>
            <button onClick={() => connectWallet()}>Connect Wallet</button>
          </>
        )}
      </main>
    </div>
  );
}
