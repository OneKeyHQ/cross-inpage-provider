import { useEffect, useRef, useState } from 'react';
import { ApiGroup } from '../../ApiActuator';
import { Button } from '../../ui/button';
import { createSigningDraft, signAndVerifyOriginalBody } from './originalCbor';
import type { CborEncoding, SigningDraft, SigningWallet } from './originalCbor';

const encodings: { label: string; value: CborEncoding }[] = [
  { label: '复现：普通 inputs + map outputs', value: { taggedInputs: false, mapOutputs: true } },
  { label: '普通 inputs + array outputs', value: { taggedInputs: false, mapOutputs: false } },
  { label: 'tag 258 inputs + map outputs', value: { taggedInputs: true, mapOutputs: true } },
  {
    label: '对照：tag 258 inputs + array outputs',
    value: { taggedInputs: true, mapOutputs: false },
  },
];

type VerificationResult = Awaited<ReturnType<typeof signAndVerifyOriginalBody>>;

export default function OriginalCborSigning({
  walletApi,
  accountAddress,
  formatAddress,
}: {
  walletApi: SigningWallet | null;
  accountAddress?: string;
  formatAddress: (address: string) => string;
}) {
  const [encodingIndex, setEncodingIndex] = useState(0);
  const [draft, setDraft] = useState<SigningDraft | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);

  useEffect(() => {
    revision.current += 1;
    setDraft(null);
    setResult(null);
    setError('');
    setBusy(false);
  }, [walletApi, accountAddress, encodingIndex]);

  const execute = async (sign: boolean) => {
    if (!walletApi) return;
    const current = revision.current;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      if (sign && draft) {
        const next = await signAndVerifyOriginalBody(walletApi, draft);
        if (current === revision.current) setResult(next);
      } else {
        setDraft(null);
        const next = await createSigningDraft(walletApi, encodings[encodingIndex].value);
        if (current === revision.current) setDraft(next);
      }
    } catch (cause) {
      if (current === revision.current) {
        const message = cause instanceof Error ? cause.message : JSON.stringify(cause);
        setError(`未完成验签：${message}。钱包拒绝、取消或设备报错均不计为通过。`);
      }
    } finally {
      if (current === revision.current) setBusy(false);
    }
  };

  return (
    <ApiGroup title="Cardano signTx 原始 CBOR 回归验证">
      <div
        className="col-span-full rounded-lg border p-4 space-y-3"
        data-testid="cardano-original-cbor"
      >
        <p>先连接钱包；此测试不需要 Blockfrost Key。准备至少一个 2 ADA 的纯 ADA UTXO。</p>
        <p>
          样本将选中的 UTXO 余额扣除 0.2 ADA
          手续费后转回自己的找零地址。这里只请求签名和本地验签，不广播；手续费未按实时协议参数估算。
        </p>
        <p>
          旧版 / 新版使用同一账户、同一编码且 UTXO 不变时，会生成同一个 body
          hash。所有受支持的平台、软件账户和硬件账户都应显示 PASS。
        </p>
        <select
          aria-label="CBOR 编码"
          className="w-full rounded-md border bg-background p-2"
          value={encodingIndex}
          disabled={busy}
          onChange={(event) => setEncodingIndex(Number(event.target.value))}
        >
          {encodings.map((encoding, index) => (
            <option key={encoding.label} value={index}>
              {encoding.label}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!walletApi || busy} onClick={() => void execute(false)}>
            1. 构造自转样本
          </Button>
          <Button disabled={!walletApi || !draft || busy} onClick={() => void execute(true)}>
            2. 签名并验签
          </Button>
        </div>
        <p
          role="status"
          data-testid="cardano-original-cbor-status"
          className={result?.pass ? 'text-green-600' : 'text-red-600'}
        >
          {busy
            ? '处理中，请完成钱包确认…'
            : error ||
              (result
                ? result.pass
                  ? 'PASS：原始 body hash 验签通过，输入密钥匹配'
                  : 'FAIL：签名与原始 body hash 或输入密钥不匹配'
                : !walletApi
                ? '请先连接钱包'
                : draft
                ? '样本已生成，可以签名'
                : '请选择编码并构造样本')}
        </p>
        {draft && (
          <div className="space-y-1 break-all text-sm">
            <p>原始 body hash：{draft.originalHash}</p>
            <p>重编码对照 hash：{draft.reencodedHash}</p>
            <p>
              {draft.originalHash !== draft.reencodedHash
                ? '哈希不同：此样本可检测重新编码问题'
                : '哈希相同：这是正常编码对照用例，请同时测试默认复现用例'}
            </p>
            <p>实际自转地址：{formatAddress(draft.changeAddress)}</p>
            <p>
              网络 ID：{draft.networkId}；转回金额：{draft.outputLovelace} lovelace；手续费：
              {draft.feeLovelace} lovelace
            </p>
            {result && (
              <p>
                签名数量：{result.witnessCount}；原始哈希验签：
                {result.witnesses.every((witness) => witness.validForOriginal) ? '通过' : '失败'}
                ；重编码哈希验签：
                {result.witnesses.every((witness) => witness.validForReencoded) ? '通过' : '失败'}
              </p>
            )}
          </div>
        )}
        {draft && (
          <label className="block text-sm">
            测试报告（含 unsigned tx、witness 和通过验签的 signedTxHex）
            <textarea
              readOnly
              className="mt-1 h-56 w-full rounded-md border bg-background p-2 font-mono text-xs"
              value={JSON.stringify({ draft, result, error }, null, 2)}
            />
          </label>
        )}
      </div>
    </ApiGroup>
  );
}
