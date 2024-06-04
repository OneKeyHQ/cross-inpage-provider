/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps, networks } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef, useState } from 'react';
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
import { signatureVerify, base58Decode, checkAddressChecksum } from '@polkadot/util-crypto';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { hexToU8a, stringToHex } from '@polkadot/util';
import params from './params';
import { toast } from '../../ui/use-toast';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  const [api, setApi] = useState<ApiPromise>();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
      if (!account?.address) {
        return;
      }
      const decoded = base58Decode(account?.address);
      const [isValid, endPos, ss58Length, ss58Decoded] = checkAddressChecksum(decoded);

      const networkInfo = networks.find((n) => n.addressPrefix === ss58Decoded);

      const wsProvider = new WsProvider(networkInfo.url);
      const api = await ApiPromise.create({ provider: wsProvider });
      setApi(api);
    })();
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

    const [account] = await provider.accounts.get();

    return {
      provider,
      address: account.address,
    };
  };

  const listenerRef = useRef<() => void>();
  useEffect(() => {
    if (!api) {
      return;
    }
    void web3AccountsSubscribe((accounts) => {
      console.log('polkadot web3AccountsSubscribe', accounts);
      
      if (accounts.length === 0) {
        return;
      }
      const [account] = accounts;
      setAccount({
        address: account.address,
        name: account.meta?.name,
        provider: provider,
      });
    }).then((listener) => {
      listenerRef.current = listener;
    });

    return () => {
      listenerRef.current?.();
    };
  }, [api, provider, setAccount]);

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

      <ApiGroup title="Basics">
        <ApiPayload
          title="Accounts Get"
          description="获取账户权限"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.accounts.get();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="SignRaw"
          description="签名消息"
          presupposeParams={params.signRaw}
          onExecute={async (request: string) => {
            const message = stringToHex(request);
            const [account] = await web3Accounts();
            const injector = await web3FromSource(account?.meta?.source);
            const res = await injector.signer.signRaw({
              data: message,
              address: account.address,
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
            return Promise.resolve(isValid.toString());
          }}
        />
        <ApiPayload
          title="SignAndSend"
          description="签名并发送交易"
          presupposeParams={params.signAndSend(account?.address || '')}
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
              api.tx.balances
                .transferKeepAlive(to, value)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                .signAndSend(account?.address, { signer: injector.signer }, (status) => {
                  resolve(JSON.stringify(status));
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
