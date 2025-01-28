/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useEffect, useRef } from 'react';
import { get } from 'lodash';
import axios from 'axios';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { IProviderApi, IProviderInfo, SignMessageResponse } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import nacl from 'tweetnacl';
import { stripHexPrefix } from 'ethereumjs-util';
import { toast } from '../../ui/use-toast';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'aptos',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.aptos',
    },
  ]);

  const { provider, setAccount, account } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const providerDetail = walletsRef.current?.find((w) => w.uuid === selectedWallet.id);
    if (!providerDetail) {
      return Promise.reject('Wallet not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const provider = get(window, providerDetail.inject) as IProviderApi | undefined;

    if (!provider) {
      toast({
        title: 'Wallet not found',
        description: 'Please install the wallet extension',
      });
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, no-unsafe-optional-chaining
    const { address, publicKey } = await provider?.connect();

    const chainId = await provider?.network();

    return {
      provider,
      address,
      publicKey,
      chainId,
    };
  };

  useEffect(() => {
    if (!provider) return;

    // @ts-expect-error
    provider.onNetworkChange((network: { chainId: string; name: string; url: string } | null) => {
      console.log(`aptos [onNetworkChange] ${JSON.stringify(network)}`);

      if (!network) return;
      if (!network.chainId) return;

      setAccount({
        ...account,
        chainId: network?.chainId,
      });
    });
    // @ts-expect-error
    provider.onAccountChange((params: { address: string; publicKey: string } | null) => {
      console.log(`aptos [onAccountChange] ${JSON.stringify(params)}`);
      if (!params?.address) return;
      if (!params?.publicKey) return;

      setAccount({
        ...account,
        address: params.address,
        publicKey: params.publicKey,
      });
    });

    // @ts-expect-error
    provider.onDisconnect?.((params: { name: string | null } | null) => {
      console.log(`aptos [onDisconnect] ${JSON.stringify(params)}`);
    });
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
        onDisconnect={() => provider?.disconnect()}
      />

      <ApiGroup title="Basics">
        <ApiPayload
          title="connect"
          description="连接 Wallet"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.connect();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getNetwork"
          description="getNetwork"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getNetwork();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="getNetworkURL"
          description="getNetworkURL"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.getNetworkURL();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="isConnected"
          description="isConnected"
          disableRequestContent
          allowCallWithoutProvider
          // eslint-disable-next-line @typescript-eslint/require-await
          onExecute={async (request: string) => {
            const res = provider?.isConnected() ?? false;
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="account"
          description="当前账户"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.account();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="network"
          description="当前网络"
          disableRequestContent
          onExecute={async (request: string) => {
            const res = await provider?.network();
            return res;
          }}
        />
      </ApiGroup>

      <ApiGroup title="Transfer">
        <ApiPayload
          title="signMessage"
          description="signMessage"
          presupposeParams={params.signMessage}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signMessage(obj);
            return JSON.stringify(res);
          }}
          onValidate={(request: string, result: string) => {
            const { fullMessage, signature } = JSON.parse(result) as SignMessageResponse;

            const isValidSignature = nacl.sign.detached.verify(
              Buffer.from(fullMessage),
              hexToBytes(signature),
              hexToBytes(stripHexPrefix(account?.publicKey)),
            );

            return Promise.resolve(isValidSignature.toString());
          }}
        />
        <ApiPayload
          title="signTransaction"
          description="signTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signTransaction(obj);
            return res;
          }}
          onValidate={async (request: string, result: string) => {
            const jsonObject = JSON.parse(result);
            const buffer = new Uint8Array(jsonObject);

            const options = {
              method: 'POST',
              url: 'https://api.mainnet.aptoslabs.com/v1/transactions',
              headers: { 'Content-Type': 'application/x.aptos.signed_transaction+bcs' },
              data: buffer,
            };

            const res = await axios.request(options);

            console.log(res.data);
            return Promise.resolve(JSON.stringify(res.data));
          }}
        />
        <ApiPayload
          title="signAndSubmitTransaction"
          description="signAndSubmitTransaction"
          presupposeParams={params.signTransaction(account?.address ?? '')}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            const res = await provider?.signAndSubmitTransaction(obj);
            return JSON.stringify(res);
          }}
        />
        {/* <ApiPayload
          title="transferToken"
          description="代币转账"
          presupposeParams={params.transferToken(account?.address ?? '')}
          onExecute={async (request: string) => {
            const payload = JSON.parse(request);
            // 将amount转换为原子单位 (1 APT = 100000000 原子单位)
            const amount = Number(payload.arguments[1]) * 100000000;
            
            const transaction = {
              ...payload,
              arguments: [payload.arguments[0], amount.toString()],
            };

            const res = await provider?.signAndSubmitTransaction(transaction);
            return JSON.stringify(res);
          }}
        /> */}
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
