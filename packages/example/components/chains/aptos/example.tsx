/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useRef } from 'react';
import { get } from 'lodash';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { IProviderApi, IProviderInfo, SignMessageResponse } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
import { SignMessagePayload } from '@onekeyfe/onekey-aptos-provider/dist/types';
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
  ]);

  const { provider, account } = useWallet<IProviderApi>();

  const onConnectWallet = async (selectedWallet: IKnownWallet) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
            const obj = JSON.parse(request) as SignMessagePayload;
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
            return JSON.stringify(res);
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
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
