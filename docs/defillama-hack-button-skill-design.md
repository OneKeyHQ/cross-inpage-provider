# DeFiLlama Hack Button Skill 设计方案

## 1. 目标

实现一个可重复执行的 Codex skill，用于持续发现并适配高 TVL protocol 的钱包连接按钮：

1. 读取 `https://api-docs.defillama.com/llms.txt`，从其中确认 DeFiLlama 免费 API。
2. 获取每条链按当前 TVL 排名前 20 的 protocol。
3. 将 protocol、站点、排名和处理状态持久化到：

   `packages/providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json`

4. 每次执行最多研究 3 个 primary protocol。
5. 默认使用 Electron/Playwright 脚本找到真实 dapp 和钱包弹窗，Browser Control/Computer Use 仅处理低置信度异常。
6. 为缺少 OneKey 入口的站点实现 hack button adapter。
7. 在独立 Electron harness 中完成自动 E2E，不依赖 OneKey 浏览器插件或 `app-monorepo`。
8. 只有通过目标站点 E2E 后才把实现标记为完成。
9. 第一轮覆盖全部 active protocol；完成后进入下一轮实时站点回归。

本 skill 默认不提交 commit、不 push，也不打开 PR。除非用户明确要求，否则只修改当前 worktree。

真实 OneKey Desktop 人工验证复用现有 DApp Browser：DeepLink 只负责在用户确认后启用
唯一的本地 workspace；首个协议仍作为普通 Browser URL 打开，开发工具栏显示在同一个
DApp Browser 底部。workspace 启用期间，DApp Browser 当前及后续创建的所有 webview
统一使用该 workspace build 的 `injectedDesktopPreload.js`，不在单个 tab 上保存注入
状态。禁止新增独立 WebView modal、第二套 provider bridge 或只为该工作流存在的浏览器
页面；导航、session、EIP-6963 和 host bridge 均继续复用 DApp Browser 的现有实现。

### 1.1 当前实施状态（2026-07-29）

本方案已经在当前 worktree 落地。实现以 `packages/connect-button-lab` 为独立 workspace，
不依赖浏览器插件或 `app-monorepo`：

- `defillama-protocols.json` 已由官方 API 生成。当前快照从 7,950 个 API protocol 中
  过滤 78 个 `category: CEX`，包含 461 条链、2,516 个排名槽和 1,776 个 active
  protocol；三个官方响应都记录 timestamp 和 SHA-256。
- registry merge、stable ranking、跨机器 claim 接管、每批 1–3 个任务、原子状态更新和
  cycle rollover 均由 Node 脚本实现。
- CEX 在每条链取 top 20 之前过滤，不进入 registry、Dashboard 或历史状态；每条链随后
  由非 CEX protocol 补足可用 top 20 名额。
- 本仓库 `packages/providers/onekey-*-provider/package.json` 是链支持的明确证据；EVM
  链要求 Ethereum provider，非 EVM 链要求对应 provider。不存在本地 provider 的链在
  排名之前过滤，不再额外依赖 `app-monorepo` 或 `injectWeb3Provider.ts` import。
- dapp discovery、wallet UI inspection、selector/connector mapping、adapter manifest、
  generated TypeScript、case manifest、规则化 failure diagnosis 和不超过 50 KB 的 work
  packet 已形成完整脚本管线。
- `generated/defillama-sites.generated.ts` 已接入 universal hack 入口；后续标准站点不需要
  LLM 手写注册代码。
- Electron Dashboard 可直接运行；Test Sites 完全由 DeFiLlama active registry 生成，不再
  从本地 hack adapter 反推站点。支持单站点、全部 test-ready protocol、停止、search、
  reload、screenshot、guest DevTools、实时 provider/console event，以及实际可交互
  dapp WebView。
- Dashboard 同时显示 registry cycle/progress、protocol 信息和 generated case；测试结束后
  页面仍可手工验证。
- 正式 skill 位于 `.agents/skills/defillama-hack-buttons`，包含薄启动器、references 和
  `agents/openai.yaml`，已通过官方 `quick_validate.py`。
- 结果原子写入 `.data/results.json` 和 `.data/batches/`；截图写入 `artifacts/`，这些运行
  产物均被 Git 忽略。

可直接执行：

```bash
npm run connect-button-lab
npm run hack-buttons:validate
npm run hack-buttons:batch
```

首次运行会按 `package-lock.json` 自动执行 `npm ci`；依赖目录不进入 Git。另一台机器拉取
提交后只需直接调用项目 skill，不存在单独的 handoff/transfer 模式：已完成 protocol、
generated manifest/case/adapter 和 registry 状态从 Git 恢复；`pending` 从下一项继续；
意外中断遗留的 `claimed` 会立即转交给新 run，且不重复增加 attempt。registry 内的代码、
work packet 和截图引用必须使用仓库相对 POSIX 路径，校验器会拒绝 `/Users/...`、
`C:\...` 等本机绝对路径。

验证命令：

```bash
npm run connect-button-lab:test
npm --prefix packages/connect-button-lab run test:unit
```

已验证的本地 smoke case 会打开 wallet modal，并断言两个真实 DOM 替换：

- `OneKey & MetaMask`
- `OneKey & WalletConnect`

smoke case 共通过 10 个结构化断言，覆盖 injection、replacement、wallet ID 去重、精确
文案、icon、mutation、两个 case marker、reload 和 provider route。截图在 verdict 之后
采集，不参与 `passed` 计算。

### 1.2 Automation-first 原则

这个 skill 应设计成“脚本驱动，LLM 异常兜底”，而不是“LLM 逐站点阅读和编码”。

常规路径必须由 Node.js/TypeScript 程序完成：

- API 抓取、hash、排序和去重。
- Registry merge、状态机、claim lock 和 cycle rollover。
- 已有 adapter/index 扫描。
- Dapp URL 解析和候选 app link 发现。
- Electron/Playwright 页面导航和 UI 探测。
- Cookie/terms/connect-wallet 常见入口点击。
- Wallet modal、wallet item、文字和 icon DOM 采样。
- Selector 候选生成、唯一性验证和稳定性评分。
- 标准 universal adapter codegen。
- Case manifest codegen。
- Build、targeted E2E、screenshot、trace 和 request-scope 断言。
- Registry outcome/evidence 写回。
- Batch summary 和下一批队列计算。

LLM 只处理脚本不能确定的低置信度工作：

- landing page 无法自动解析真实 dapp。
- 钱包入口需要多步业务导航。
- 多个 wallet modal 或 wallet item 无法唯一识别。
- Shadow DOM、canvas、iframe 或高度定制 UI。
- 需要 bespoke adapter，而非数据驱动 universal adapter。
- 自动 E2E 失败且诊断程序无法分类。

LLM 不应读取完整 registry、完整页面 HTML、完整 trace 或完整构建日志。脚本必须生成体积受限的 work packet，只包含一个 protocol 的必要上下文。

目标指标：

- 正常 regression batch：零 LLM 代码生成。
- 标准钱包 UI 的新站点：脚本自动生成 adapter 和 case。
- 每个进入 LLM 的 protocol work packet 默认不超过 50 KB 文本。
- LLM 每次只加载一个失败 protocol 的 packet 和相关代码片段。
- 详细 DOM、trace 和 screenshots 只以文件路径引用。

### 1.3 各环节自动化边界

| 环节 | 默认实现 | 结构化输出 | LLM 介入条件 |
|---|---|---|---|
| API discovery/fetch | Node `fetch` + schema validator | source metadata | endpoint/schema 发生未知变化 |
| Top 20/ranking | Deterministic TypeScript | ranking records | 不介入 |
| Registry merge/cycle | State-machine library | updated registry | 非法状态且 migration 不支持 |
| Batch claim/lock | Transactional CLI | three claimed IDs | 不介入 |
| Existing adapter scan | TypeScript AST + hostname index | adapter match | 动态生成 hostname 无法静态解析 |
| Dapp discovery | Electron/Playwright crawler | candidate URLs | 候选都低置信度 |
| Consent/connect trigger | Pattern FSM | action trace | 无法找到稳定路径 |
| Wallet modal inspection | DOM analyzer | wallet UI snapshot | canvas/closed ShadowRoot/复杂 iframe |
| Selector synthesis | Scored selector engine | ranked candidates | 无 candidate 达到阈值 |
| Provider mapping | Static connector map | provider enum | 未知 wallet connector |
| Adapter generation | Manifest → TypeScript codegen | generated adapter | bespoke behavior |
| Case generation | Research result → JSON | validated case | 未知交互 action |
| Build/E2E | CLI subprocess + Playwright | compact result | hard failure 无规则诊断 |
| Failure diagnosis | Rule engine | classified failure | `unknown` classification |
| State update | Validated patch + atomic rename | registry/history | 不介入 |
| Regression | Batch scheduler | pass/fail summary | 只处理未自动修复 failure |
| Dashboard | Electron code | same state/events | 仅人工复核 |

## 2. 已确认的事实

`llms.txt` 是 API 文档索引，不包含 protocol 排名数据。实际数据来自免费接口：

- `GET https://api.llama.fi/v2/chains`
- `GET https://api.llama.fi/protocols`
- 可选补充：`GET https://api.llama.fi/protocol/{slug}`

`/protocols` 当前实际响应包含：

- `id`
- `name`
- `slug`
- `url`
- `category`
- `chains`
- `tvl`
- `chainTvls`

2026-07-29 的一次规模抽样：

- 7,947 个 protocol
- 461 条链
- 每条链取正 TVL top 20 后共有约 2,600 个排名槽
- 按 protocol ID 去重后约 1,702 个 protocol
- 按 DeFiLlama 原始 URL hostname 去重后约 1,110 个站点
- 约 400 个入选 protocol 没有可直接使用的 URL

这些数字只用于容量设计；正式运行必须重新抓取，不能硬编码。

## 3. 核心设计决策

### 3.1 排名和任务分离

排名的粒度是 `chain + protocol`，实现任务的粒度是 protocol/dapp 站点。

同一个 protocol 可能在多条链进入 top 20，JSON 中只保留一条 protocol 主记录，并在 `rankings` 中记录它的所有链排名，避免重复实现同一个站点。

发现多个 protocol 指向同一 dapp hostname 时：

- 选择一个 primary protocol 作为实现任务。
- 其他记录通过 `coveredByProtocolId` 关联。
- 同一次执行仍只研究最多 3 个 primary protocol。
- linked protocol 可以共享 adapter 和 E2E evidence，不产生额外浏览任务。

### 3.2 明确过滤边界

DeFiLlama `/protocols` 的 `category` 明确为 `CEX` 时，在按链排序和 `.slice(0, 20)`
之前剔除，并在 snapshot merge 时彻底删除旧 CEX 记录。CEX 不产生 coverage、regression、
Dashboard 或 LLM 任务。

其他候选继续保留，包括：

- 无 URL protocol
- 只有 marketing site、没有 dapp 的 protocol
- 已经原生支持 OneKey 的 protocol
- 已有 hack adapter 的 protocol

这些情况在研究后分别标记为 `not_applicable`、`blocked`、`native_supported` 或 `existing_verified`。不能在抓取阶段直接丢弃，否则无法证明“每条链 top 20”已经被处理。

### 3.3 Top 20 算法

以 `/v2/chains` 返回的 `name` 为 canonical chain name。

对每条链执行：

```text
candidates =
  protocols
    .filter(protocol => normalize(protocol.category) !== "cex")
    .filter(protocol => finite(protocol.chainTvls[chain.name]))
    .filter(protocol => protocol.chainTvls[chain.name] > 0)
    .sort(chainTvl DESC, protocol.id ASC)
    .slice(0, 20)
```

只读取精确的 `chainTvls[chain.name]`，不把类似以下派生 key 当成独立链 TVL：

- `Ethereum-borrowed`
- `Ethereum-staking`
- `Ethereum-pool2`
- `Ethereum-vesting`

排序必须有稳定的 protocol ID tie-breaker，保证相同输入生成相同 JSON。

### 3.4 周期快照

不在每次 3-item batch 中改变当前周期的 active 集合，否则队列可能永远无法完成。

- 第一次运行或开始新周期时抓取完整快照。
- 周期执行中只更新 protocol 研究和测试状态。
- 当前周期全部处理完成后：
  1. 增加 `cycle.number`。
  2. 重新抓取 DeFiLlama。
  3. 合并新增、退出 top 20 和排名变化。
  4. 为所有 active protocol 创建新的 regression 状态。

退出 top 20 的非 CEX protocol 设置 `active: false` 并保留历史；CEX 记录始终彻底删除。

## 4. 推荐目录结构

### 4.1 Skill

建议名称：`defillama-hack-buttons`

```text
<repo>/.agents/skills/defillama-hack-buttons/
├── SKILL.md
├── agents/
│   └── openai.yaml
├── scripts/
│   └── run.mjs
└── references/
    ├── registry-schema.md
    ├── adapter-guidelines.md
    └── electron-harness.md
```

该 skill 是项目版本化资产，只保存在仓库的 `.agents/skills/` 目录，不复制或安装到
`~/.agents/skills`、`${CODEX_HOME}/skills` 等用户级目录。

Skill 本身只保存工作流、薄启动器和按需 reference。`run.mjs` 只负责定位仓库、检查所需 workspace 命令存在，然后调用仓库内的 `run-batch` CLI。项目专用算法不能复制到 skill 目录。

动态队列、adapter、automation code 和 case manifest 必须保存在目标仓库中。截图、trace、
Electron result、batch summary、构建产物和依赖目录只保存在被 Git ignore 的运行目录中，
不进入版本控制。

跨机器接力以 protocol 状态为粒度：提交 registry 与对应生成代码后，另一台机器无需复制
`.data/`、`artifacts/`、`dist/` 或 `node_modules/`。运行时文件会在需要时重新生成；它们
不构成 `implemented_verified`、`existing_verified`、`passed` 或 `repaired` 的持久依赖。

### 4.2 仓库

```text
packages/
├── providers/inpage-providers-hub/src/connectButtonHack/
│   ├── defillama-protocols.json
│   ├── universal/
│   │   └── config.ts
│   └── sites/
└── connect-button-lab/
    ├── package.json
    ├── playwright.config.ts
    ├── src/
    │   ├── main.ts
    │   ├── preload.ts
    │   ├── mockWalletHost.ts
    │   ├── stateStore.ts
    │   ├── cli/
    │   │   ├── run-batch.ts
    │   │   ├── sync-registry.ts
    │   │   ├── claim-batch.ts
    │   │   ├── update-protocol.ts
    │   │   ├── validate-registry.ts
    │   │   ├── make-work-packet.ts
    │   │   ├── discover-dapp.ts
    │   │   ├── inspect-wallet-ui.ts
    │   │   ├── synthesize-selector.ts
    │   │   ├── generate-adapter.ts
    │   │   ├── generate-case.ts
    │   │   ├── run-protocol.ts
    │   │   └── diagnose-failure.ts
    │   └── dashboard/
    ├── patterns/
    │   ├── wallet-libraries.json
    │   ├── consent-actions.json
    │   └── connector-mappings.json
    ├── cases/
    │   └── <protocol-slug>.json
    ├── generated/
    │   └── defillama-sites.generated.ts
    ├── tests/
    │   └── protocol-hack.e2e.ts
    └── artifacts/
```

`artifacts/` 保存 screenshot、trace、console log 和失败页面摘要，应加入 `.gitignore`。`cases/*.json` 是可重复测试定义，应提交到仓库。

`generated/defillama-sites.generated.ts` 由 codegen 生成，禁止手工编辑。复杂站点仍写入现有 `sites/*.ts`，但生成程序负责把入口注册到 `connectButtonHack/index.ts`，避免 LLM 手动维护 import/call 列表。

## 5. Registry JSON

### 5.1 顶层结构

```json
{
  "schemaVersion": 1,
  "source": {
    "llmsUrl": "https://api-docs.defillama.com/llms.txt",
    "protocolsUrl": "https://api.llama.fi/protocols",
    "chainsUrl": "https://api.llama.fi/v2/chains",
    "fetchedAt": "2026-07-29T12:00:00.000Z",
    "llmsSha256": "<sha256>",
    "chainsSha256": "<sha256>",
    "protocolsSha256": "<sha256>"
  },
  "settings": {
    "topPerChain": 20,
    "batchSize": 3
  },
  "cycle": {
    "number": 1,
    "kind": "coverage",
    "snapshotAt": "2026-07-29T12:00:00.000Z",
    "startedAt": "2026-07-29T12:00:00.000Z"
  },
  "protocols": []
}
```

### 5.2 Protocol 结构

```json
{
  "id": "182",
  "slug": "aave",
  "name": "Aave",
  "category": "Lending",
  "active": true,
  "sourceUrl": "https://aave.com",
  "sourceHostname": "aave.com",
  "rankings": [
    {
      "chain": "Ethereum",
      "rank": 2,
      "chainTvl": 123456789
    }
  ],
  "priority": {
    "bestRank": 2,
    "rankedChainCount": 1,
    "maxChainTvl": 123456789
  },
  "target": {
    "resolvedDappUrl": null,
    "hostname": null,
    "provider": null,
    "coveredByProtocolId": null
  },
  "coverage": {
    "state": "pending",
    "outcome": null,
    "attempts": 0,
    "runId": null,
    "claimedAt": null,
    "completedAt": null,
    "reason": null
  },
  "implementation": {
    "kind": null,
    "adapterFile": null,
    "walletIds": [],
    "caseFile": null
  },
  "automation": {
    "classification": null,
    "confidence": null,
    "patternId": null,
    "workPacket": null,
    "needsLlm": false
  },
  "evidence": {
    "researchAt": null,
    "screenshots": [],
    "lastE2eAt": null,
    "lastE2eStatus": null,
    "lastE2eCommand": null,
    "scriptedAssertionsPassed": false
  },
  "regression": {
    "cycle": 0,
    "state": "not_due",
    "outcome": null,
    "checkedAt": null
  },
  "history": []
}
```

### 5.3 状态定义

`coverage.state`：

- `pending`：尚未领取。
- `claimed`：当前 run 正在研究或实现。
- `done`：本轮已经形成明确结果。

`coverage.outcome`：

- `implemented_verified`：新增 adapter 且 E2E 通过。
- `existing_verified`：已有 adapter，独立 Electron E2E 通过。
- `native_supported`：站点已有可见、可用的 OneKey 入口，不需要 hack。
- `not_applicable`：没有 dapp、没有钱包连接流程或不是可注入场景。
- `blocked`：登录、地区限制、Cloudflare、站点故障或缺失 URL 等外部原因。

`regression.state`：

- `pending`
- `claimed`
- `done`

回归 outcome：

- `passed`
- `repaired`
- `failed`
- `still_blocked`
- `still_not_applicable`

代码已修改但 E2E 未通过时，不能设置 `coverage.state: done`。应恢复为 `pending`，增加 `attempts`，并记录失败 evidence。

`automation.classification`：

- `standard_library`：识别为已知钱包 UI library，可直接使用 pattern/codegen。
- `generic_modal`：未识别 library，但 wallet modal 和 item DOM 可稳定定位。
- `bespoke`：需要自定义 TypeScript adapter。
- `native_supported`
- `not_applicable`
- `externally_blocked`
- `needs_review`

置信度策略：

- `confidence >= 0.90`：脚本可自动 codegen、build 和 E2E。
- `0.60 <= confidence < 0.90`：脚本生成候选和 work packet，LLM 只选择/微调候选。
- `confidence < 0.60`：不生成代码，输出受限 work packet 交给 LLM 或人工研究。

## 6. Registry 脚本

以下 CLI 均在 `@onekeyfe/connect-button-lab` workspace 中实现和测试。Skill launcher 只调用 workspace 命令。

### 6.0 `run-batch.ts`

这是 skill 的唯一常规项目入口。SKILL.md 不应让 agent 手工串联十几个步骤，而应只调用：

```bash
yarn --cwd packages/connect-button-lab batch \
  --limit 3 \
  --mode auto
```

编排器负责：

1. 检查依赖、worktree 和 schema。
2. 在需要时刷新 cycle snapshot。
3. claim 3 个 primary protocol。
4. 逐个调用 Electron lab CLI。
5. 根据 confidence 选择 auto 或 `needs_llm`。
6. 对 auto protocol 执行 codegen、build、E2E 和状态更新。
7. 为异常生成 bounded work packet。
8. 输出单个机器可读 `batch-result.json` 和一页文本摘要。

进程退出码：

- `0`：三个任务均形成 terminal outcome。
- `2`：有 `needs_llm` work packet，脚本本身正常。
- `3`：有可重试的外部失败。
- `4`：代码生成、build、schema 或 E2E hard failure。

agent 只有在退出码为 `2` 或 `4` 时才加载对应 work packet。退出码为 `0` 时只读取摘要，不读取 protocol 详情。

### 6.1 `sync-registry.ts`

职责：

1. 下载并校验 `llms.txt`。
2. 从文档确认 free API base URL 和 endpoint。
3. 下载 chains 和 protocols。
4. 生成每条链 top 20。
5. 按 protocol ID 合并排名。
6. 规范化 URL 和 hostname。
7. 与已有 registry 合并，不覆盖人工研究、实现和测试状态。
8. 将退出榜单的记录设为 inactive。
9. 用临时文件加 atomic rename 写入 JSON。

建议 CLI：

```bash
yarn --cwd packages/connect-button-lab registry:sync \
  --top 20 \
  --start-cycle
```

要求：

- HTTP timeout。
- 对 `429` 和 `5xx` 做有限指数退避。
- 输出抓取条数、ranking slots、unique protocol 和 diff 摘要。
- 不记录 API key；只使用 free API。
- 使用稳定排序和 2-space JSON。

### 6.2 `claim-batch.ts`

选择顺序：

1. 恢复当前 run 或超过 TTL 的 stale `claimed` 记录。
2. coverage `pending`。
3. 当前 regression cycle 的 `pending`。
4. 若当前周期剩余不足 3 个，结束周期、刷新 registry，并从下一周期补足。

优先级：

```text
bestRank ASC
rankedChainCount DESC
maxChainTvl DESC
protocol.id ASC
```

同一 batch 尽量选择不同 hostname，避免一次只研究同一个 dapp 的多个别名 protocol。

建议 CLI：

```bash
yarn --cwd packages/connect-button-lab registry:claim \
  --limit 3 \
  --run-id 20260729T120000Z
```

### 6.3 `update-protocol.ts`

所有状态写入都通过该脚本完成，避免 agent 直接手工改大 JSON：

```bash
yarn --cwd packages/connect-button-lab registry:update \
  --protocol-id 182 \
  --patch /tmp/aave-result.json
```

脚本必须验证：

- protocol ID 存在。
- 状态转换合法。
- `implemented_verified` 必须包含通过的 E2E evidence。
- `adapterFile` 和 `caseFile` 在仓库中存在。
- history 追加而不是覆盖。

### 6.4 `validate-registry.ts`

验证：

- schema 和 enum。
- chain rank 在 1–20。
- active protocol 至少有一个 ranking。
- ID、slug、hostname 索引无冲突。
- `coveredByProtocolId` 不形成环。
- claimed lock 未无期限遗留。
- terminal outcome 具备 reason/evidence。

### 6.5 Electron Lab CLI

Electron/Playwright 研究也必须通过代码执行，不能默认让 LLM 用 browser tool 逐页探索。

#### `discover-dapp.ts`

输入 protocol source URL，自动：

- 跟随 redirect 并记录最终 URL。
- 从同源或可信子域链接中评分 `app`、`launch app`、`trade`、`stake`、`dashboard`。
- 排除 docs、blog、careers、terms、social links。
- 探测 candidate URL 是否存在 connect-wallet UI。
- 输出最多 5 个候选，不输出完整 HTML。

#### `inspect-wallet-ui.ts`

自动执行有限状态机：

```text
load page
  → dismiss known consent
  → find connect trigger candidates
  → click highest-confidence trigger
  → detect visible dialog/popover/drawer
  → enumerate wallet item candidates
  → identify wallet text/icon/button boundary
  → record DOM fingerprints and screenshots
```

探测过程记录结构化事件，不保存无界 console/DOM 文本。

#### `synthesize-selector.ts`

对 wallet modal、item、text 和 icon 生成 selector candidates，并评分：

- `data-testid`、`id`、`role`、`aria-label` 权重最高。
- 稳定 class token 次之。
- 可见文案和结构关系再次。
- hash class、动态数字和深层 `nth-child` 降权。
- selector 必须当前唯一。
- reload 和重新打开 modal 后仍唯一才标记 stable。

输出 selector、confidence、匹配数量和最小 DOM excerpt。

#### `generate-adapter.ts`

输入结构化 research result，自动选择：

1. 已知 wallet library pattern。
2. Generic universal config。
3. Bespoke adapter template。

前两类直接生成代码。第三类只生成 stub 和 work packet，不由模板猜测业务逻辑。

生成代码应写入单独的机器生成文件，避免使用字符串 patch 修改 5,000+ 行 `universal/config.ts`。推荐由：

```text
cases/*.json
  → generate-adapter.ts
  → generated/defillama-sites.generated.ts
```

`generated/defillama-sites.generated.ts` 在 build 前由脚本重新生成并由 Prettier 格式化。生成器单元测试通过 snapshot 验证输出。

#### `generate-case.ts`

使用 research result 生成 case manifest；不让 LLM重复抄 selector、viewport、setup steps 和 assertions。

#### `run-protocol.ts`

执行单个 protocol 的完整自动管线：

```bash
yarn --cwd packages/connect-button-lab protocol \
  --id 182 \
  --mode auto \
  --json
```

输出固定 schema 的 result JSON，不能把 Playwright 全量日志直接打印进 agent context。

#### `diagnose-failure.ts`

读取 trace、request log、screenshots metadata 和 DOM fingerprints，先用规则分类：

- navigation timeout
- consent blocker
- connect trigger missing
- wallet modal missing
- selector ambiguous
- adapter not applied
- duplicate injection
- provider route mismatch
- site/Cloudflare/geo blocked

只有未分类或需要改 bespoke code 的失败才生成 LLM work packet。

### 6.6 Bounded work packet

`make-work-packet.ts` 为单个 protocol 生成：

```json
{
  "protocol": {},
  "task": "choose_selector|resolve_dapp|implement_bespoke|repair_e2e",
  "researchSummary": {},
  "selectorCandidates": [],
  "domExcerpts": [],
  "existingAdapterExcerpt": null,
  "failureSummary": {},
  "artifactPaths": []
}
```

限制：

- 最多 5 个 selector candidate。
- 最多 3 段 DOM excerpt，每段最多 4 KB。
- existing adapter excerpt 最多 300 行。
- build/test log 只保留 error 周围最多 200 行。
- 不内联 screenshot、trace、完整 HTML 或完整 registry。
- 文本总量默认不超过 50 KB，超过时直接失败并要求诊断脚本进一步裁剪。

## 7. 每次 Skill 执行流程

```text
Locate repo and read project instructions once
  ↓
Run the connect-button-lab batch command with --limit 3 --mode auto
  ↓
If exit 0:
  Read batch summary only
  Report outcomes

If exit 2:
  Read one bounded work packet
  Use LLM/browser/computer only for that protocol
  Write a small structured decision patch
  Resume run-batch with --resume <run-id>

If exit 3:
  Report external retry state from summary

If exit 4:
  Read bounded diagnostics
  Fix generator/harness or bespoke adapter
  Resume targeted stage
```

三个 protocol 由编排器顺序处理，避免同时编辑生成文件和 registry 产生冲突。

每完成一个 protocol 就立即持久化状态。不能等三个全部完成后一次写入，否则中途失败会丢失进度。

LLM 不重复执行脚本已经完成的步骤，也不根据自然语言摘要手工修改 registry。LLM 的输出应是小型 decision JSON、bespoke adapter patch 或 generator/harness 修复。

## 8. Browser / Computer Use 研究规范

默认使用 Electron/Playwright CLI 自动导航、DOM 检查、点击、截图和 selector 验证。

仅当 `run-batch.ts` 生成 `needs_llm` work packet 后才使用 Browser Control。Browser Control 只处理 packet 指定的未决问题，不从头重新研究整个 protocol。

仅在以下情况使用 Computer Use：

- 自动脚本和 Browser Control 都无法完成页面交互。
- work packet 已确认目标元素存在，但 DOM `.click()`、Electron input 或站点事件保护没有
  打开钱包 UI；此时允许大模型直接操作真实 Electron UI，代码点击不是异常研究阶段的
  强制要求。
- 需要操作本地 Electron dashboard 或 DevTools。
- 需要使用 Electron DevTools 或系统级窗口。

脚本为每个 protocol 自动记录：

- DeFiLlama source URL。
- 最终 dapp URL 和 hostname。
- desktop viewport。
- 从首页到 wallet modal 的点击路径。
- cookie/terms 等前置步骤。
- wallet modal 的 title 或稳定容器。
- 原钱包名称、目标联合名称和目标 provider。
- 原生 OneKey 是否已存在。
- 适合的 adapter 方式。
- 一张修改前 screenshot。
- 一张修改后 screenshot。

Browser/Computer Use 得到的新信息必须写回结构化 research result 或 case manifest；不能只保留在对话文本中。

Computer Use 可以负责 `choose_selector`、多阶段弹窗路径和异常站点的实际点击，也可以在
assisted E2E 中驱动 UI。模型点击只能作为交互输入，不能输出或修改 verdict。点击之后的
DOM marker、精确文案/icon、唯一性、provider route、mutation 和 reload 断言仍由
Electron 脚本采集与判定；只有 `scriptedAssertionsPassed: true` 才能完成 protocol。

禁止：

- 登录真实账号。
- 输入 seed phrase、private key 或真实凭据。
- 发起签名、交易或资产操作。
- 绕过地区限制或访问控制。

## 9. Adapter 实现规范

### 9.1 优先级

1. 优先匹配 `patterns/wallet-libraries.json` 中的已知 UI library。
2. 其次由 structured case 生成 generic universal adapter。
3. 只有以下情况才增加手写 `sites/<site>.ts`：
   - WalletConnect QR 解析。
   - 需要克隆或新增 DOM。
   - 需要复杂 Shadow DOM 处理。
   - 需要自定义事件或站点状态判断。

Standard/generic adapter 的唯一手工输入应是结构化 manifest，不应让 LLM直接写重复 TypeScript：

```json
{
  "urls": ["app.example.com"],
  "provider": "ethereum",
  "wallet": "metamask",
  "containerSelector": "div[role=\"dialog\"]",
  "findStrategy": "by-name-and-icon",
  "styleFixes": []
}
```

generator 负责导入 symbol、生成 `WalletInfo`、生成 wallet ID、排序、格式化和去重。

### 9.2 必须满足

- 精确 hostname，不使用宽泛 wildcard。
- 优先稳定 selector：`id`、`data-testid`、`role`、可辨识 modal title。
- 只改钱包 item 内部的 text/icon，尽量保留原 button 和点击 handler。
- 使用 `WALLET_CONNECT_INFO` 统一 icon 和联合名称。
- 使用 `createWalletId()` 生成 `data-wallet-id`。
- 检测已有 OneKey item，避免重复或误导。
- adapter 可重复执行，不能生成重复节点。
- 避免用整个页面的模糊 `innerText.includes()`。
- 选择到多个候选节点时应停止，不应猜测。
- 必要时修正文字 wrapping，但不大范围覆盖站点样式。

上述规则应实现为 adapter manifest schema 和静态 validator，而不是只写在 SKILL.md 里依赖 LLM记忆。

### 9.3 Provider 映射

研究时根据 dapp 原 connector 选择 provider：

- MetaMask / WalletConnect EVM → `ethereum`
- Phantom / Solflare / Jupiter → `solana`
- UniSat → `btc`
- Keplr → `cosmos`
- Petra / Martian → `aptos`
- Sui Wallet / Slush → `sui`
- TronLink → `tron`
- Polkadot.js → `polkadot`
- Nami → `cardano`

WalletConnect 必须区分：

- 只是换联合品牌：保留原 WalletConnect flow。
- 需要 OneKey 直接消费 `wc:` URI：使用现有 private provider 方法并增加专用 E2E。

## 10. 独立 Electron Harness

### 10.1 目标

`packages/connect-button-lab` 同时提供：

- 自动 Playwright Electron E2E。
- 本地 dashboard 手动验证。
- Mock wallet host。
- request/event inspector。

不依赖：

- Chrome extension。
- OneKey app。
- `APP_MONOREPO_LOCAL_PATH`。
- `app-monorepo`。

### 10.2 注入架构

复用当前仓库构建出的：

`packages/injected/dist/injected/injectedExtension.js`

不直接使用 `injectedDesktop.js`，因为它依赖 Electron `<webview>` 的现有 Desktop bridge host。

Harness 的 target BrowserWindow preload 负责模拟 extension content script：

```text
injectedExtension.js in page main world
  ↕ window.postMessage
test preload relay
  ↕ ipcRenderer
Electron main mockWalletHost
```

这样能复用真实：

- `injectWeb3Provider()`
- provider aliases
- `hackAllConnectButtons()`
- `JsBridgeExtInjected`

同时替换掉对真实 extension background 和 wallet backend 的依赖。

### 10.3 安全边界

远程 dapp BrowserWindow：

```ts
{
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
  preload: targetPreloadPath
}
```

要求：

- 只暴露最小 IPC allowlist。
- 页面不能获得 `ipcRenderer`、filesystem 或 Node API。
- 禁止任意 IPC channel passthrough。
- 拒绝 camera、microphone、notifications、clipboard-write 等默认权限。
- 拦截新窗口，在受控 BrowserWindow 中打开或拒绝。
- 默认 dry-run，禁止实际签名和交易。

实现阶段首先做 document-start injection spike。若当前 Electron 版本不能在隔离模式下足够早地把 bundle 注入 main world，应升级 Electron 或使用受控的 `webFrame` main-world execution；不应为了省事给远程页面开启 `nodeIntegration`。

### 10.4 Mock wallet

最小响应：

- `wallet_getConnectWalletInfo`
- `wallet_sendSiteMetadata`
- `metamask_getProviderState`
- `eth_accounts`
- `eth_requestAccounts`
- 各链钱包检测所需的最小 connect/account 方法

固定测试信息：

```json
{
  "isDefaultWallet": true,
  "excludedDappList": [],
  "platformEnv": {
    "isExtension": true,
    "isDesktop": false,
    "isNative": false,
    "isWeb": false
  }
}
```

所有 signing、send transaction 和未知敏感方法默认返回 `userRejectedRequest` 或 `methodNotSupported`。

Mock host 同时保存 request log，供 E2E 断言“点击改写后的原按钮确实进入期望 provider scope”。

## 11. Case Manifest

每个 primary protocol 一个测试定义：

Case manifest 应由 `generate-case.ts` 从 research result 生成。LLM 只在 selector 候选冲突时返回所选 candidate ID，不重新输出整份 JSON。

```json
{
  "protocolId": "182",
  "slug": "aave",
  "url": "https://app.aave.com",
  "viewport": {
    "width": 1440,
    "height": 900
  },
  "setup": [
    {
      "action": "click",
      "selector": "button:has-text(\"Accept\")",
      "optional": true
    }
  ],
  "openWallet": [
    {
      "action": "click",
      "selector": "button:has-text(\"Connect Wallet\")"
    }
  ],
  "assertions": [
    {
      "walletId": "ethereum-onekey-metamask",
      "text": "OneKey & MetaMask",
      "count": 1
    }
  ],
  "clickProbe": {
    "walletId": "ethereum-onekey-metamask",
    "expectedScope": "ethereum",
    "expectedMethods": [
      "eth_requestAccounts",
      "eth_accounts"
    ]
  },
  "timeouts": {
    "navigationMs": 30000,
    "walletModalMs": 15000
  }
}
```

支持的 setup actions 保持有限、可验证：

- `click`
- `fill`
- `waitFor`
- `press`
- `reload`

不允许在 JSON 中放任意 JavaScript。

Schema、action interpreter 和 validator 由代码维护。添加新 action 必须同时增加 schema、执行器单元测试和安全审查，不能由 LLM 在单个 case 中临时发明动作。

## 12. E2E 完成标准

### 12.0 强制使用脚本判定

E2E 的 `pass`、`fail` 和 registry 的 terminal outcome 必须完全由结构化脚本断言产生，
不允许 LLM 或人工查看 screenshot 后判定成功。

该约束不要求所有 UI 操作都必须由代码发起。低置信度异常允许 Browser Control 或
Computer Use 点击真实页面，只要模型点击本身不进入 verdict，最终状态仍完全取决于下列
脚本断言。

判定输入只允许包含：

- DOM 中唯一的 `data-wallet-id`。
- 联合钱包文案与预期值完全匹配。
- icon 的规范化 URL、`src` 或图像 hash 与预期值匹配。
- 同一 `walletId` 的可见元素数量等于 case manifest 的 `count`。
- 重复执行 adapter、触发 DOM mutation 后没有重复 item。
- reload 并重新打开 wallet modal 后断言仍通过。
- 点击原 wallet item 后，mock provider request log 命中预期 scope/method。
- 注入、导航、console error、bot protection 等结构化运行状态。

截图、trace 和裁剪后的 DOM excerpt 只用于：

- 失败 evidence。
- `needs_review` 的 LLM/人工研究。
- Dashboard 手工复核。

截图路径、截图像素或 LLM 对截图的描述禁止进入 pass/fail 判定函数。即使人工确认 UI
“看起来正确”，只要脚本断言没有通过，就不能设置：

- `coverage.outcome: implemented_verified`
- `coverage.outcome: existing_verified`
- `regression.outcome: passed`
- `regression.outcome: repaired`

Case runner 必须输出逐项 assertion result 和稳定的 failure code；registry updater 必须拒绝
没有 `scriptedAssertionsPassed: true` 的上述 terminal outcome。

新增或修复 adapter 后，目标 protocol 必须满足：

1. 构建当前 worktree 的 injected bundle。
2. Electron target window 成功打开真实 dapp。
3. 能按 case manifest 打开 wallet modal。
4. `data-wallet-id` 可见且只出现一次。
5. 文案和 icon 已更新。
6. 重复 DOM mutation 或 reload 后不出现重复 item。
7. 点击 hacked item 后，mock host 捕获到期望 provider scope。
8. 没有发生真实签名或交易。
9. 保存 pass screenshot。
10. targeted test 退出码为 0。

建议命令：

```bash
yarn --cwd packages/injected build-prod
yarn --cwd packages/connect-button-lab test --protocol aave
```

回归分两层：

- 每个 protocol 完成前：只跑 targeted case。
- 每次 3-item batch 结束后：跑本次受影响 adapter 的 targeted cases。
- 全量回归由独立命令或 CI 执行，不在每次 skill 中默认跑全部 1,000+ 站点。

Regression cycle 默认完全由脚本运行。通过的 case 只写紧凑结果；只有失败 case 才运行 `diagnose-failure.ts`。已经能被规则识别并自动修复的变化，例如：

- app URL redirect。
- 稳定 selector 属性变化。
- consent button 文案变化。
- wallet item 顺序变化。

应由 manifest updater/codegen 自动处理并重新测试，不进入 LLM。

外部站点测试失败时必须保存：

- screenshot
- Playwright trace
- final URL
- console errors
- failed step
- selector candidates

## 13. Dashboard

Dashboard 至少提供：

- 当前 cycle、active、pending、verified、blocked 数量。
- 当前 claimed 3 个 protocol。
- 左侧站点列表明确标注“每条受支持链独立 Top 20”，并显示站点总 TVL、主链排名及主链
  TVL；旧 snapshot 尚无总 TVL 时回退显示主链 TVL，不允许出现无 TVL 的活动站点行。
- protocol 的 chain ranks、source URL、resolved dapp URL。
- `Open DApp`、`Reload`、`Open DevTools`。
- 当前页面 request log。
- wallet item 检测结果。
- `Run Case` 和最近一次 E2E 结果。
- 修改前后 screenshot。
- 只允许通过受控 IPC 写 registry 状态。

Dashboard 是人工复核入口，不代替自动 E2E。手工点击“看起来成功”不能把 `implemented_verified` 标为完成。

## 14. 回归循环

Coverage cycle 完成条件：

```text
all active primary protocols have coverage.state == done
```

完成后开始 regression cycle：

1. 刷新 DeFiLlama snapshot。
2. 新进入 top 20 的 protocol 先执行 coverage。
3. 已验证 adapter 运行 live E2E。
4. `blocked` 和 `not_applicable` protocol 做快速重新研究。
5. 站点 URL 或 hostname 变化时重新解析 dapp。
6. E2E 失败时：
   - 若 DOM 改版，修复 adapter 并标记 `repaired`。
   - 若外部阻塞，标记 `still_blocked` 并保存 evidence。
   - 未修复的代码失败标记 `failed`，下次优先处理。

`history` 只保留最近 10 个 cycle 的摘要，完整 screenshot/trace 保存在 artifacts，避免 registry 无限增长。

## 15. Skill 的核心指令

正式 `SKILL.md` 应保持简洁，核心约束如下：

1. 常规入口只运行 connect-button-lab 的 `batch --limit 3 --mode auto`。
2. 退出码为 0 时只读 batch summary。
3. 只有退出码为 2/4 时才读对应 bounded work packet。
4. 不读取完整 registry、HTML、trace 或日志。
5. 不手工执行已有脚本负责的排序、claim、codegen、case 生成和状态写回。
6. 优先修复通用 detector/generator，使同类站点后续无需 LLM。
7. 只有 bespoke adapter 才直接写站点 TypeScript。
8. Browser Control 和 Computer Use 只处理 packet 指定的未决问题。
9. 禁止真实钱包凭据、签名和交易。
10. 没有 E2E pass 不得标记 implemented complete。
11. 外部阻塞必须有 screenshot/reason，不能假装成功。
12. 最终只报告本批结果、异常 packet、代码文件、测试命令和剩余数量。

推荐 frontmatter：

```yaml
---
name: defillama-hack-buttons
description: Run the script-first DeFiLlama connect-button pipeline for cross-inpage-provider: maintain the per-chain top-TVL registry, process up to three protocols, auto-discover wallet UIs, generate standard OneKey adapters and cases, validate them in the standalone Electron harness, and handle only bounded low-confidence exceptions with LLM assistance. Use when Codex needs to expand, verify, repair, or regress dapp connect-button hacks.
---
```

## 16. 分阶段实施

2026-07-29 实施结果：Phase 1–6 的代码路径均已落地并通过 unit/build/registry
validation；Electron 本地完整 case 已通过 10 项 scripted assertions。当前无 CEX 的
1,776 个 active protocol 将由 skill 每批最多 3 个逐步研究，这属于后续重复运行的数据
进度，不是一次实现变更中预先伪造的完成状态。

### Phase 1：Registry

- 初始化 skill。
- 实现 registry CLI 和 `run-batch.ts`。
- 生成第一版 `defillama-protocols.json`。
- 增加 schema validation 和脚本测试。

验收：相同输入生成稳定 JSON，已有状态在 refresh 后不丢失；常规状态更新不需要 LLM。

### Phase 2：Electron 注入 spike

- 创建 `packages/connect-button-lab`。
- 实现安全的 document-start bundle 注入。
- 实现 extension message relay 和 mock wallet。
- 用本地 fixture 页面验证 provider 和 hack observer。
- 提供所有 CLI 的 JSON input/output schema。

验收：不依赖插件和 app-monorepo，mock host 能捕获 `ethereum` request。

### Phase 3：自动研究和 codegen

- 实现 dapp discovery 和 wallet UI inspector。
- 实现 selector scoring 和已知 library patterns。
- 实现 adapter/case generators。
- 增加 generator snapshot tests。

验收：至少两个标准 wallet library 站点可在没有 LLM 的情况下生成 adapter 和 case。

### Phase 4：Live E2E 和 dashboard

- 支持 case manifest。
- 支持真实 dapp BrowserWindow。
- 增加 screenshot、trace 和 request inspector。
- 实现 failure diagnosis 和 bounded work packet。
- 实现 dashboard。

验收：选择一个已有 adapter 和一个新 adapter，均能在 Electron 中自动验证。

### Phase 5：Skill workflow

- 写正式 `SKILL.md` 和 references。
- 接入 claim、研究、实现、E2E、状态更新。
- 用真实 3-protocol batch 前向验证。

验收：一次执行最多研究 3 个 primary protocol；中途失败后下一次可恢复；标准成功路径只向 agent 返回 summary。

### Phase 6：回归循环

- 完成 cycle rollover。
- 刷新排名并处理新增/退出榜单。
- 增加 targeted regression、规则诊断和自动 manifest repair。

验收：人为把当前周期设为完成后，skill 能创建下一周期并选择 3 个 regression task；全部通过时不调用 LLM。

## 17. 最终验收清单

- [x] `llms.txt` 和 free endpoints 都有 hash/timestamp。
- [x] 每条链保留最多 20 个正 TVL 排名。
- [x] protocol ID 去重，chain ranking 不丢失。
- [x] registry 位于 connectButtonHack 根目录。
- [x] 每次最多研究 3 个 primary protocol。
- [x] 状态更新可恢复、原子、可验证。
- [x] 单一 `run-batch.mjs` CLI 可完成正常批次。
- [x] 抓取、排序、claim、扫描、codegen、E2E 和状态写回均有脚本。
- [x] 标准 adapter 和 case 从结构化 manifest 生成。
- [x] 正常成功批次不加载 protocol DOM/trace 到 LLM。
- [x] 低置信度异常只生成不超过 50 KB 的 work packet。
- [x] failure diagnosis 优先使用规则并输出稳定错误分类。
- [x] 已有、原生、不可适配和阻塞情况都有明确 outcome。
- [x] adapter 代码遵守当前 OneKey hack 结构。
- [x] Electron E2E 不依赖 extension 或 app-monorepo。
- [x] 远程 dapp 不获得 Node/Electron 权限。
- [x] E2E 验证 DOM、精确文案/icon、去重、mutation、reload 和 provider route。
- [x] pass/fail 和 verified registry outcome 只读取结构化脚本断言，不读取 screenshot。
- [x] dashboard 可运行单站点/全 catalog 并保留实际 dapp UI 供手动复核。
- [x] 全部 active protocol 完成后进入下一 regression cycle。
