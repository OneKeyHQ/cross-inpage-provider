/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps, networks } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import {
  web3Accounts,
  web3AccountsSubscribe,
  web3Enable,
  web3FromSource,
} from '@polkadot/extension-dapp';
import { stringToU8a, u8aToHex, u8aToU8a, u8aWrapBytes } from '@polkadot/util';
import {
  signatureVerify,
  base58Decode,
  checkAddressChecksum,
  encodeAddress,
} from '@polkadot/util-crypto';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToU8a, stringToHex } from '@polkadot/util';
import params from './params';
import { toast } from '../../ui/use-toast';
import InfoLayout from '../../InfoLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  const [networkAddressPrefix, setNetworkAddressPrefix] = useState<number>();
  const [dynamicAddress, setDynamicAddress] = useState<string>('');

  const currentAddress = useMemo(() => {
    return account?.address;
  }, [account]);
  const currentNetworkAddressPrefix = useMemo(() => {
    return networkAddressPrefix;
  }, [networkAddressPrefix]);

  const apiRef = useRef<ApiPromise>();

  useEffect(() => {
    if (currentNetworkAddressPrefix !== undefined) {
      const networkInfo = networks.find((n) => n.addressPrefix === currentNetworkAddressPrefix);
      if (networkInfo) {
        const wsProvider = new WsProvider(networkInfo.url);
        const newApiProvider = new ApiPromise({ provider: wsProvider });

        console.log(
          'polkadot newApiProvider [useEffect]',
          currentNetworkAddressPrefix,
          networkInfo.url,
        );

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        newApiProvider.isReady.then(() => {
          apiRef.current = newApiProvider;
          return () => {
            void newApiProvider.disconnect();
            void wsProvider.disconnect();
          }; // 清理函数
        });
      }
    } else {
      console.log('polkadot newApiProvider [useEffect] undefined');
      apiRef.current = undefined;
    }
  }, [currentNetworkAddressPrefix]);

  useEffect(() => {
    console.log('polkadot [useEffect]', currentAddress, currentNetworkAddressPrefix);

    if (currentAddress && currentNetworkAddressPrefix != null) {
      const decoded = base58Decode(currentAddress);
      const [isValid, endPos, ss58Length, ss58Decoded] = checkAddressChecksum(decoded);

      const networkInfo = networks.find((n) => n.addressPrefix === currentNetworkAddressPrefix);

      if (!networkInfo) {
        return;
      }
      setDynamicAddress(
        encodeAddress(decoded.subarray(ss58Length, endPos), networkInfo.addressPrefix),
      );
    } else {
      setDynamicAddress(undefined);
    }
  }, [currentAddress, currentNetworkAddressPrefix]);

  useEffect(() => {
    if (!account?.address) {
      return;
    }
    const decoded = base58Decode(account?.address);
    const [isValid, endPos, ss58Length, ss58Decoded] = checkAddressChecksum(decoded);

    const networkInfo = networks.find((n) => n.addressPrefix === ss58Decoded);
    setNetworkAddressPrefix(networkInfo.addressPrefix);
  }, [account?.address, provider]);

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    const provider = providerDetail.provider;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

    const accounts = await provider?.accounts?.get();

    console.log('polkadot [connect wallet]', accounts?.[0]?.address);

    const account = accounts?.[0];
    return {
      provider,
      address: account?.address ?? '',
      name: account?.name ?? '',
      type: account?.type ?? '',
    };
  };

  const listenerRef = useRef<() => void>();
  useEffect(() => {
    if (!provider) {
      return;
    }
    void web3AccountsSubscribe((accounts) => {
      console.log('polkadot [web3AccountsSubscribe]', accounts);

      if (accounts.length === 0) {
        return;
      }
      const [account] = accounts;
      setAccount({
        address: account?.address,
        // @ts-expect-error
        name: account?.name,
        type: account?.type ?? '',
      });
    }).then((listener) => {
      listenerRef.current = listener;
    });

    return () => {
      listenerRef.current?.();
    };
  }, [provider, setAccount]);

  return (
    <>
      <ConnectButton<IProviderApi>
        fetchWallets={async () => {
          const allInjected = await web3Enable('Test Dapp');

          walletsRef.current = allInjected.map((injected) => ({
            uuid: injected.name,
            name: injected.name,
            provider: injected,
          }));

          console.log('walletsRef.current', walletsRef.current);

          return walletsRef.current.map((wallet) => {
            return {
              id: wallet.uuid,
              name: wallet.name,
            };
          });
        }}
        onConnect={onConnectWallet}
      />

      <InfoLayout title="该内容是动态计算的">
        <p>只链接 Dot 账户即可，在这个切换不同网络即可发送不同网络的资产。</p>
        <Select
          value={networkAddressPrefix?.toString()}
          onValueChange={(addressPrefix) => {
            const chain = networks.find(
              (chain) => chain.addressPrefix.toString() === addressPrefix,
            );
            setNetworkAddressPrefix(chain?.addressPrefix);
          }}
        >
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Change Polkadot Network" />
          </SelectTrigger>
          <SelectContent>
            {networks.map((chain) => (
              <SelectItem key={chain.name} value={chain.addressPrefix.toString()}>
                <span className="font-medium">{chain.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {dynamicAddress && <p>地址: {dynamicAddress}</p>}
      </InfoLayout>

      <ApiGroup title="Basics">
        <ApiPayload
          title="accounts.get"
          description="获取账户权限"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.accounts.get();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="accounts.get (Manta dApp)"
          description="Test Manta Connect (dApp)"
          disableRequestContent
          onExecute={async (request: string) => {
            // serialization provider
            JSON.stringify(provider)
            // get accounts
            const localProvider = provider
            const accountProvider = localProvider?.accounts
            const res = await accountProvider?.get();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signRaw"
          description="签名消息"
          presupposeParams={params.signRaw}
          onExecute={async (request: string) => {
            const message = stringToHex(request);
            const [account] = await web3Accounts();
            const injector = await web3FromSource(account?.meta?.source);
            const res = await injector.signer.signRaw({
              data: message,
              address: currentAddress,
              type: 'bytes',
            });
            return JSON.stringify(res);
          }}
          onValidate={(request: string, result: string) => {
            const message = stringToU8a(request);
            const {
              signature,
            }: {
              signature: string;
            } = JSON.parse(result);

            const { isValid } = signatureVerify(
              Buffer.from(u8aToU8a(u8aWrapBytes(message))),
              signature,
              account.address,
            );
            return Promise.resolve(isValid);
          }}
        />
        <ApiPayload
          title="signPayload"
          description="签名并发送交易"
          presupposeParams={params.signAndSend(dynamicAddress || '')}
          onExecute={async (request: string) => {
            const {
              to,
              value,
            }: {
              to: string;
              value: string;
            } = JSON.parse(request);

            const [account] = await web3Accounts();
            const injector = await web3FromSource(account?.meta?.source);

            return new Promise((resolve, reject) => {
              apiRef.current.tx.balances
                .transferKeepAlive(to, value)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                .signAndSend(currentAddress, { signer: injector.signer }, (status) => {
                  resolve(status);
                })
                .catch((e) => {
                  reject(e);
                });
            });
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
