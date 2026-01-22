import { useEffect, useRef, useState } from 'react';
import { getWallets } from '@wallet-standard/app';
import type { Wallet, WalletAccount } from '@wallet-standard/base';
import { Button } from '../../ui/button';
import { Checkbox } from '../../ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader } from '../../ui/card';

type DetectedWallet = {
  id?: string;
  name: string;
  version: string;
  standard?: string;
  url?: string;
  icon?: string;
  chains: string[];
  features: string[];
  extensions?: unknown;
  accounts: { address: string; chains: string[]; label?: string }[];
  raw: Record<string, unknown>;
  rawKeys: string[];
};

const serializeValue = (value: unknown): unknown => {
  if (typeof value === 'function') return '[function]';
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serializeValue(v)]));
  }
  return value ?? null;
};

const toDetectedWallet = (wallet: Wallet): DetectedWallet => {
  const raw = serializeValue(wallet) as Record<string, unknown>;

  return {
    id: (wallet as unknown as { id?: string }).id,
    name: wallet.name,
    version: wallet.version,
    standard: (wallet as unknown as { standard?: string }).standard,
    url: (wallet as unknown as { url?: string }).url,
    icon: (wallet as unknown as { icon?: string }).icon,
    chains: wallet.chains ? [...wallet.chains] : [],
    features: Object.keys(wallet.features ?? {}),
    extensions: (wallet as unknown as { extensions?: unknown }).extensions,
    accounts:
      wallet.accounts?.map((account: WalletAccount) => ({
        address: account.address,
        chains: account.chains ? [...account.chains] : [],
        label: account.label,
      })) ?? [],
    raw,
    rawKeys: Object.keys(raw),
  };
};


export function DetectionStandardWallet() {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [lastEvent, setLastEvent] = useState<string>('init');
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [showRawKeys, setShowRawKeys] = useState<boolean>(false);
  const [showFullIcon, setShowFullIcon] = useState<boolean>(false);
  const walletsRef = useRef<ReturnType<typeof getWallets>>();

  useEffect(() => {
    const walletsApi = getWallets();
    walletsRef.current = walletsApi;

    const syncWallets = () => {
      const detected = walletsApi.get().map(toDetectedWallet);
      setWallets(detected);
      console.log('[wallet-standard] 当前检测到的钱包 =>', detected);
    };

    syncWallets();

    const offRegister = walletsApi.on('register', (...registeredWallets: Wallet[]) => {
      const names = registeredWallets.map((w: Wallet) => w.name).join(', ') || 'unknown';
      setLastEvent(`register: ${names}`);
      console.log('[wallet-standard] register', registeredWallets);
      syncWallets();
    });

    const offUnregister = walletsApi.on('unregister', (...unregisteredWallets: Wallet[]) => {
      const names = unregisteredWallets.map((w: Wallet) => w.name).join(', ') || 'unknown';
      setLastEvent(`unregister: ${names}`);
      console.log('[wallet-standard] unregister', unregisteredWallets);
      syncWallets();
    });

    return () => {
      offRegister();
      offUnregister();
    };
  }, []);

  const handleDetect = () => {
    const walletsApi = walletsRef.current ?? getWallets();
    const detected = walletsApi.get().map(toDetectedWallet);
    setWallets(detected);
    setLastEvent('manual-detect');
    console.log('[wallet-standard] 手动探测结果 =>', detected);
  };

  const displayWallets = wallets.map((wallet) => {
    const { raw, rawKeys, icon, ...rest } = wallet;
    const iconDisplay =
      !icon || showFullIcon || icon.length <= 10 ? icon : `${icon.slice(0, 40)}...`;

    return {
      ...rest,
      icon: iconDisplay,
      ...(showRaw ? { raw } : {}),
      ...(showRawKeys ? { rawKeys } : {}),
    };
  });

  return (
    <Card>
      <CardHeader className="text-xl font-medium">探测所有 Standard Wallet</CardHeader>
      <CardDescription>基于 @wallet-standard/app，跨链扫描已注册的钱包</CardDescription>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDetect}>手动探测并打印</Button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Checkbox checked={showRaw} onCheckedChange={(v) => setShowRaw(Boolean(v))} />
            <span>显示 raw</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Checkbox checked={showRawKeys} onCheckedChange={(v) => setShowRawKeys(Boolean(v))} />
            <span>显示 rawKeys</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <Checkbox checked={showFullIcon} onCheckedChange={(v) => setShowFullIcon(Boolean(v))} />
            <span>显示完整 icon（默认截断）</span>
          </label>
        </div>

        <div className="text-sm text-gray-500">最近事件：{lastEvent}</div>

        <pre className="bg-gray-100 dark:bg-gray-800 text-xs p-3 rounded whitespace-pre-wrap break-all">
          {wallets.length ? JSON.stringify(displayWallets, null, 2) : '暂无探测结果'}
        </pre>
      </CardContent>
    </Card>
  );
}

export default DetectionStandardWallet;