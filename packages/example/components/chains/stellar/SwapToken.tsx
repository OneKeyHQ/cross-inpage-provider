/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ApiForm } from '../../ApiForm';
import { IProviderApi } from './types';
import { useWallet } from '../../connect/WalletContext';
import {
  buildPathPaymentStrictSendTransaction,
  buildPathPaymentStrictReceiveTransaction,
} from './builder';

interface StellarAsset {
  code: string;
  issuer: string;
  label: string;
}

const MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

// Mainnet tokens
const MAINNET_ASSETS: StellarAsset[] = [
  { code: 'XLM', issuer: '', label: 'XLM (Stellar Lumens)' },
  { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', label: 'USDC (Centre)' },
  { code: 'AQUA', issuer: 'GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA', label: 'AQUA (Aquarius)' },
  { code: 'PYUSD', issuer: 'GDQE7IXJ4HUHV6RQHIUPRJSEZE4DRS5WY577O2FY6YQ5LVWZ7JZTU2V5', label: 'PYUSD (PayPal USD)' },
];

// Testnet tokens (official Circle-issued test tokens)
const TESTNET_ASSETS: StellarAsset[] = [
  { code: 'XLM', issuer: '', label: 'XLM (Stellar Lumens)' },
  { code: 'USDC', issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5', label: 'USDC (Circle Testnet)' },
  { code: 'EURC', issuer: 'GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO', label: 'EURC (Circle Testnet)' },
  { code: 'SRT', issuer: 'GCDNJUBQSX7AJWLJACMJ7I4BC3Z47BQUTMHEICZLE6MU4KQBRYG5JY6B', label: 'SRT (Stellar Reward Token)' },
];

function toAssetOptions(assets: StellarAsset[]) {
  return assets.map((a) => ({
    value: a.issuer ? `${a.code}:${a.issuer}` : a.code,
    label: a.label,
  }));
}

function getAssetOptions(networkPassphrase: string) {
  const assets = networkPassphrase === MAINNET_PASSPHRASE ? MAINNET_ASSETS : TESTNET_ASSETS;
  return toAssetOptions(assets);
}

function parseAssetValue(value: string): { code: string; issuer: string } {
  const idx = value.indexOf(':');
  if (idx === -1) return { code: value, issuer: '' };
  return { code: value.substring(0, idx), issuer: value.substring(idx + 1) };
}

const MAINNET_HORIZON = 'https://horizon.stellar.org';
const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';

function getHorizonUrl(networkPassphrase: string) {
  return networkPassphrase === MAINNET_PASSPHRASE ? MAINNET_HORIZON : TESTNET_HORIZON;
}

function buildAssetParams(prefix: string, asset: { code: string; issuer: string }) {
  if (!asset.issuer) {
    return `${prefix}_asset_type=native`;
  }
  return `${prefix}_asset_type=credit_alphanum${asset.code.length <= 4 ? '4' : '12'}&${prefix}_asset_code=${asset.code}&${prefix}_asset_issuer=${asset.issuer}`;
}

interface HorizonPathRecord {
  destination_amount: string;
  source_amount: string;
  path: { asset_code?: string }[];
}

interface BroadcastResult {
  id: string;
  hash: string;
  ledger: number;
  created_at: string;
  extras?: { result_codes?: unknown };
  detail?: string;
  title?: string;
}

function assertDifferentAssets(
  sendAsset: { code: string; issuer: string },
  destAsset: { code: string; issuer: string },
) {
  if (sendAsset.code === destAsset.code && sendAsset.issuer === destAsset.issuer) {
    throw new Error('发送资产和接收资产不能相同');
  }
}

async function fetchStrictSendQuote(
  horizonUrl: string,
  sendAsset: { code: string; issuer: string },
  sendAmount: string,
  destAsset: { code: string; issuer: string },
) {
  assertDifferentAssets(sendAsset, destAsset);
  const destAssetStr = destAsset.issuer
    ? `${destAsset.code}:${destAsset.issuer}`
    : 'native';
  const url = `${horizonUrl}/paths/strict-send?${buildAssetParams('source', sendAsset)}&source_amount=${sendAmount}&destination_assets=${encodeURIComponent(destAssetStr)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Horizon API error: ${res.status}`);
  const data = await res.json();
  const records = data?._embedded?.records as HorizonPathRecord[] | undefined;
  if (!records?.length) throw new Error('No path found - 当前交易对无流动性');
  return records[0];
}

async function fetchStrictReceiveQuote(
  horizonUrl: string,
  destAsset: { code: string; issuer: string },
  destAmount: string,
  sendAsset: { code: string; issuer: string },
) {
  assertDifferentAssets(sendAsset, destAsset);
  const sourceAssetStr = sendAsset.issuer
    ? `${sendAsset.code}:${sendAsset.issuer}`
    : 'native';
  const url = `${horizonUrl}/paths/strict-receive?${buildAssetParams('destination', destAsset)}&destination_amount=${destAmount}&source_assets=${encodeURIComponent(sourceAssetStr)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Horizon API error: ${res.status}`);
  const data = await res.json();
  const records = data?._embedded?.records as HorizonPathRecord[] | undefined;
  if (!records?.length) throw new Error('No path found - 当前交易对无流动性');
  return records[0];
}

// Helper function to detect if wallet is Hana style
const isHanaWallet = (provider: IProviderApi): boolean => {
  return !provider.getAddress && !!provider.getPublicKey;
};

const signTransactionCompat = async (
  provider: IProviderApi,
  xdr: string,
  networkPassphrase: string,
): Promise<{ signedTxXdr: string }> => {
  if (isHanaWallet(provider)) {
    const signedXdr = (await provider.signTransaction({
      xdr,
      networkPassphrase,
    })) as string;
    return { signedTxXdr: signedXdr };
  } else {
    return (await provider.signTransaction(xdr, {
      networkPassphrase,
    })) as { signedTxXdr: string };
  }
};

async function broadcastTransaction(horizonUrl: string, signedTxXdr: string) {
  const res = await fetch(`${horizonUrl}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `tx=${encodeURIComponent(signedTxXdr)}`,
  });
  const data = (await res.json()) as BroadcastResult;
  if (!res.ok) {
    const extras = data?.extras?.result_codes;
    throw new Error(
      `广播失败 (${res.status}): ${extras ? JSON.stringify(extras) : data?.detail || data?.title || 'Unknown error'}`,
    );
  }
  return data;
}

interface SwapProps {
  networkPassphrase: string;
}

export const SwapStrictSend = ({ networkPassphrase }: SwapProps) => {
  const { provider, account } = useWallet<IProviderApi>();

  const assetOptions = getAssetOptions(networkPassphrase);
  const defaultSendValue = assetOptions[0].value;
  const defaultDestValue = assetOptions[1].value;

  return (
    <ApiForm
      key={networkPassphrase}
      title="Swap - Path Payment Strict Send"
      description="固定发送数量，接收数量由市场决定。例：花 10 XLM，尽量多换 USDC"
    >
      <ApiForm.Selector
        id="sendAsset"
        label="发送资产"
        placeholder="选择发送资产"
        defaultValue={defaultSendValue}
        onRequestOptions={async () => Promise.resolve(assetOptions)}
      />
      <ApiForm.Field id="sendAmount" type="number" label="发送数量" defaultValue="10" />
      <ApiForm.Selector
        id="destAsset"
        label="接收资产"
        placeholder="选择接收资产"
        defaultValue={defaultDestValue}
        onRequestOptions={async () => Promise.resolve(assetOptions)}
      />

      <ApiForm.Button
        id="quoteButton"
        label="查询报价（自动填入 destMin，含 2% 滑点）"
        availableDependencyFields={[{ fieldIds: ['sendAsset', 'sendAmount', 'destAsset'] }]}
        onClick={async (formRef) => {
          const sendAsset = parseAssetValue(formRef?.getValue<string>('sendAsset') ?? defaultSendValue);
          const sendAmount = formRef?.getValue<string>('sendAmount') ?? '10';
          const destAsset = parseAssetValue(formRef?.getValue<string>('destAsset') ?? defaultDestValue);
          const horizonUrl = getHorizonUrl(networkPassphrase);

          const quote = await fetchStrictSendQuote(horizonUrl, sendAsset, sendAmount, destAsset);
          const estimatedAmount = parseFloat(quote.destination_amount);
          const destMinWithSlippage = (estimatedAmount * 0.98).toFixed(7);

          formRef?.setValue('destMin', destMinWithSlippage);
          formRef?.setJsonValue('quoteResult', {
            estimatedReceive: `${quote.destination_amount} ${destAsset.code}`,
            destMinWithSlippage: `${destMinWithSlippage} ${destAsset.code} (2% slippage)`,
            rate: `1 ${sendAsset.code} ≈ ${(estimatedAmount / parseFloat(sendAmount)).toFixed(7)} ${destAsset.code}`,
            path: quote.path?.length ? quote.path.map((p: { asset_code?: string }) => p.asset_code || 'XLM') : '(direct)',
          });
        }}
      />
      <ApiForm.AutoHeightTextArea id="quoteResult" label="报价结果" />

      <ApiForm.Field
        id="destMin"
        type="number"
        label="最少接收数量（滑点保护）"
        defaultValue="0.0000001"
      />
      <ApiForm.Field
        id="destAddress"
        type="text"
        label="接收地址（默认为自己，即 Swap）"
        defaultValue={account?.address}
      />

      <ApiForm.Button
        id="signButton"
        label="签名 Strict Send 交易"
        availableDependencyFields={[
          { fieldIds: ['sendAsset', 'sendAmount', 'destAsset', 'destMin'] },
        ]}
        onClick={async (formRef) => {
          const sendAsset = parseAssetValue(formRef?.getValue<string>('sendAsset') ?? defaultSendValue);
          const sendAmount = formRef?.getValue<string>('sendAmount') ?? '10';
          const destAsset = parseAssetValue(formRef?.getValue<string>('destAsset') ?? defaultDestValue);
          const destMin = formRef?.getValue<string>('destMin') ?? '0.0000001';
          const destAddress =
            formRef?.getValue<string>('destAddress') || account?.address || '';

          const xdr = buildPathPaymentStrictSendTransaction({
            sourceAddress: account?.address || '',
            destinationAddress: destAddress,
            sendAssetCode: sendAsset.code,
            sendAssetIssuer: sendAsset.issuer,
            sendAmount,
            destAssetCode: destAsset.code,
            destAssetIssuer: destAsset.issuer,
            destMin,
            networkPassphrase,
          });

          const res = await signTransactionCompat(provider, xdr, networkPassphrase);

          formRef?.setJsonValue('signResponse', {
            ...res,
            operation: 'pathPaymentStrictSend',
            send: `${sendAmount} ${sendAsset.code}`,
            receiveMin: `${destMin} ${destAsset.code}`,
          });
        }}
      />
      <ApiForm.AutoHeightTextArea id="signResponse" label="签名结果" />

      <ApiForm.Separator />
      <ApiForm.Button
        id="broadcastButton"
        label="广播交易到网络"
        availableDependencyFields={[{ fieldIds: ['signResponse'] }]}
        onClick={async (formRef) => {
          const signResponseStr = formRef?.getValue<string>('signResponse') ?? '';
          const signResponse = JSON.parse(signResponseStr);
          const signedTxXdr = signResponse?.signedTxXdr;
          if (!signedTxXdr) throw new Error('请先签名交易');

          const horizonUrl = getHorizonUrl(networkPassphrase);
          const result = await broadcastTransaction(horizonUrl, signedTxXdr);

          formRef?.setJsonValue('broadcastResult', {
            txId: result.id,
            hash: result.hash,
            ledger: result.ledger,
            createdAt: result.created_at,
          });
        }}
      />
      <ApiForm.AutoHeightTextArea id="broadcastResult" label="广播结果（txId）" />
    </ApiForm>
  );
};

export const SwapStrictReceive = ({ networkPassphrase }: SwapProps) => {
  const { provider, account } = useWallet<IProviderApi>();

  const assetOptions = getAssetOptions(networkPassphrase);
  const defaultSendValue = assetOptions[0].value;
  const defaultDestValue = assetOptions[1].value;

  return (
    <ApiForm
      key={networkPassphrase}
      title="Swap - Path Payment Strict Receive"
      description="固定接收数量，发送数量由市场决定。例：确保收到 1 USDC，最多花 100 XLM"
    >
      <ApiForm.Selector
        id="sendAsset"
        label="发送资产"
        placeholder="选择发送资产"
        defaultValue={defaultSendValue}
        onRequestOptions={async () => Promise.resolve(assetOptions)}
      />
      <ApiForm.Selector
        id="destAsset"
        label="接收资产"
        placeholder="选择接收资产"
        defaultValue={defaultDestValue}
        onRequestOptions={async () => Promise.resolve(assetOptions)}
      />
      <ApiForm.Field id="destAmount" type="number" label="接收数量" defaultValue="1" />

      <ApiForm.Button
        id="quoteButton"
        label="查询报价（自动填入 sendMax，含 2% 滑点）"
        availableDependencyFields={[{ fieldIds: ['sendAsset', 'destAsset', 'destAmount'] }]}
        onClick={async (formRef) => {
          const sendAsset = parseAssetValue(formRef?.getValue<string>('sendAsset') ?? defaultSendValue);
          const destAsset = parseAssetValue(formRef?.getValue<string>('destAsset') ?? defaultDestValue);
          const destAmount = formRef?.getValue<string>('destAmount') ?? '1';
          const horizonUrl = getHorizonUrl(networkPassphrase);

          const quote = await fetchStrictReceiveQuote(horizonUrl, destAsset, destAmount, sendAsset);
          const estimatedAmount = parseFloat(quote.source_amount);
          const sendMaxWithSlippage = (estimatedAmount * 1.02).toFixed(7);

          formRef?.setValue('sendMax', sendMaxWithSlippage);
          formRef?.setJsonValue('quoteResult', {
            estimatedSend: `${quote.source_amount} ${sendAsset.code}`,
            sendMaxWithSlippage: `${sendMaxWithSlippage} ${sendAsset.code} (2% slippage)`,
            rate: `1 ${destAsset.code} ≈ ${(estimatedAmount / parseFloat(destAmount)).toFixed(7)} ${sendAsset.code}`,
            path: quote.path?.length ? quote.path.map((p: { asset_code?: string }) => p.asset_code || 'XLM') : '(direct)',
          });
        }}
      />
      <ApiForm.AutoHeightTextArea id="quoteResult" label="报价结果" />

      <ApiForm.Field
        id="sendMax"
        type="number"
        label="最多发送数量（滑点保护）"
        defaultValue="100"
      />
      <ApiForm.Field
        id="destAddress"
        type="text"
        label="接收地址（默认为自己，即 Swap）"
        defaultValue={account?.address}
      />

      <ApiForm.Button
        id="signButton"
        label="签名 Strict Receive 交易"
        availableDependencyFields={[
          { fieldIds: ['sendAsset', 'sendMax', 'destAsset', 'destAmount'] },
        ]}
        onClick={async (formRef) => {
          const sendAsset = parseAssetValue(formRef?.getValue<string>('sendAsset') ?? defaultSendValue);
          const sendMax = formRef?.getValue<string>('sendMax') ?? '100';
          const destAsset = parseAssetValue(formRef?.getValue<string>('destAsset') ?? defaultDestValue);
          const destAmount = formRef?.getValue<string>('destAmount') ?? '1';
          const destAddress =
            formRef?.getValue<string>('destAddress') || account?.address || '';

          const xdr = buildPathPaymentStrictReceiveTransaction({
            sourceAddress: account?.address || '',
            destinationAddress: destAddress,
            sendAssetCode: sendAsset.code,
            sendAssetIssuer: sendAsset.issuer,
            sendMax,
            destAssetCode: destAsset.code,
            destAssetIssuer: destAsset.issuer,
            destAmount,
            networkPassphrase,
          });

          const res = await signTransactionCompat(provider, xdr, networkPassphrase);

          formRef?.setJsonValue('signResponse', {
            ...res,
            operation: 'pathPaymentStrictReceive',
            sendMax: `${sendMax} ${sendAsset.code}`,
            receive: `${destAmount} ${destAsset.code}`,
          });
        }}
      />
      <ApiForm.AutoHeightTextArea id="signResponse" label="签名结果" />

      <ApiForm.Separator />
      <ApiForm.Button
        id="broadcastButton"
        label="广播交易到网络"
        availableDependencyFields={[{ fieldIds: ['signResponse'] }]}
        onClick={async (formRef) => {
          const signResponseStr = formRef?.getValue<string>('signResponse') ?? '';
          const signResponse = JSON.parse(signResponseStr);
          const signedTxXdr = signResponse?.signedTxXdr;
          if (!signedTxXdr) throw new Error('请先签名交易');

          const horizonUrl = getHorizonUrl(networkPassphrase);
          const result = await broadcastTransaction(horizonUrl, signedTxXdr);

          formRef?.setJsonValue('broadcastResult', {
            txId: result.id,
            hash: result.hash,
            ledger: result.ledger,
            createdAt: result.created_at,
          });
        }}
      />
      <ApiForm.AutoHeightTextArea id="broadcastResult" label="广播结果（txId）" />
    </ApiForm>
  );
};
