/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { dapps } from './dapps.config';
import ConnectButton from '../../connect/ConnectButton';
import { useEffect, useRef } from 'react';
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
} from './builder';
import {
  buildRealAuthEntry,
  buildTokenTransferAuthEntry,
  checkAccountExists,
  MAINNET_NETWORK_PASSPHRASE,
} from './soroban';

// Force TypeScript to re-check params type
type ParamsType = typeof params;

// Default to mainnet if getNetwork is not available
const DEFAULT_NETWORK = {
  network: 'mainnet',
  networkPassphrase: 'Public Global Stellar Network ; September 2015',
};

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
  const networkInfoRef = useRef<{ network: string; networkPassphrase: string }>(DEFAULT_NETWORK);

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

    // Store network info for later use
    networkInfoRef.current = network;

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
            // Update network info for signing methods
            networkInfoRef.current = res;
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
            networkInfoRef.current = DEFAULT_NETWORK;
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

            // Build transaction XDR
            const xdr = buildPaymentTransaction({
              sourceAddress: sourceAddress || account?.address || '',
              destinationAddress,
              amount,
              memo,
              networkPassphrase: networkInfoRef.current.networkPassphrase,
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

            // Build transaction XDR
            const xdr = buildTrustTransaction({
              sourceAddress: sourceAddress || account?.address || '',
              assetCode,
              assetIssuer,
              limit,
              networkPassphrase: networkInfoRef.current.networkPassphrase,
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

            // Build transaction XDR
            const xdr = buildCreateAccountTransaction({
              sourceAddress: sourceAddress || account?.address || '',
              destinationAddress,
              startingBalance,
              networkPassphrase: networkInfoRef.current.networkPassphrase,
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
            const accountExists = await checkAccountExists(address);
            if (!accountExists) {
              throw new Error(
                `账户 ${address} 在主网上不存在或未激活。`,
              );
            }

            // Build real auth entry via RPC simulation
            const { authEntries, simulationResult } = await buildRealAuthEntry({
              sourceAddress: address,
              networkPassphrase: MAINNET_NETWORK_PASSPHRASE,
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
              networkPassphrase: MAINNET_NETWORK_PASSPHRASE,
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
            const accountExists = await checkAccountExists(address);
            if (!accountExists) {
              throw new Error(
                `账户 ${address} 在主网上不存在或未激活。`,
              );
            }

            // Build real auth entry for transfer via RPC simulation
            const { authEntries, simulationResult } = await buildTokenTransferAuthEntry({
              sourceAddress: address,
              destinationAddress,
              amount,
              networkPassphrase: MAINNET_NETWORK_PASSPHRASE,
            });

            if (authEntries.length === 0) {
              throw new Error('模拟未返回授权条目，可能是合约调用参数错误');
            }

            // Sign all auth entries (usually just one)
            const signedEntries = [];
            for (const authEntry of authEntries) {
              console.log('authEntry', authEntry);
              const res = await signAuthEntryCompat(provider, authEntry, {
                networkPassphrase: MAINNET_NETWORK_PASSPHRASE,
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
