/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { dapps } from './dapps.config';
import ConnectButton from '../../connect/ConnectButton';
import { useEffect, useRef, useState } from 'react';
import { get } from 'lodash-es';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../connect/WalletContext';
import type { IKnownWallet } from '../../connect/types';
import DappList from '../../DAppList';
import params from './params';
import { toast } from '../../ui/use-toast';
import {
  buildPaymentTransaction,
  buildTrustTransaction,
  buildCreateAccountTransaction,
  fetchAccountSequence,
  getHorizonUrl,
} from './builder';
import { SwapStrictSend, SwapStrictReceive } from './SwapToken';
import { buildRealAuthEntry, buildTokenTransferAuthEntry, checkAccountExists } from './soroban';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

// Force TypeScript to re-check params type
type ParamsType = typeof params;

type NetworkInfo = { network: string; networkPassphrase: string };

const STELLAR_NETWORKS: Record<string, NetworkInfo> = {
  mainnet: {
    network: 'mainnet',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
  testnet: {
    network: 'testnet',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
};

const DEFAULT_NETWORK = STELLAR_NETWORKS.mainnet;

// Helper function to detect if wallet is Hana style
const isHanaWallet = (provider: IProviderApi): boolean => {
  return !provider.getAddress && !!provider.getPublicKey;
};

// Helper function to sign transaction with wallet compatibility
const signTransactionCompat = async (
  provider: IProviderApi,
  xdr: string,
  networkPassphrase: string,
): Promise<{ signedTxXdr: string }> => {
  if (isHanaWallet(provider)) {
    // Hana Wallet style
    const signedXdr = (await provider.signTransaction({
      xdr,
      networkPassphrase,
    })) as string;
    return { signedTxXdr: signedXdr };
  } else {
    // OneKey style
    return (await provider.signTransaction(xdr, {
      networkPassphrase,
    })) as { signedTxXdr: string };
  }
};

// Helper function to sign message with wallet compatibility
const signMessageCompat = async (
  provider: IProviderApi,
  message: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedMessage: string }> => {
  if (isHanaWallet(provider)) {
    // Hana Wallet style
    const signedMessage = (await provider.signMessage({
      message,
      accountToSign: opts?.address,
    })) as string;
    return { signedMessage };
  } else {
    // OneKey style
    return (await provider.signMessage(message, opts)) as { signedMessage: string };
  }
};

// Helper function to sign auth entry with wallet compatibility
const signAuthEntryCompat = async (
  provider: IProviderApi,
  authEntry: string,
  opts?: { networkPassphrase?: string; address?: string },
): Promise<{ signedAuthEntry: string }> => {
  if (isHanaWallet(provider)) {
    // Hana Wallet style
    const signedAuthEntry = (await provider.signAuthEntry({
      xdr: authEntry,
      accountToSign: opts?.address,
    })) as string;
    return { signedAuthEntry };
  } else {
    // OneKey style
    return (await provider.signAuthEntry(authEntry, opts)) as { signedAuthEntry: string };
  }
};

export default function StellarExample() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.stellar',
    },
    {
      uuid: 'injected-hana',
      name: 'Injected hanaWallet',
      inject: 'hanaWallet.stellar',
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('mainnet');
  const networkInfoRef = useRef({ ...DEFAULT_NETWORK });

  const handleNetworkChange = (network: string) => {
    setSelectedNetwork(network);
    networkInfoRef.current = STELLAR_NETWORKS[network];
  };

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

    // Get address from wallet - support both OneKey and Hana Wallet
    let address: string;
    if (provider.getAddress) {
      // OneKey style
      const result = await provider.getAddress();
      address = result.address;
    } else if (provider.getPublicKey) {
      // Hana Wallet style
      address = await provider.getPublicKey();
    } else {
      throw new Error('Wallet does not support getAddress or getPublicKey');
    }

    // Try to get network info, fallback to mainnet if not available
    let network = DEFAULT_NETWORK;
    try {
      if (provider.getNetwork) {
        network = await provider.getNetwork();
      }
    } catch (error) {
      console.warn('Failed to get network, using default mainnet:', error);
    }

    // Sync network info
    networkInfoRef.current = network;
    const matchedKey = Object.keys(STELLAR_NETWORKS).find(
      (k) => STELLAR_NETWORKS[k].networkPassphrase === network.networkPassphrase,
    );
    if (matchedKey) {
      setSelectedNetwork(matchedKey);
    }

    return {
      provider,
      address,
    };
  };

  const onDisconnectWallet = async () => {
    await provider?.disconnect();
  };

  useEffect(() => {
    if (!provider) return;

    const onAccountsChangedListener = (address: string | null) => {
      if (address) {
        console.log(`stellar [accountsChanged] Switched account to ${address}`);
        setAccount({
          ...account,
          address,
        });
      } else {
        console.log('stellar [accountsChanged] Account disconnected');
      }
    };

    const onDisconnectListener = () => {
      console.log('stellar [disconnect] 👋');
    };

    provider.on('accountsChanged', onAccountsChangedListener);
    provider.on('disconnect', onDisconnectListener);

    return () => {
      provider.removeListener('accountsChanged', onAccountsChangedListener);
      provider.removeListener('disconnect', onDisconnectListener);
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
        onDisconnect={onDisconnectWallet}
      />

      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-muted/30">
        <span className="text-sm font-medium whitespace-nowrap">Network:</span>
        <Select value={selectedNetwork} onValueChange={(v) => handleNetworkChange(v)}>
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mainnet">Mainnet (Public Global Stellar Network)</SelectItem>
            <SelectItem value="testnet">Testnet (Test SDF Network)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground truncate">
          {networkInfoRef.current.networkPassphrase}
        </span>
      </div>

      <ApiGroup title="Basics">
        <ApiPayload
          title="getAddress / getPublicKey"
          description="获取钱包地址（兼容 OneKey 和 Hana Wallet）"
          disableRequestContent
          onExecute={async () => {
            if (provider?.getAddress) {
              // OneKey style
              const res = await provider.getAddress();
              return JSON.stringify(res, null, 2);
            } else if (provider?.getPublicKey) {
              // Hana Wallet style
              const address = await provider.getPublicKey();
              return JSON.stringify({ address }, null, 2);
            } else {
              throw new Error('Wallet does not support getAddress or getPublicKey');
            }
          }}
        />

        <ApiPayload
          title="getNetwork"
          description="获取并更新当前网络信息（主网/测试网）"
          disableRequestContent
          onExecute={async () => {
            let res = DEFAULT_NETWORK;
            try {
              if (provider?.getNetwork) {
                res = await provider.getNetwork();
              }
            } catch (error) {
              console.warn('Failed to get network, using default mainnet:', error);
            }
            // Sync network info and UI
            networkInfoRef.current = res;
            const matchedKey = Object.keys(STELLAR_NETWORKS).find(
              (k) => STELLAR_NETWORKS[k].networkPassphrase === res.networkPassphrase,
            );
            if (matchedKey) {
              setSelectedNetwork(matchedKey);
            }
            return JSON.stringify(
              {
                ...res,
                tip: '网络信息已更新，后续签名将使用此 networkPassphrase',
              },
              null,
              2,
            );
          }}
        />

        <ApiPayload
          title="disconnect"
          description="断开钱包连接"
          disableRequestContent
          onExecute={async () => {
            await provider?.disconnect();
            handleNetworkChange('mainnet');
            return 'Disconnected successfully';
          }}
        />
      </ApiGroup>

      <ApiGroup title="Build & Sign Transactions">
        <ApiPayload
          title="Payment Transaction"
          description="构建并签名支付交易"
          presupposeParams={params.buildPayment(account?.address || '')}
          onExecute={async (request: string) => {
            const { sourceAddress, destinationAddress, amount, memo } = JSON.parse(request);

            const networkPassphrase = networkInfoRef.current.networkPassphrase;
            const effectiveSource = sourceAddress || account?.address || '';
            const sequence = await fetchAccountSequence(getHorizonUrl(networkPassphrase), effectiveSource);

            // Build transaction XDR
            const xdr = buildPaymentTransaction({
              sourceAddress: effectiveSource,
              destinationAddress,
              amount,
              memo,
              networkPassphrase,
              sequence,
            });

            // Sign transaction with wallet compatibility
            const res = await signTransactionCompat(provider, xdr, networkInfoRef.current.networkPassphrase);

            return JSON.stringify(
              {
                ...res,
                xdr: `${xdr.substring(0, 100)  }...`, // Show partial XDR for readability
              },
              null,
              2,
            );
          }}
        />

        <ApiPayload
          title="Trust Asset Transaction"
          description="构建并签名信任资产交易（添加自定义资产）"
          presupposeParams={params.buildTrust(account?.address || '')}
          onExecute={async (request: string) => {
            const { sourceAddress, assetCode, assetIssuer, limit } = JSON.parse(request);

            const networkPassphrase = networkInfoRef.current.networkPassphrase;
            const effectiveSource = sourceAddress || account?.address || '';
            const sequence = await fetchAccountSequence(getHorizonUrl(networkPassphrase), effectiveSource);

            // Build transaction XDR
            const xdr = buildTrustTransaction({
              sourceAddress: effectiveSource,
              assetCode,
              assetIssuer,
              limit,
              networkPassphrase,
              sequence,
            });

            // Sign transaction with wallet compatibility
            const res = await signTransactionCompat(provider, xdr, networkInfoRef.current.networkPassphrase);

            return JSON.stringify(
              {
                ...res,
                xdr: `${xdr.substring(0, 100)  }...`, // Show partial XDR for readability
              },
              null,
              2,
            );
          }}
        />

        <ApiPayload
          title="Create Account Transaction"
          description="构建并签名创建账户交易"
          presupposeParams={params.buildCreateAccount(account?.address || '')}
          onExecute={async (request: string) => {
            const { sourceAddress, destinationAddress, startingBalance } = JSON.parse(request);

            const networkPassphrase = networkInfoRef.current.networkPassphrase;
            const effectiveSource = sourceAddress || account?.address || '';
            const sequence = await fetchAccountSequence(getHorizonUrl(networkPassphrase), effectiveSource);

            // Build transaction XDR
            const xdr = buildCreateAccountTransaction({
              sourceAddress: effectiveSource,
              destinationAddress,
              startingBalance,
              networkPassphrase,
              sequence,
            });

            // Sign transaction with wallet compatibility
            const res = await signTransactionCompat(provider, xdr, networkInfoRef.current.networkPassphrase);

            return JSON.stringify(
              {
                ...res,
                xdr: `${xdr.substring(0, 100)  }...`, // Show partial XDR for readability
              },
              null,
              2,
            );
          }}
        />
      </ApiGroup>

      <ApiGroup title="Swap Token (Path Payment)">
        <SwapStrictSend networkPassphrase={networkInfoRef.current.networkPassphrase} />
        <SwapStrictReceive networkPassphrase={networkInfoRef.current.networkPassphrase} />
      </ApiGroup>

      <ApiGroup title="Sign Message">
        <ApiPayload
          title="signMessage"
          description="签名消息, 参考: https://docs.freighter.app/docs/playground/signmessage/"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const { message } = JSON.parse(request);
            const res = await signMessageCompat(provider, message);
            return JSON.stringify(res, null, 2);
          }}
        />
      </ApiGroup>

      <ApiGroup title="Soroban (Smart Contracts)">
        <ApiPayload
          title="signAuthEntry (Real - Balance Query)"
          description="真实的授权签名 - 通过RPC模拟获取（查询余额）"
          presupposeParams={params.signAuthEntryReal(account?.address || '')}
          onExecute={async (request: string) => {
            const { sourceAddress } = JSON.parse(request);
            const address = sourceAddress || account?.address || '';

            // Check if account exists on mainnet
            const accountExists = await checkAccountExists(address, networkInfoRef.current.networkPassphrase);
            if (!accountExists) {
              throw new Error(
                `账户 ${address} 在 ${networkInfoRef.current.network} 上不存在或未激活。`,
              );
            }

            // Build real auth entry via RPC simulation
            const { authEntries, simulationResult } = await buildRealAuthEntry({
              sourceAddress: address,
              networkPassphrase: networkInfoRef.current.networkPassphrase,
            });

            if (authEntries.length === 0) {
              return JSON.stringify(
                {
                  note: '此操作不需要授权签名（balance查询是公开的）',
                  simulation: simulationResult,
                },
                null,
                2,
              );
            }

            // Sign the first auth entry
            const authEntry = authEntries[0];
            const res = await signAuthEntryCompat(provider, authEntry, {
              networkPassphrase: networkInfoRef.current.networkPassphrase,
            });

            return JSON.stringify(
              {
                ...res,
                authEntryPreview: `${authEntry.substring(0, 100)  }...`,
                simulation: simulationResult,
                note: '这是通过 Stellar Mainnet RPC 真实模拟得到的授权条目',
              },
              null,
              2,
            );
          }}
        />

        <ApiPayload
          title="signAuthEntry (Real - Token Transfer)"
          description="真实的授权签名 - 通过RPC模拟获取（代币转账）"
          presupposeParams={params.signAuthEntryTransfer(account?.address || '')}
          onExecute={async (request: string) => {
            const { sourceAddress, destinationAddress, amount } = JSON.parse(request);
            const address = sourceAddress || account?.address || '';

            // Check if account exists on mainnet
            const accountExists = await checkAccountExists(address, networkInfoRef.current.networkPassphrase);
            if (!accountExists) {
              throw new Error(
                `账户 ${address} 在 ${networkInfoRef.current.network} 上不存在或未激活。`,
              );
            }

            // Build real auth entry for transfer via RPC simulation
            const { authEntries, simulationResult } = await buildTokenTransferAuthEntry({
              sourceAddress: address,
              destinationAddress,
              amount,
              networkPassphrase: networkInfoRef.current.networkPassphrase,
            });

            if (authEntries.length === 0) {
              throw new Error('模拟未返回授权条目，可能是合约调用参数错误');
            }

            // Sign all auth entries (usually just one)
            const signedEntries = [];
            for (const authEntry of authEntries) {
              console.log('authEntry', authEntry);
              const res = await signAuthEntryCompat(provider, authEntry, {
                networkPassphrase: networkInfoRef.current.networkPassphrase,
              });
              signedEntries.push(res);
            }

            return JSON.stringify(
              {
                signedAuthEntries: signedEntries,
                authEntriesCount: authEntries.length,
                authEntryPreview: `${authEntries[0].substring(0, 100)  }...`,
                simulation: simulationResult,
                note: '这是通过 Stellar Mainnet RPC 真实模拟得到的授权条目（转账操作需要授权）',
              },
              null,
              2,
            );
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
