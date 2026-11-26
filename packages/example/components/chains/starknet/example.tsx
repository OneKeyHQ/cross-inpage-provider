/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { useEffect, useRef } from 'react';
import { get } from 'lodash-es';
import ConnectButton from '../../connect/ConnectButton';
import { useWallet } from '../../connect/WalletContext';
import type { IKnownWallet } from '../../connect/types';
import { ApiGroup, ApiPayload } from '../../ApiActuator';
import { toast } from '../../ui/use-toast';

type IStarknetProviderApi = {
  id: string;
  name: string;
  version: string;
  request<T = unknown>(call: { type: string; params?: unknown }): Promise<T>;
  on(event: 'accountsChanged', handler: (accounts?: string[]) => void): void;
  on(event: 'networkChanged', handler: (chainId?: string, accounts?: string[]) => void): void;
  off(event: 'accountsChanged', handler: (accounts?: string[]) => void): void;
  off(event: 'networkChanged', handler: (chainId?: string, accounts?: string[]) => void): void;
};

type IProviderInfo = {
  uuid: string;
  name: string;
  inject: string;
};

const SAMPLE_TYPED_DATA = {
  types: {
    StarkNetDomain: [
      { name: 'name', type: 'felt' },
      { name: 'version', type: 'felt' },
      { name: 'chainId', type: 'felt' },
    ],
    Message: [{ name: 'content', type: 'felt' }],
  },
  primaryType: 'Message',
  domain: {
    name: 'OneKey Starknet Example',
    version: '1',
    chainId: 'SN_MAIN',
  },
  message: {
    content: 'Hello Starknet',
  },
};

export default function StarknetExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected-starknet-onekey',
      name: 'window.starknet_onekey (Wallet API v4)',
      inject: 'starknet_onekey',
    },
    {
      uuid: 'injected-onekey-starknet',
      name: 'window.$onekey.starknet',
      inject: '$onekey.starknet',
    },
  ]);

  const { provider, account, setAccount } = useWallet<IStarknetProviderApi>();

  useEffect(() => {
    if (!provider) return;
    const handleAccountsChanged = (accounts?: string[]) => {
      const next = accounts?.[0] ?? '';
      setAccount({ address: next, publicKey: next });
      toast({
        title: 'accountsChanged',
        description: JSON.stringify(accounts ?? []),
      });
    };
    const handleNetworkChanged = (chainId?: string, accounts?: string[]) => {
      toast({
        title: 'networkChanged',
        description: JSON.stringify({ chainId, accounts }),
      });
    };
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('networkChanged', handleNetworkChanged);
    return () => {
      provider.off('accountsChanged', handleAccountsChanged);
      provider.off('networkChanged', handleNetworkChanged);
    };
  }, [provider, setAccount]);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    const providerDetail = walletsRef.current.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }
    const injected = get(window, providerDetail.inject) as IStarknetProviderApi | undefined;
    if (!injected) {
      toast({
        title: 'Wallet not found',
        description: `window.${providerDetail.inject} is not available`,
      });
      return Promise.reject('Wallet not found');
    }
    const accounts = await injected.request<string[]>({
      type: 'wallet_requestAccounts',
      params: { silent_mode: false },
    });
    const address = accounts?.[0] ?? '';
    return {
      provider: injected,
      address,
      publicKey: address,
    };
  };

  return (
    <>
      <ConnectButton<IStarknetProviderApi>
        fetchWallets={() =>
          Promise.resolve(
            walletsRef.current.map((wallet) => ({
              id: wallet.uuid,
              name: wallet.name,
            })),
          )
        }
        onConnect={onConnectWallet}
      />

      <ApiGroup title="Discovery & Account">
        <ApiPayload
          title="wallet_supportedWalletApi"
          description="Query supported Starknet Wallet API versions"
          onExecute={() => provider?.request({ type: 'wallet_supportedWalletApi' })}
        />
        <ApiPayload
          title="wallet_supportedSpecs"
          description="Query supported Starknet JSON-RPC spec versions"
          onExecute={() => provider?.request({ type: 'wallet_supportedSpecs' })}
        />
        <ApiPayload
          title="wallet_getPermissions"
          description="Get granted permissions"
          onExecute={() => provider?.request({ type: 'wallet_getPermissions' })}
        />
        <ApiPayload
          title="wallet_requestChainId"
          description="Get connected Starknet chainId"
          onExecute={() => provider?.request({ type: 'wallet_requestChainId' })}
        />
        <ApiPayload
          title="wallet_deploymentData"
          description="Get counterfactual account deployment data (if undeployed)"
          onExecute={() => provider?.request({ type: 'wallet_deploymentData' })}
        />
      </ApiGroup>

      <ApiGroup title="Network">
        <ApiPayload
          title="Switch to Mainnet"
          description="wallet_switchStarknetChain (SN_MAIN)"
          onExecute={() =>
            provider?.request({
              type: 'wallet_switchStarknetChain',
              params: { chainId: '0x534e5f4d41494e' },
            })
          }
        />
        <ApiPayload
          title="Switch to Sepolia"
          description="wallet_switchStarknetChain (SN_SEPOLIA)"
          onExecute={() =>
            provider?.request({
              type: 'wallet_switchStarknetChain',
              params: { chainId: '0x534e5f5345504f4c4941' },
            })
          }
        />
      </ApiGroup>

      <ApiGroup title="Signing & Invoke">
        <ApiPayload
          title="wallet_signTypedData"
          description="Sign SNIP-12 TypedData"
          presupposeParams={[{ id: 'default', name: 'Sample TypedData', value: JSON.stringify(SAMPLE_TYPED_DATA, null, 2) }]}
          onExecute={(raw) =>
            provider?.request({
              type: 'wallet_signTypedData',
              params: raw ? JSON.parse(raw) : SAMPLE_TYPED_DATA,
            })
          }
        />
        <ApiPayload
          title="wallet_addInvokeTransaction"
          description="Send a 0-amount STRK self-transfer call"
          presupposeParams={[
            {
              id: 'self-transfer',
              name: '0 STRK self transfer',
              value: JSON.stringify(
                {
                  calls: [
                    {
                      contract_address:
                        '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
                      entry_point: 'transfer',
                      calldata: [account?.address || '0x1', '0x0', '0x0'],
                    },
                  ],
                },
                null,
                2,
              ),
            },
          ]}
          onExecute={(raw) =>
            provider?.request({
              type: 'wallet_addInvokeTransaction',
              params: raw ? JSON.parse(raw) : undefined,
            })
          }
        />
      </ApiGroup>
    </>
  );
}
