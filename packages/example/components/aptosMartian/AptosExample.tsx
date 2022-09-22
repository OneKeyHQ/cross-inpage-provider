import { useState, useEffect } from 'react';
import { ProviderAptosMartian } from '@onekeyfe/onekey-aptos-provider';
import { random } from 'lodash';


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
        window.martian = aptosProvider;
        setProvider(aptosProvider);
    }, []);

    return provider;
};

export default function App() {
    const provider = useProvider();

    const [network, setNetwork] = useState<string>('');
    const [connected, setConnected] = useState<boolean>(false);
    const [address, setAddress] = useState<string | null>(null);

    useEffect(() => {
        if (!provider) return;
        // try to eagerly connect
        // provider.connect().catch((err) => {
        //     err;
        //     // fail silently
        // });

        provider.onNetworkChange((network: string) => {
            setNetwork(network);
            console.log(`[onNetworkChange] ${network}`);
        });
        provider.onAccountChange((address: string | null) => {
            setAddress(address);
            if (address) {
                setConnected(true);
                console.log(`[onAccountChange] Switched account to ${address}`);
            } else {
                console.log('[onAccountChange] Switched unknown account');
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

            console.log('[connectWallet] account', account,network);
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
            function: "0x1::coin::transfer",
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            arguments: [address, 50]
        };
        const options = {
            max_gas_amount: "10000"
        }
        const res = await provider.generateTransaction(sender, payload, options);
        console.log('[generateTransaction]', res)
        return res;
    }

    const signAndSubmitTransaction = async () => {
        const txn = await generateTransaction()
        const res = await provider.signAndSubmitTransaction(txn)
        console.log('[signAndSubmitTransaction]', res)
    }

    const signTransaction = async () => {
        const txn = await generateTransaction()
        const res = await provider.signTransaction(txn)
        console.log('[signTransaction]', res)
        return res
    }
    
    const submitTransaction = async () => {
        const txn = await signTransaction()
        const res = await provider.submitTransaction(txn)
        console.log('[submitTransaction]', res)
    }

    const signGenericTransaction = async () => {
        const res = await provider.signGenericTransaction({
            func: "0x1::coin::transfer",
            args: [address, 500],
            type_args: ["0x1::aptos_coin::AptosCoin"]
        })
        console.log('[signGenericTransaction]', res)
    }

    const generateSignAndSubmitTransaction = async () => {
        const sender = address;
        const payload = {
            function: "0x1::coin::transfer",
            type_arguments: ["0x1::aptos_coin::AptosCoin"],
            arguments: [address, 50]
        };
        const res = await provider.generateSignAndSubmitTransaction(sender, payload)
        console.log('[generateSignAndSubmitTransaction]', res)
    }

    const signMessage = async () => {
        const res = await provider.signMessage({
            address: false,
            application: true,
            chainId: true,
            message: "This is a sample message",
            nonce: 12345,
          })
        console.log('[signMessage]', res)
    }

    const createCollection = async () => {
        const number = random(1, 100000, false)
        const res = await provider.createCollection(`ColName-${number}`, "CollectionDescription", "https://aptos.dev")
        console.log('[createCollection]', res)
    }
    
    const createToken = async () => {
        const number = random(1, 100000, false)
        const res = await provider.createToken(`ColName-${number}`, "TokenName", "TokenDescription", 1, "https://aptos.dev/img/nyan.jpeg", 1)
        console.log('[createToken]', res)
    }
    
    const getTransactions = async () => {   
        const res = await provider.getTransactions()
        console.log('[getTransactions]', res)
    }

    const getTransaction = async () => {   
        const res = await provider.getTransaction("0xbeb1f8c4e66bf0f58afca8c83338fd9a54490d46ce25fe9c8674b67f1e7bbd3a");
        console.log('[getTransaction]', res)
    }

    const getAccountTransactions = async () => {   
        const res = await provider.getAccountTransactions(address);
        console.log('[getAccountTransactions]', res)
    }

    const getAccountResources = async () => {   
        const res = await provider.getAccountResources(address);
        console.log('[getAccountResources]', res)
    }

    const getAccount = async () => {   
        const res = await provider.getAccount(address);
        console.log('[getAccount]', res)
    }

    const getChainId = async () => {   
        const res = await provider.getChainId();
        console.log('[getChainId]', res)
    }

    const getLedgerInfo = async () => {   
        const res = await provider.getLedgerInfo();
        console.log('[getLedgerInfo]', res)
    }

    return (
        <div>
            {!provider && <a target="_blank" href={'https://www.onekey.so/download/'}>Install OneKey Extension →</a>}
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
                        <button onClick={generateSignAndSubmitTransaction}>Generate Sign&Send Transaction </button>
                        <button onClick={signMessage}>Sign Message</button>
                        <button onClick={createCollection}>Create Collection</button>
                        <button onClick={createToken}>Create Token</button>
                        <button onClick={getTransactions}>Get Transactions</button>
                        <button onClick={getTransaction}>Get Transaction</button>
                        <button onClick={getAccountTransactions}>Get Account Transaction</button>
                        <button onClick={getAccountResources}>Get Account Resources</button>
                        <button onClick={getAccount}>Get Account</button>
                        <button onClick={getChainId}>Get ChainId</button>
                        <button onClick={getLedgerInfo}>Get LedgerInfo</button>
                        <button onClick={() => disconnectWallet()}>Disconnect</button>
                    </>
                ) : (
                    <>
                        <button onClick={() => connectWallet()}>Connect Wallet</button>
                    </>
                )}
            </main>
            <a
                target={'_blank'}
                href="https://codesandbox.io/s/github/phantom-labs/sandbox?file=/src/App.tsx"
            >
                Go to official test Dapp →
            </a>
        </div>
    );
}
