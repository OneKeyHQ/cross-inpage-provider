import { useCallback, useRef, useState } from 'react';
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

export type ConnectButtonProps<T> = {
  fetchWallets: () => Promise<IKnownWallet[]>;
  onConnect: (wallet: IKnownWallet) => Promise<
    {
      provider: T;
    } & Partial<IAccountInfo>
  >;
  onDisconnect?: () => Promise<void>;
};

export default function ConnectButton<T>({
  fetchWallets,
  onConnect,
  onDisconnect,
}: ConnectButtonProps<T>) {
  const connectDialogRef = useRef<any>(null);

  const [wallets, setWallets] = useState<IKnownWallet[]>([]);

  const { setProvider, setAccount, provider, account } = useWallet();

  const connectWallet = useCallback(
    async (wallet: IKnownWallet) => {
      const { provider: _provider, ...accountInfo } = await onConnect(wallet);
      setProvider(_provider);
      setAccount(accountInfo);
    },
    [onConnect, setAccount, setProvider],
  );

  const disconnectWallet = useCallback(async () => {
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

  const connectWalletWithDialog = useCallback(async () => {
    const wallets = await fetchWallets?.();

    if (wallets?.length === 0) {
      closeDialog();
      return;
    }

    if (wallets?.length === 1) {
      closeDialog();
      await connectWallet(wallets[0]);
    } else {
      setWallets(wallets);
    }
  }, [closeDialog, connectWallet, fetchWallets]);

  return (
    <Card>
      <CardContent className="flex flex-col flex-wrap gap-3">
        <div className="flex flex-row flex-wrap justify-between">
          <Dialog>
            <DialogTrigger asChild>
              <Button onClick={connectWalletWithDialog}>Connect Wallet</Button>
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
          <div className="flex flex-row flex-wrap gap-4">
            {account?.address && (
              <>
                <span>地址:</span>
                <span>{account?.address}</span>
              </>
            )}
            {account?.publicKey && (
              <>
                <span>公钥:</span>
                <span>{account?.publicKey}</span>
              </>
            )}
            {account?.chainId && (
              <>
                <span>网络:</span>
                <span>{account?.chainId}</span>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
