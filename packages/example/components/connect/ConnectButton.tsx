/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import type { IAccountInfo, IKnownWallet } from './types';
import { useWallet } from './WalletContext';
import { toast } from '../ui/use-toast';
import { get } from 'lodash';
import { useSettings } from '../../hooks/useSettings';

export type ConnectButtonProps<T> = {
  fetchWallets: () => Promise<IKnownWallet[]>;
  onConnect: (wallet: IKnownWallet) => Promise<
    {
      provider: T;
    } & Partial<IAccountInfo>
  >;
  onDisconnect?: () => Promise<void>;
};

const accountInfoKeys: Record<string, string> = {
  address: '地址',
  publicKey: '公钥',
  chainId: '网络',
};

export default function ConnectButton<T>({
  fetchWallets,
  onConnect,
  onDisconnect,
}: ConnectButtonProps<T>) {
  const { settings } = useSettings();
  const connectDialogRef = useRef<any>(null);
  const autoConnectedRef = useRef<boolean>(false);

  const [wallets, setWallets] = useState<IKnownWallet[]>([]);

  const { setProvider, setAccount, provider, account } = useWallet();

  const connectWallet = useCallback(
    async (wallet: IKnownWallet) => {
      try {
        const { provider: _provider, ...accountInfo } = await onConnect(wallet);
        setProvider(_provider);
        setAccount(accountInfo);
      } catch (error) {
        console.log('connectWallet error', error);

        toast({
          title: '连接失败',
          description: get(error, 'message', ''),
        });
      }
    },
    [onConnect, setAccount, setProvider],
  );

  const disconnectWallet = useCallback(async () => {
    autoConnectedRef.current = false;
    await onDisconnect?.();
    setProvider(null);
    setAccount(null);
  }, [onDisconnect, setAccount, setProvider]);

  const closeDialog = useCallback(() => {
    setTimeout(() => {
      try {
        connectDialogRef.current?.click();
      } catch (error) {
        // ignore
      }
    }, 150);
  }, []);

  const connectWalletWithDialog = useCallback(
    async (options?: { directConnection?: boolean }) => {
      const wallets = await fetchWallets?.();

      if (wallets?.length === 0) {
        closeDialog();
        return;
      }

      const { directConnection } = options ?? { directConnection: false };
      if (wallets?.length === 1 || (wallets?.length > 0 && directConnection)) {
        closeDialog();
        await connectWallet(wallets[0]);
      } else {
        setWallets(wallets);
      }
    },
    [closeDialog, connectWallet, fetchWallets],
  );

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (autoConnectedRef.current) return;

      console.log('settings.autoConnect', settings.autoConnect);
      if (settings.autoConnect) {
        autoConnectedRef.current = true;
        await connectWalletWithDialog({
          directConnection: true,
        });
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoConnect]);

  return (
    <Card>
      <CardContent className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-row flex-wrap justify-between">
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={() => connectWalletWithDialog()}>Connect Wallet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogClose ref={connectDialogRef} />
              <DialogHeader>
                <DialogTitle>选择钱包开始连接</DialogTitle>
                {!!wallets &&
                  wallets.map((wallet) => (
                    <DialogClose asChild key={wallet.id}>
                      <Button onClick={() => connectWallet(wallet)} className="gap-2">
                        {wallet.logo && (
                          <img
                            alt={wallet.name}
                            src={wallet.logo}
                            className="w-5 h-5 rounded-full"
                          />
                        )}
                        <span className="font-medium">{wallet.name}</span>
                      </Button>
                    </DialogClose>
                  ))}
                {!wallets ||
                  (wallets.length === 0 && (
                    <DialogDescription>
                      没有钱包可用，请安装 OneKey Extension
                      <a target="_blank" href={'https://www.onekey.so/download/'}>
                        Install OneKey Extension →
                      </a>
                    </DialogDescription>
                  ))}
              </DialogHeader>
            </DialogContent>
          </Dialog>
          {provider && (
            <Button variant="destructive" onClick={disconnectWallet}>
              断开链接
            </Button>
          )}
        </div>
        {account && (
          <div className="flex grid-cols-1 xl:grid-cols-2 flex-wrap gap-x-6 gap-y-3 mt-4">
            {Object.keys(account).map((key) => {
              return (
                <div key={key}>
                  <span>{`${accountInfoKeys?.[key] ?? key}`}: </span>
                  {/* @ts-expect-error */}
                  <span className="font-normal flex flex-wrap text-break">{`${account?.[key]}`}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
