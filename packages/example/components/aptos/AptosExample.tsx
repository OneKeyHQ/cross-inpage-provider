import React from 'react';
import { useState, useEffect } from 'react';
import { ProviderAptos } from '@onekeyfe/onekey-aptos-provider';


declare global {
    interface Window {
        // @ts-expect-error
        aptos: ProviderAptos;
    }
}

const useProvider = () => {
    const [provider, setProvider] = useState<ProviderAptos>();

    useEffect(() => {
        const injectedProvider = window.aptos as ProviderAptos;
        const aptosProvider =
            injectedProvider ||
            new ProviderAptos({
                // use mock api provider bridge for development
                // bridge: new CustomBridge(),
            });
        window.aptos = aptosProvider;
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

        provider.on('connect', (address: string) => {
            setConnected(true);
            setAddress(address);
            console.log(`[connect] ${address}`);
        });
        provider.on('disconnect', () => {
            setAddress(null);
            setConnected(false);
            console.log('[disconnect] 👋');
        });
        provider.on('networkChange', (network: string) => {
            setNetwork(network);
            console.log(`[networkChange] ${network}`);
        });
        provider.on('accountChanged', (network: string) => {
            setAddress(address);
            setConnected(address ? true : false);
            console.log(`[accountChange] ${network}`);
        });
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

    const signAndSubmitTransaction = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const res = await provider.signAndSubmitTransaction({
            arguments: [address, '100000'],
            function: '0x1::coin::transfer',
            type: 'entry_function_payload',
            type_arguments: ['0x1::aptos_coin::AptosCoin'],
        })
        console.log('[signTransaction]', res)
    }

    const signTransaction = async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const res = await provider.signTransaction({
            arguments: [address, '100000'],
            function: '0x1::coin::transfer',
            type: 'entry_function_payload',
            type_arguments: ['0x1::aptos_coin::AptosCoin'],
        })
        console.log('[signTransaction]', res)
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
                        <button onClick={signAndSubmitTransaction}>Sign&Send Transaction</button>
                        <button onClick={signTransaction}>Sign Transaction </button>
                        <button onClick={signMessage}>Sign Message</button>
                        <button onClick={() => disconnectWallet()}>Disconnect</button>
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
