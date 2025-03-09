import React, { useEffect, useRef, useState } from 'react';
import { get } from 'lodash';
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { toast } from '../../ui/use-toast';

declare global {
  interface Window {
    NEOLine?: {
      Init: new () => any;
    };
    NEOLineN3?: {
      Init: new () => any;
    };
  }
}

export default function NeoExample() {
  const [neolineLoaded, setNeolineLoaded] = useState(false);
  const [neolineN3Loaded, setNeolineN3Loaded] = useState(false);
  const neolineRef = useRef<any>(null);
  const neolineN3Ref = useRef<any>(null);

  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'NeoLine Wallet',
      inject: 'neolineN3',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.neo',
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  // Initialize NeoLine providers
  useEffect(() => {
    const initCommonDapi = new Promise<any>((resolve, reject) => {
      const handleNeoReady = () => {
        if (window.NEOLine && !neolineLoaded) {
          const neoline = new window.NEOLine.Init();
          if (neoline) {
            neolineRef.current = neoline;
            setNeolineLoaded(true);
            resolve(neoline);
          } else {
            reject('Common dAPI method failed to load.');
          }
        }
      };

      if (window.NEOLine) {
        handleNeoReady();
      } else {
        window.addEventListener('NEOLine.NEO.EVENT.READY', handleNeoReady);
      }

      return () => {
        window.removeEventListener('NEOLine.NEO.EVENT.READY', handleNeoReady);
      };
    });

    const initN3Dapi = new Promise<any>((resolve, reject) => {
      const handleN3Ready = () => {
        if (window.NEOLineN3 && !neolineN3Loaded) {
          const neolineN3 = new window.NEOLineN3.Init();
          if (neolineN3) {
            neolineN3Ref.current = neolineN3;
            setNeolineN3Loaded(true);
            resolve(neolineN3);
          } else {
            reject('N3 dAPI method failed to load.');
          }
        }
      };

      if (window.NEOLineN3) {
        handleN3Ready();
      } else {
        window.addEventListener('NEOLine.N3.EVENT.READY', handleN3Ready);
      }

      return () => {
        window.removeEventListener('NEOLine.N3.EVENT.READY', handleN3Ready);
      };
    });

    initCommonDapi
      .then(() => {
        console.log('The common dAPI method is loaded.');
        return initN3Dapi;
      })
      .then(() => {
        console.log('The N3 dAPI method is loaded.');
      })
      .catch((err) => {
        console.log(err);
      });
  }, [neolineLoaded, neolineN3Loaded]);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail?.inject || '') as IProviderApi | undefined;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return {
        provider: undefined as unknown as IProviderApi,
        address: '',
      };
    }

    const accounts = await provider?.requestAccounts();
    const network = await provider?.getNetwork();

    return {
      provider,
      address: accounts[0],
      chainId: network,
    };
  };

  useEffect(() => {
    const accountsChangedHandler = (accounts: string[]) => {
      console.log('neo [accountsChanged]', accounts);

      if (accounts.length) {
        setAccount({
          ...account,
          address: accounts[0],
        });
      }
    };

    const networkChangedHandler = (network: string) => {
      console.log('neo [networkChanged]', network);

      if (network) {
        setAccount({
          ...account,
          chainId: network,
        });
      }
    };

    provider?.on('accountsChanged', accountsChangedHandler);
    provider?.on('networkChanged', networkChangedHandler);

    return () => {
      provider?.removeListener('accountsChanged', accountsChangedHandler);
      provider?.removeListener('networkChanged', networkChangedHandler);
    };
  }, [account, provider, setAccount]);

  return (
    <>
      <ConnectButton<IProviderApi>
        fetchWallets={() => {
          return Promise.resolve(
            walletsRef.current.map((wallet) => {
              return {
                id: wallet.uuid,
                name: wallet.name,
              };
            }),
          );
        }}
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="requestAccounts"
          description="Request connection to wallet and get accounts"
          disableRequestContent
          allowCallWithoutProvider={true}
          onExecute={async () => {
            const res = await provider?.requestAccounts();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getAccounts"
          description="Get current account addresses"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getAccounts();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getProvider"
          description="Get provider information"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getProvider();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getNetwork"
          description="Get current network"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getNetwork();
            return res;
          }}
        />

        <ApiPayload
          title="switchNetwork"
          description="Switch current network"
          presupposeParams={params.switchNetwork}
          onExecute={async (request: string) => {
            const res = await provider?.switchNetwork(request);
            return res;
          }}
        />

        <ApiPayload
          title="getNetworks"
          description="Get available networks"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getNetworks();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getAccount"
          description="Get current account information"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getAccount();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getPublicKey"
          description="Get public key of current account"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.getPublicKey();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Read Methods">
        <ApiPayload
          title="getBalance"
          description="Get balance for an address"
          presupposeParams={params.getBalance}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.getBalance(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getStorage"
          description="Get storage value from a contract"
          presupposeParams={params.getStorage}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.getStorage(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getBlock"
          description="Get block information"
          presupposeParams={params.getBlock}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.getBlock(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getTransaction"
          description="Get transaction information"
          presupposeParams={params.getTransaction}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.getTransaction(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="getApplicationLog"
          description="Get application log for a transaction"
          presupposeParams={params.getApplicationLog}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.getApplicationLog(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="invokeRead"
          description="Execute a contract invocation in read-only mode"
          presupposeParams={params.invokeRead}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.invokeRead(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="invokeReadMulti"
          description="Execute multiple contract invocations in read-only mode"
          presupposeParams={params.invokeReadMulti}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.invokeReadMulti(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="verifyMessage"
          description="Verify a signed message"
          presupposeParams={params.verifyMessage}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.verifyMessage(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="pickAddress"
          description="Pick an address from the wallet"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.pickAddress();
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="AddressToScriptHash"
          description="Convert address to script hash"
          presupposeParams={params.addressToScriptHash}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.AddressToScriptHash(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="ScriptHashToAddress"
          description="Convert script hash to address"
          presupposeParams={params.scriptHashToAddress}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.ScriptHashToAddress(params);
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Write Methods">
        <ApiPayload
          title="send"
          description="Send NEO or GAS"
          presupposeParams={params.send}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.send(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="invoke"
          description="Invoke a contract"
          presupposeParams={params.invoke}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.invoke(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="invokeMultiple"
          description="Invoke multiple contracts"
          presupposeParams={params.invokeMultiple}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.invokeMultiple(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signMessage"
          description="Sign a message"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.signMessage(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signMessageV2"
          description="Sign a message (V2)"
          presupposeParams={params.signMessageV2}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.signMessageV2(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signMessageWithoutSalt"
          description="Sign a message without salt"
          presupposeParams={params.signMessageWithoutSalt}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.signMessageWithoutSalt(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="signTransaction"
          description="Sign a transaction"
          presupposeParams={params.signTransaction}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.signTransaction(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="switchWalletNetwork"
          description="Switch wallet network"
          presupposeParams={params.switchWalletNetwork}
          onExecute={async (request: string) => {
            const params = JSON.parse(request);
            const res = await provider?.switchWalletNetwork(params);
            return JSON.stringify(res);
          }}
        />

        <ApiPayload
          title="switchWalletAccount"
          description="Switch wallet account"
          disableRequestContent
          onExecute={async () => {
            const res = await provider?.switchWalletAccount();
            return JSON.stringify(res);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
