import React from 'react';
import { useState, useEffect } from 'react';
import { ProviderAptosMartian } from '@onekeyfe/onekey-aptos-provider';
import { random } from 'lodash';

import { DAppList } from '../dappList/DAppList';
import { dapps } from '../aptos/dapps.config';
import { HexString, TxnBuilderTypes, BCS } from "aptos";
import { TxnPayload } from '@onekeyfe/onekey-aptos-provider/dist/types';

declare global {
  interface Window {
    // @ts-expect-error
    martian: ProviderAptosMartian;
  }
}

const useProvider = () => {
  const [provider, setProvider] = useState<ProviderAptosMartian>();

  useEffect(() => {
    console.log('useProvider', window.martian);

    const injectedProvider = window.martian as ProviderAptosMartian;
    const aptosProvider =
      injectedProvider ||
      new ProviderAptosMartian({
        // use mock api provider bridge for development
        // bridge: new CustomBridge(),
      });
    setProvider(aptosProvider);
  }, []);

  return provider;
};

export default function App() {
  const provider = useProvider();

  const [network, setNetwork] = useState<string>('');
  const [connected, setConnected] = useState<boolean>(false);
  const [address, setAddress] = useState<string | null>(null);
  const [collectionName, setCollectionName] = useState<string>('OneKey-Collection');
  const [nftTokenName, setNftTokenName] = useState<string>('OneKey-NFT-1');

  useEffect(() => {
    if (!provider) return;
    // try to eagerly connect
    // provider.connect().catch((err) => {
    //     err;
    //     // fail silently
    // });

    provider.onNetworkChange((network: string) => {
      setNetwork(network);
      console.log(`aptos [onNetworkChange] ${network}`);
    });
    provider.onAccountChange((address: string | null) => {
      setAddress(address);
      if (address) {
        setConnected(true);
        console.log(`aptos [onAccountChange] Switched account to ${address}`);
      } else {
        setConnected(false);
        console.log('aptos [onAccountChange] Switched unknown account');
        // In this case, dapps could not to anything, or,
        // Only re-connecting to the new account if it is trusted
        // provider.connect({ onlyIfTrusted: true }).catch((err) => {
        //   // fail silently
        // });
        // Or, always trying to reconnect
        provider
          .connect()
          .then(() => console.log('[accountChanged] Reconnected successfully'))
          .catch((err: Error) => {
            console.log(`[accountChanged] Failed to re-connect: ${err.message}`);
          });
      }
    });
    return () => {
      void provider.disconnect();
    };
  }, [provider]);

  if (!provider) {
    return <h2>Could not find a provider</h2>;
  }

  const connectWallet = async () => {
    try {
      const account = await provider.connect();
      const network = await provider.network();

      setAddress(account.address);
      setNetwork(network);
      setConnected(true);

      console.log('[connectWallet] account', account, network);
    } catch (err) {
      console.warn(err);
      console.log(`[error] connect: ${JSON.stringify(err)}`);
    }
  };

  const disconnectWallet = async () => {
    try {
      await provider.disconnect();
    } catch (err) {
      console.warn(err);
      console.log(`[error] disconnect: ${JSON.stringify(err)}`);
    }
  };

  const generateTransaction = async () => {
    const sender = address;
    const payload = {
      function: '0x1::coin::transfer',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [address, 50],
    };
    const options = {
      max_gas_amount: '10000',
    };
    const res = await provider.generateTransaction(sender, payload, options);
    console.log('[generateTransaction]', res);
    return res;
  };

  const signAndSubmitTransaction = async () => {
    const txn = await generateTransaction();
    const res = await provider.signAndSubmitTransaction(txn);
    console.log('[signAndSubmitTransaction]', res);
  };

  const signTransaction = async () => {
    const txn = await generateTransaction();
    const res = await provider.signTransaction(txn);
    console.log('[signTransaction]', res);
    return res;
  };

  const submitTransaction = async () => {
    const txn = await signTransaction();
    const res = await provider.submitTransaction(txn);
    console.log('[submitTransaction]', res);
  };

  const signGenericTransaction = async () => {
    const res = await provider.signGenericTransaction({
      func: '0x1::coin::transfer',
      args: [address, 500],
      type_args: ['0x1::aptos_coin::AptosCoin'],
    });
    console.log('[signGenericTransaction]', res);
  };

  const generateSignAndSubmitTransaction = async () => {
    const sender = address;
    const payload = {
      function: '0x1::coin::transfer',
      type_arguments: ['0x1::aptos_coin::AptosCoin'],
      arguments: [address, 50],
    };
    const res = await provider.generateSignAndSubmitTransaction(sender, payload);
    console.log('[generateSignAndSubmitTransaction]', res);
  };

  const signMessage = async () => {
    const res = await provider.signMessage({
      address: false,
      application: true,
      chainId: true,
      message: 'This is a sample message',
      nonce: 12345,
    });
    console.log('[signMessage]', res);
  };

  const createCollection = async () => {
    const res = await provider.createCollection(
      collectionName,
      'CollectionDescription',
      'https://aptos.dev',
    );
    console.log('[createCollection]', res);
  };

  const createToken = async () => {
    const res = await provider.createToken(
      collectionName,
      nftTokenName,
      'TokenDescription',
      1,
      'https://aptos.dev/img/nyan.jpeg',
      1,
    );
    console.log('[createToken]', res);
  };

  const getTransactions = async () => {
    const res = await provider.getTransactions();
    console.log('[getTransactions]', res);
  };

  const getTransaction = async () => {
    const res = await provider.getTransaction(
      '0x407c189992aa2b5a25b3645a3dc6a8b5c9ec2792d214ab9a04b7acc6b7465a00',
    );
    console.log('[getTransaction]', res);
  };

  const getAccountTransactions = async () => {
    const res = await provider.getAccountTransactions(address);
    console.log('[getAccountTransactions]', res);
  };

  const getAccountResources = async () => {
    const res = await provider.getAccountResources(address);
    console.log('[getAccountResources]', res);
  };

  const getAccount = async () => {
    const res = await provider.getAccount(address);
    console.log('[getAccount]', res);
  };

  const getChainId = async () => {
    const res = await provider.getChainId();
    console.log('[getChainId]', res);
  };

  const getLedgerInfo = async () => {
    const res = await provider.getLedgerInfo();
    console.log('[getLedgerInfo]', res);
  };

  const msafeMultiSignature = async () => {
    const addressFormat = (addr: string) => TxnBuilderTypes.AccountAddress.fromHex(addr);
    const testMsafe = '0xaa90e0d9d16b63ba4a289fb0dc8d1b454058b21c9b5c76864f825d5c1f32582e';

    const serializer = new BCS.Serializer();
    const owners = [
      "0x5c7b342e9ee2e582ad16fb602e8ebb6ba39b3bfa02a4fd3865853b10dc75765f",
      "0xa3f6a53c57395401ce64f09a188e2259dc9b156387e76c88a7a80a8fe5254476",
    ];
    BCS.serializeVector(
      owners.map((owner) => addressFormat(owner)),
      serializer
    );

    const payload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
      TxnBuilderTypes.EntryFunction.natural(
        `0xaa90e0d9d16b63ba4a289fb0dc8d1b454058b21c9b5c76864f825d5c1f32582e::creator`,
        "init_wallet_creation",
        [],
        [
          serializer.getBytes(),
          BCS.bcsSerializeU8(2),
          BCS.bcsSerializeUint64(10000000),
          BCS.bcsSerializeBytes(
            new HexString(
              "b5e97db07fa0bd0e5598aa3643a9bc6f6693bddc1a9fec9e674a461eaa00b193a527b6487c9ba480a3dbfbc351a3fcafd0a5044a0b3c877f759fa5df64a692f1000000000000000002aa90e0d9d16b63ba4a289fb0dc8d1b454058b21c9b5c76864f825d5c1f32582e0d6d6f6d656e74756d5f7361666508726567697374657200010c0b77616c6c6574206e616d65e02e0000000000007800000000000000fa7984630000000001"
            ).toUint8Array()
          ),
          BCS.bcsSerializeBytes(
            new HexString(
              "fc284900723375e6b087a166c04edf6a1b71a361ad671608a849b733a878aaf910150dcf28e0f197675137abb328db6b55a6d98bee53413ad49c16549c1f0701"
            ).toUint8Array()
          ),
        ]
      )
    );

    const sn = await provider.getAccount(testMsafe).then(acc => BigInt(acc.sequence_number) + BigInt(1))

    const testTxn = new TxnBuilderTypes.RawTransaction(
      TxnBuilderTypes.AccountAddress.fromHex(testMsafe),
      sn,
      payload,
      BigInt(20123),
      BigInt(123),
      BigInt(1793884475),
      new TxnBuilderTypes.ChainId(1)
    );
    const bcsUnsignedTxn = BCS.bcsToBytes(testTxn);
    //@ts-expect-error
    const res: string = await provider.signTransaction(HexString.fromUint8Array(bcsUnsignedTxn).noPrefix());
    const bcsSignedTxn = Uint8Array.from(res.split(",").map((s) => Number(s)));
    const signedTransaction = TxnBuilderTypes.SignedTransaction.deserialize(
      new BCS.Deserializer(bcsSignedTxn)
    );

    console.log('[msafeMultiSignature] success ', JSON.stringify(signedTransaction, (key, value) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      typeof value === 'bigint'
        ? value.toString()
        : value
    ));
  };


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
              <pre>Network: {network}</pre>
              <pre>Connected as: {address}</pre>
            </div>
            <button onClick={generateTransaction}>Generate Transaction</button>
            <button onClick={signAndSubmitTransaction}>Sign&Send Transaction</button>
            <button onClick={signTransaction}>Sign Transaction </button>
            <button onClick={submitTransaction}>Submit Transaction </button>
            <button onClick={signGenericTransaction}>Sign Generic Transaction </button>
            <button onClick={generateSignAndSubmitTransaction}>
              Generate Sign&Send Transaction{' '}
            </button>
            <button onClick={signMessage}>Sign Message</button>
            <button onClick={getTransactions}>Get Transactions</button>
            <button onClick={getTransaction}>Get Transaction</button>
            <button onClick={getAccountTransactions}>Get Account Transaction</button>
            <button onClick={getAccountResources}>Get Account Resources</button>
            <button onClick={getAccount}>Get Account</button>
            <button onClick={getChainId}>Get ChainId</button>
            <button onClick={getLedgerInfo}>Get LedgerInfo</button>
            <button onClick={() => disconnectWallet()}>Disconnect</button>

            <br />
            <br />
            <div style={{ border: '1px solid #cccccc', flexDirection: 'column' }}>
              <pre>Collection Name: <input
                type="text"
                placeholder="Collection Name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              /> 不能重名，要改名字。</pre>
              <pre><button onClick={createCollection}>Create Collection</button></pre>
            </div>

            <br />
            <div style={{ border: '1px solid #cccccc', flexDirection: 'column' }}>
              <pre>Collection Name: <input
                type="text"
                placeholder="Collection Name"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
              /> 指定链上已经存在的 Collection Name。</pre>
              <pre>NFT Name: <input
                type="text"
                placeholder="Token Name"
                value={nftTokenName}
                onChange={(e) => setNftTokenName(e.target.value)}
              /> NFT Name 不能重名，要改名字。</pre>
              <pre><button onClick={createToken}>Create Token</button></pre>
            </div>

            <br />
            <div style={{ border: '1px solid #cccccc', flexDirection: 'column' }}>
              Msafe Multi-signature Demo (Mainnet)
              <pre><button onClick={msafeMultiSignature}>Sign Transaction</button></pre>
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
