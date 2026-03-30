/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as StellarSdk from '@stellar/stellar-sdk';

// ======== Types ========

type NetworkType = 'testnet' | 'mainnet';
type SwapStep =
  | { status: 'checking-trustline' }
  | { status: 'signing-trustline' }
  | { status: 'submitting-trustline' }
  | { status: 'signing-swap' }
  | { status: 'submitting-swap' }
  | { status: 'success'; txHash: string }
  | { status: 'error'; message: string }
  | null;

interface TokenInfo {
  code: string;
  name: string;
  issuer?: string;
}

// ======== Config ========

const NETWORKS = {
  testnet: {
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    friendbotUrl: 'https://friendbot.stellar.org',
    explorerBase: 'https://stellar.expert/explorer/testnet',
  },
  mainnet: {
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
    horizonUrl: 'https://horizon.stellar.org',
    explorerBase: 'https://stellar.expert/explorer/public',
  },
} as const;

const TOKENS: Record<NetworkType, TokenInfo[]> = {
  testnet: [
    { code: 'XLM', name: 'Stellar Lumens' },
    {
      code: 'USDC',
      name: 'USD Coin',
      issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    },
    {
      code: 'ZTOKEN',
      name: 'ZToken',
      issuer: 'GDQNEURSBYDXRG73VSVZF5ZZ4WRJRQT55ABHJFVTKE3DDZPIRW72VIOL',
    },
    {
      code: 'ZJGG',
      name: 'ZJGG',
      issuer: 'GBPQ6EKBNOMDZ7RG7KIIWWCAGGE6FEQOZIXF3TA5LBAWHXLUTIXO3X4P',
    },
  ],
  mainnet: [
    { code: 'XLM', name: 'Stellar Lumens' },
    {
      code: 'USDC',
      name: 'USD Coin',
      issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    },
    {
      code: 'yXLM',
      name: 'Yield XLM',
      issuer: 'GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55',
    },
    {
      code: 'XRP',
      name: 'Ripple',
      issuer: 'GCNSGHUCG5VMGLT5RIYYZSO7VQULQKAJ62QA33DBC5PPBSO57LFWVV6P',
    },
    {
      code: 'MOBI',
      name: 'Mobius',
      issuer: 'GA6HCMBLTZS5VYYBCATRBRZ3BZJMAFUDKYYF6AH6MVCMGWMRDNSWJPIH',
    },
    {
      code: 'SHX',
      name: 'Stronghold',
      issuer: 'GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH',
    },
    {
      code: 'VELO',
      name: 'Velo',
      issuer: 'GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M',
    },
  ],
};

// ======== Stellar helpers ========

function toAsset(t: TokenInfo): StellarSdk.Asset {
  return t.issuer ? new StellarSdk.Asset(t.code, t.issuer) : StellarSdk.Asset.native();
}
function horizon(n: NetworkType) {
  return new StellarSdk.Horizon.Server(NETWORKS[n].horizonUrl);
}

async function getBalances(addr: string, n: NetworkType) {
  try {
    const acct = await horizon(n).loadAccount(addr);
    return acct.balances.map((b: any) => ({
      asset: b.asset_type === 'native' ? 'XLM' : (b.asset_code as string),
      balance: b.balance as string,
    }));
  } catch {
    return [];
  }
}

async function findSwapPath(from: TokenInfo, to: TokenInfo, amount: string, n: NetworkType) {
  try {
    const paths = await horizon(n)
      .strictSendPaths(toAsset(from), amount, [toAsset(to)])
      .call();
    if (!paths.records.length) return null;
    const best = paths.records[0];
    return {
      destinationAmount: best.destination_amount,
      path: best.path.map((p: any) =>
        p.asset_type === 'native'
          ? StellarSdk.Asset.native()
          : new StellarSdk.Asset(p.asset_code, p.asset_issuer),
      ),
    };
  } catch {
    return null;
  }
}

async function checkTrustline(
  addr: string,
  token: TokenInfo,
  n: NetworkType,
): Promise<string | null> {
  if (!token.issuer) return null;
  const acct = await horizon(n).loadAccount(addr);
  if (
    acct.balances.some(
      (b: any) =>
        b.asset_type !== 'native' && b.asset_code === token.code && b.asset_issuer === token.issuer,
    )
  )
    return null;
  return new StellarSdk.TransactionBuilder(acct, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORKS[n].networkPassphrase,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: toAsset(token) }))
    .setTimeout(120)
    .build()
    .toXDR();
}

async function buildSwapTx(
  addr: string,
  from: TokenInfo,
  to: TokenInfo,
  sendAmt: string,
  minDest: string,
  path: StellarSdk.Asset[],
  n: NetworkType,
) {
  const acct = await horizon(n).loadAccount(addr);
  return new StellarSdk.TransactionBuilder(acct, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORKS[n].networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: toAsset(from),
        sendAmount: sendAmt,
        destination: addr,
        destAsset: toAsset(to),
        destMin: minDest,
        path,
      }),
    )
    .setTimeout(120)
    .build()
    .toXDR();
}

async function submitTx(xdr: string, n: NetworkType) {
  const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, NETWORKS[n].networkPassphrase);
  return await horizon(n).submitTransaction(tx as StellarSdk.Transaction);
}

async function getRecentTxs(addr: string, n: NetworkType) {
  try {
    const txs = await horizon(n).transactions().forAccount(addr).order('desc').limit(10).call();
    return await Promise.all(
      txs.records.map(async (tx) => {
        let desc = '';
        try {
          const ops = await tx.operations();
          desc = ops.records
            .map((op: any) => {
              const a = (o: any) => (o.asset_type === 'native' ? 'XLM' : o.asset_code);
              switch (op.type) {
                case 'path_payment_strict_send':
                  return `Swap ${op.source_amount} ${a({
                    asset_type: op.source_asset_type,
                    asset_code: op.source_asset_code,
                  })} → ${op.amount} ${a(op)}`;
                case 'path_payment_strict_receive':
                  return `Swap → ${op.amount} ${a(op)}`;
                case 'payment':
                  return `Send ${op.amount} ${a(op)}`;
                case 'create_account':
                  return `Create account (${op.starting_balance} XLM)`;
                case 'change_trust':
                  return `Trustline ${a(op)}`;
                case 'invoke_host_function':
                  return 'Contract call';
                default:
                  return (op.type as string)?.replace(/_/g, ' ') || 'Unknown';
              }
            })
            .join(', ');
        } catch {
          desc = `${tx.operation_count} op(s)`;
        }
        return { hash: tx.hash, createdAt: tx.created_at, successful: tx.successful, desc };
      }),
    );
  } catch {
    return [];
  }
}

// ======== Wallet ========

type Provider = {
  getAddress?: (p?: any) => Promise<{ address: string }>;
  getPublicKey?: () => Promise<string>;
  signTransaction: (xdr: string | any, opts?: any) => Promise<any>;
};

async function getAddr(p: Provider) {
  if (p.getAddress) return (await p.getAddress()).address;
  if (p.getPublicKey) return await p.getPublicKey();
  throw new Error('No address method');
}

async function sign(p: Provider, xdr: string, passphrase: string, addr: string) {
  if (!p.getAddress && p.getPublicKey) {
    const r = await p.signTransaction({ xdr, networkPassphrase: passphrase, accountToSign: addr });
    return typeof r === 'string' ? r : r.signedTxXdr;
  }
  return (await p.signTransaction(xdr, { networkPassphrase: passphrase, address: addr }))
    .signedTxXdr as string;
}

// ======== Styles ========

const S = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#0a0a0f',
    color: '#fff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid #2a2a3e',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 600 },
  logoIcon: { color: '#7b3fe4', fontSize: 24 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12 },
  netSwitcher: {
    display: 'flex',
    background: '#0f0f1a',
    borderRadius: 8,
    padding: 2,
    border: '1px solid #2a2a3e',
  },
  netBtn: (active: boolean) => ({
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 6,
    background: active ? '#7b3fe4' : 'transparent',
    color: active ? '#fff' : '#6b7280',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  }),
  faucetBtn: {
    fontSize: 13,
    padding: '8px 16px',
    borderRadius: 8,
    background: 'rgba(245,158,11,0.15)',
    color: '#f59e0b',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  },
  connectBtn: {
    fontSize: 14,
    padding: '8px 20px',
    borderRadius: 8,
    background: '#7b3fe4',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '60px 20px',
    gap: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontWeight: 600, marginBottom: 16 },
  inputGroup: { background: '#0f0f1a', borderRadius: 12, padding: 16 },
  inputHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
  label: { color: '#9ca3af' },
  balance: { color: '#6b7280' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 12 },
  tokenBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderRadius: 8,
    background: '#1a1a2e',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  amountInput: {
    flex: 1,
    textAlign: 'right' as const,
    fontSize: 24,
    fontWeight: 500,
    background: 'transparent',
    color: '#fff',
    border: 'none',
    outline: 'none',
    minWidth: 0,
  },
  flipContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '-6px 0',
    position: 'relative' as const,
    zIndex: 1,
  },
  flipBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: '#1a1a2e',
    border: '3px solid #0f0f1a',
    color: '#9ca3af',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  quoteInfo: { marginTop: 16, padding: 12, background: '#0f0f1a', borderRadius: 8, fontSize: 13 },
  quoteRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    color: '#9ca3af',
  },
  errorMsg: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    background: 'rgba(239,68,68,0.1)',
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  successMsg: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    background: 'rgba(16,185,129,0.1)',
    color: '#10b981',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  swapBtn: (disabled: boolean) => ({
    width: '100%',
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    background: disabled ? 'rgba(123,63,228,0.4)' : 'linear-gradient(135deg,#7b3fe4,#a855f7)',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  }),
  txCard: {
    width: '100%',
    maxWidth: 460,
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 16,
    padding: 20,
  },
  txItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 8,
    background: '#0f0f1a',
    textDecoration: 'none',
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 8,
  },
  txStatus: (ok: boolean) => ({
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 4,
    background: ok ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
    color: ok ? '#10b981' : '#ef4444',
  }),
  txDesc: {
    flex: 1,
    fontSize: 12,
    color: '#fff',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  txTime: { color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' as const },
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 16,
    padding: 24,
    width: 360,
  },
  tokenOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    background: 'transparent',
    color: '#fff',
    width: '100%',
    textAlign: 'left' as const,
    border: 'none',
    cursor: 'pointer',
  },
  stepModal: {
    background: '#1a1a2e',
    border: '1px solid #2a2a3e',
    borderRadius: 16,
    padding: 24,
    width: 400,
  },
  stepItem: (state: 'done' | 'active' | 'pending' | 'error') => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 14,
    padding: '8px 12px',
    borderRadius: 8,
    color:
      state === 'done'
        ? '#10b981'
        : state === 'active'
        ? '#fff'
        : state === 'error'
        ? '#ef4444'
        : '#6b7280',
    background:
      state === 'active' ? '#0f0f1a' : state === 'error' ? 'rgba(239,68,68,0.08)' : 'transparent',
  }),
  stepCloseBtn: {
    width: '100%',
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    background: '#2a2a3e',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
  },
};

// ======== Components ========

function truncate(s: string) {
  return `${s.slice(0, 6)}...${s.slice(-4)}`;
}

const STEP_LABELS: Record<string, string> = {
  'checking-trustline': 'Checking trustline...',
  'signing-trustline': 'Please sign the trustline transaction in your wallet',
  'submitting-trustline': 'Submitting trustline...',
  'signing-swap': 'Please sign the swap transaction in your wallet',
  'submitting-swap': 'Submitting swap...',
  success: 'Swap completed!',
  error: 'Swap failed',
};
const STEP_ORDER = [
  'checking-trustline',
  'signing-trustline',
  'submitting-trustline',
  'signing-swap',
  'submitting-swap',
  'success',
];

function StepModal({
  step,
  onDismiss,
  network,
}: {
  step: SwapStep;
  onDismiss: () => void;
  network: NetworkType;
}) {
  if (!step) return null;
  const done = step.status === 'success' || step.status === 'error';
  const ci = STEP_ORDER.indexOf(step.status);
  return (
    <div style={S.overlay}>
      <div style={S.stepModal}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
          {done ? (step.status === 'success' ? 'Done!' : 'Error') : 'Swapping...'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STEP_ORDER.map((s, i) => {
            if (s === 'checking-trustline' && ci > 0) return null;
            if (
              (s === 'signing-trustline' || s === 'submitting-trustline') &&
              ci > STEP_ORDER.indexOf('submitting-trustline') &&
              i <= STEP_ORDER.indexOf('submitting-trustline') &&
              i > 0
            )
              return null;
            const state =
              step.status === 'error' && i >= ci
                ? i === ci
                  ? 'error'
                  : 'pending'
                : i < ci || step.status === 'success'
                ? 'done'
                : i === ci
                ? 'active'
                : 'pending';
            const icon =
              state === 'done' ? '✓' : state === 'error' ? '✗' : state === 'active' ? '⏳' : '○';
            return (
              <div key={s} style={S.stepItem(state)}>
                <span style={{ width: 20, textAlign: 'center' }}>{icon}</span>
                <span>{STEP_LABELS[s]}</span>
              </div>
            );
          })}
        </div>
        {step.status === 'error' && <div style={S.errorMsg}>{step.message}</div>}
        {step.status === 'success' && (
          <a
            href={`${NETWORKS[network].explorerBase}/tx/${step.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              marginTop: 12,
              textAlign: 'center',
              color: '#10b981',
              fontSize: 14,
            }}
          >
            View on Explorer
          </a>
        )}
        {done && (
          <button style={S.stepCloseBtn} onClick={onDismiss}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

// ======== Main ========

export default function StellarSwapExample() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const providerRef = useRef<Provider | null>(null);
  const addressRef = useRef<string | null>(null);

  const [network, setNetwork] = useState<NetworkType>('testnet');
  const tokens = TOKENS[network];
  const [fromToken, setFromToken] = useState<TokenInfo>(tokens[0]);
  const [toToken, setToToken] = useState<TokenInfo>(tokens[1]);
  const [amount, setAmount] = useState('');
  const [balances, setBalances] = useState<{ asset: string; balance: string }[]>([]);
  const [quote, setQuote] = useState<{
    destinationAmount: string;
    path: StellarSdk.Asset[];
  } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [step, setStep] = useState<SwapStep>(null);
  const [funding, setFunding] = useState(false);
  const [txs, setTxs] = useState<
    { hash: string; createdAt: string; successful: boolean; desc: string }[]
  >([]);
  const [showTokenSelect, setShowTokenSelect] = useState<'from' | 'to' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quoteTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const quoteRef = useRef(quote);
  quoteRef.current = quote;

  const loadBalances = useCallback(async () => {
    const a = addressRef.current;
    if (!a) return;
    setBalances(await getBalances(a, network));
  }, [network]);

  const loadTxs = useCallback(async () => {
    const a = addressRef.current;
    if (!a) return;
    setTxs(await getRecentTxs(a, network));
  }, [network]);

  useEffect(() => {
    if (address) {
      void loadBalances();
      void loadTxs();
    } else {
      setBalances([]);
      setTxs([]);
    }
  }, [address, loadBalances, loadTxs]);

  useEffect(() => {
    clearTimeout(quoteTimerRef.current);
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }
    quoteTimerRef.current = setTimeout(async () => {
      setQuoting(true);
      setError(null);
      const r = await findSwapPath(fromToken, toToken, amount, network);
      setQuote(r);
      if (!r) setError('No swap path found');
      setQuoting(false);
    }, 500);
    return () => clearTimeout(quoteTimerRef.current);
  }, [amount, fromToken, toToken, network]);

  const handleConnect = async () => {
    const p = (window as any)?.$onekey?.stellar as Provider | undefined;
    if (!p) {
      alert('OneKey Wallet not found');
      return;
    }
    setConnecting(true);
    try {
      const a = await getAddr(p);
      providerRef.current = p;
      addressRef.current = a;
      setAddress(a);
    } catch (e: any) {
      alert(e?.message || 'Connect failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    providerRef.current = null;
    addressRef.current = null;
    setAddress(null);
    setBalances([]);
    setTxs([]);
  };

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    setQuote(null);
    setError(null);
  };

  const handleNetworkSwitch = (n: NetworkType) => {
    setNetwork(n);
    const t = TOKENS[n];
    setFromToken(t[0]);
    setToToken(t[1]);
    setAmount('');
    setQuote(null);
    setError(null);
    setBalances([]);
    setTxs([]);
    if (addressRef.current)
      setTimeout(() => {
        void loadBalances();
        void loadTxs();
      }, 100);
  };

  const handleFaucet = async () => {
    if (!address || network !== 'testnet') return;
    setFunding(true);
    try {
      const res = await fetch(
        `${NETWORKS.testnet.friendbotUrl}?addr=${encodeURIComponent(address)}`,
      );
      if (!res.ok) {
        const t = await res.text();
        if (!t.includes('createAccountAlreadyExist')) throw new Error(t);
      }
      await loadBalances();
    } catch (e: any) {
      alert(e?.message);
    } finally {
      setFunding(false);
    }
  };

  const handleSwap = async () => {
    const p = providerRef.current;
    const a = addressRef.current;
    const q = quoteRef.current;
    if (!p || !a || !q) return;
    setSwapping(true);
    setError(null);
    setStep({ status: 'checking-trustline' });
    try {
      const trustXdr = await checkTrustline(a, toToken, network);
      if (trustXdr) {
        setStep({ status: 'signing-trustline' });
        const signed = await sign(p, trustXdr, NETWORKS[network].networkPassphrase, a);
        setStep({ status: 'submitting-trustline' });
        await submitTx(signed, network);
      }
      setStep({ status: 'signing-swap' });
      const minDest = (parseFloat(q.destinationAmount) * 0.99).toFixed(7);
      const swapXdr = await buildSwapTx(a, fromToken, toToken, amount, minDest, q.path, network);
      const signedSwap = await sign(p, swapXdr, NETWORKS[network].networkPassphrase, a);
      setStep({ status: 'submitting-swap' });
      const result = await submitTx(signedSwap, network);
      setStep({ status: 'success', txHash: result.hash });
      await loadBalances();
      await loadTxs();
    } catch (e: any) {
      setStep({ status: 'error', message: e?.message || 'Swap failed' });
    } finally {
      setSwapping(false);
    }
  };

  const selectToken = (token: TokenInfo) => {
    if (showTokenSelect === 'from') {
      if (token.code === toToken.code) handleFlip();
      else setFromToken(token);
    } else {
      if (token.code === fromToken.code) handleFlip();
      else setToToken(token);
    }
    setShowTokenSelect(null);
    setAmount('');
    setQuote(null);
    setError(null);
  };

  const getBalance = (t: TokenInfo) => {
    const b = balances.find((x) => x.asset === t.code);
    return b ? parseFloat(b.balance).toFixed(4) : '0';
  };
  const swapDisabled =
    !address || !amount || parseFloat(amount) <= 0 || quoting || swapping || !quote;

  return (
    <div style={S.app}>
      <header style={S.header}>
        <div style={S.logo}>
          <span style={S.logoIcon}>★</span>
          <span>Stellar Swap</span>
        </div>
        <div style={S.headerRight}>
          <div style={S.netSwitcher}>
            <button
              style={S.netBtn(network === 'testnet')}
              onClick={() => handleNetworkSwitch('testnet')}
            >
              Testnet
            </button>
            <button
              style={S.netBtn(network === 'mainnet')}
              onClick={() => handleNetworkSwitch('mainnet')}
            >
              Mainnet
            </button>
          </div>
          {address && network === 'testnet' && (
            <button style={S.faucetBtn} onClick={handleFaucet} disabled={funding}>
              {funding ? 'Funding...' : 'Faucet'}
            </button>
          )}
          <button
            style={S.connectBtn}
            onClick={address ? handleDisconnect : handleConnect}
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : address ? truncate(address) : 'Connect Wallet'}
          </button>
        </div>
      </header>

      <main style={S.main}>
        <div style={S.card}>
          <h2 style={S.title}>Swap</h2>

          <div style={S.inputGroup}>
            <div style={S.inputHeader}>
              <span style={S.label}>From</span>
              {address && <span style={S.balance}>Balance: {getBalance(fromToken)}</span>}
            </div>
            <div style={S.inputRow}>
              <button style={S.tokenBtn} onClick={() => setShowTokenSelect('from')}>
                {fromToken.code} <span style={{ fontSize: 10, color: '#9ca3af' }}>▾</span>
              </button>
              <input
                style={S.amountInput}
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div style={S.flipContainer}>
            <button style={S.flipBtn} onClick={handleFlip}>
              ↕
            </button>
          </div>

          <div style={S.inputGroup}>
            <div style={S.inputHeader}>
              <span style={S.label}>To</span>
              {address && <span style={S.balance}>Balance: {getBalance(toToken)}</span>}
            </div>
            <div style={S.inputRow}>
              <button style={S.tokenBtn} onClick={() => setShowTokenSelect('to')}>
                {toToken.code} <span style={{ fontSize: 10, color: '#9ca3af' }}>▾</span>
              </button>
              <input
                style={S.amountInput}
                type="number"
                placeholder="0.0"
                value={quote ? parseFloat(quote.destinationAmount).toFixed(7) : ''}
                readOnly
              />
            </div>
          </div>

          {quote && amount && (
            <div style={S.quoteInfo}>
              <div style={S.quoteRow}>
                <span>Rate</span>
                <span>
                  1 {fromToken.code} ={' '}
                  {(parseFloat(quote.destinationAmount) / parseFloat(amount)).toFixed(6)}{' '}
                  {toToken.code}
                </span>
              </div>
              <div style={S.quoteRow}>
                <span>Min. Received (1% slippage)</span>
                <span>
                  {(parseFloat(quote.destinationAmount) * 0.99).toFixed(7)} {toToken.code}
                </span>
              </div>
            </div>
          )}

          {error && <div style={S.errorMsg}>{error}</div>}

          <button
            style={S.swapBtn(address ? swapDisabled : connecting)}
            onClick={address ? handleSwap : handleConnect}
            disabled={address ? swapDisabled : connecting}
          >
            {!address
              ? 'Connect Wallet'
              : !amount || parseFloat(amount) <= 0
              ? 'Enter Amount'
              : quoting
              ? 'Getting Quote...'
              : swapping
              ? 'Swapping...'
              : 'Swap'}
          </button>
        </div>

        {address && txs.length > 0 && (
          <div style={S.txCard}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Transactions</h3>
            {txs.map((tx) => (
              <a
                key={tx.hash}
                style={S.txItem}
                href={`${NETWORKS[network].explorerBase}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span style={S.txStatus(tx.successful)}>{tx.successful ? 'OK' : 'FAIL'}</span>
                <span style={S.txDesc}>{tx.desc}</span>
                <span style={S.txTime}>{new Date(tx.createdAt).toLocaleString()}</span>
              </a>
            ))}
          </div>
        )}
      </main>

      {showTokenSelect && (
        <div style={S.overlay} onClick={() => setShowTokenSelect(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Select Token</h3>
            {tokens.map((t) => (
              <button
                key={t.code}
                style={S.tokenOption}
                onClick={() => selectToken(t)}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = '#0f0f1a';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 16, minWidth: 60 }}>{t.code}</span>
                <span style={{ color: '#9ca3af', fontSize: 14 }}>{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <StepModal step={step} onDismiss={() => setStep(null)} network={network} />
    </div>
  );
}
