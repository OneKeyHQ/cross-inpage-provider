/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { dapps } from './dapps.config';
import ConnectButton from '../../../components/connect/ConnectButton';
import { useRef } from 'react';
import { get } from 'lodash';
import { IProviderApi, IProviderInfo } from './types';
import { ApiPayload, ApiGroup } from '../../ApiActuator';
import { useWallet } from '../../../components/connect/WalletContext';
import type { IKnownWallet } from '../../../components/connect/types';
import DappList from '../../../components/DAppList';
import params from './params';
// @ts-expect-error
import Schnorr from 'bcrypto/lib/schnorr';
import { toast } from '../../ui/use-toast';

export default function Example() {
  const walletsRef = useRef<IProviderInfo[]>([
    {
      uuid: 'injected',
      name: 'Injected Wallet',
      inject: 'nostr',
    },
    {
      uuid: 'injected-onekey',
      name: 'Injected OneKey',
      inject: '$onekey.nostr',
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
    const publicKey = await provider?.getPublicKey();

    return {
      provider,
      address: '',
      publicKey: publicKey,
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
          title="getPublicKey"
          description="获取账户权限"
          onExecute={async (request: string) => {
            const res = await provider?.getPublicKey();
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signEvent"
          description="signEvent"
          presupposeParams={params.signEvent}
          onExecute={async (request: string) => {
            const obj = JSON.parse(request);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const res = await provider?.signEvent(obj);
            return JSON.stringify(res);
          }}
        />
        <ApiPayload
          title="signSchnorr"
          description="signSchnorr"
          presupposeParams={params.signSchnorr}
          onExecute={async (request: string) => {
            const res = await provider?.signSchnorr(request);
            return res;
          }}
          onValidate={(request: string, result: string) => {
            const message = Buffer.from(request, 'hex');
            const publicKey = Buffer.from(account?.publicKey, 'hex');
            const signature = Buffer.from(result, 'hex');

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const isValid = Schnorr.verify(message, signature, publicKey);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return Promise.resolve(isValid.toString());
          }}
        />
        <ApiPayload
          title="nip04.encrypt and nip04.decrypt"
          description="nip04.encrypt"
          presupposeParams={params.nip04encrypt}
          onExecute={async (request: string) => {
            const pubkey = account?.publicKey;
            const encrypted = await provider.nip04.encrypt(pubkey, request);
            const decrypted = await provider.nip04.decrypt(pubkey, encrypted);
            return JSON.stringify(decrypted);
          }}
        />
        <ApiPayload
          title="nip04.encrypt "
          description="nip04.encrypt"
          presupposeParams={params.nip04encrypt}
          onExecute={async (request: string) => {
            const pubkey = account?.publicKey;
            const encrypted = await provider.nip04.encrypt(pubkey, request);
            return JSON.stringify(encrypted);
          }}
        />
      </ApiGroup>

      <DappList dapps={dapps} />
    </>
  );
}
