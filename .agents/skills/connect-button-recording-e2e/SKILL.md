---
name: connect-button-recording-e2e
description: Convert an ignored OneKey Desktop connect-button manual recording JSON into a versioned, self-contained CDP E2E script, then validate it against the real OneKey Desktop DApp Browser with deterministic repository-icon DOM detection and bounded Computer Use assistance. Use when a recording must become a repeatable E2E, when a generated connect-button path is failing, or when verifying whether a protocol's connect button hack is implemented.
---

# Connect Button Recording E2E

Turn the current human-recorded path into reviewable code. Recording and normal E2E generation are deterministic and contain no LLM step. The recorder captures bounded locator statistics, a target fingerprint, stable ancestor scopes, open-shadow-host context, and normalized geometry, then marks the first repository-wallet outcome. After saving, Desktop releases the recording partition and invokes the workspace generator. The generator must validate its candidate in a fresh Desktop session, retrying failures up to three times and stopping immediately after the first success, before it can replace the canonical E2E. A target may use one unique locator or multiple independent locator/context signals. If neither can distinguish the target confidently, generation or execution must fail closed instead of guessing. Use LLM judgment only in a separately requested repair workflow. The final pass/fail decision remains local exact DOM matching against repository OneKey and OneKey joint icon sources or exact OneKey wallet IDs produced by `createWalletId()`. Keep exactly one recording and one generated E2E file per source-qualified protocol; overwrite it only after a validation attempt passes. Let Git retain generated E2E revisions.

This workflow is separate from `$defillama-hack-buttons`. Do not change Hack adapters here unless the user separately asks for adapter implementation.

## Workflow

### 1. Locate and validate the recording

Run from the `cross-inpage-provider` repository root:

```bash
node .agents/skills/connect-button-recording-e2e/scripts/recording-tools.mjs list
node .agents/skills/connect-button-recording-e2e/scripts/recording-tools.mjs show --file <relative-recording-file>
node .agents/skills/connect-button-recording-e2e/scripts/recording-tools.mjs audit
```

Read `packages/connect-button-workbench/config/onekey-app-custom-injected.json`; never hard-code a machine path. Resolve `dappsDirectory` and every normalized `protocolSources[].source` beneath this workspace. Desktop stores the current recording at `dappsDirectory/<source>/<protocol-slug>/recording.json`. Treat `<source>:<protocol-slug>` as the DApp key and never resolve an artifact from the slug alone. If the user names a protocol or file, use only that canonical recording. Otherwise choose the most recently finished canonical recording across declared sources and protocols and state the choice. Never generate from a timestamped historical file when the canonical file exists. If a protocol directory contains timestamped recordings from an older build, migrate once:

```bash
node .agents/skills/connect-button-recording-e2e/scripts/recording-tools.mjs migrate-latest
```

Reject a recording unless all of these hold:

- `schemaVersion` is `2` for current recordings or `1` for legacy recordings, and `kind` is `onekey-connect-button-recording`.
- `protocol.source` exactly matches the source directory.
- `runtime.privateSession` is `true`.
- It identifies the protocol, start URL, bundle SHA-256, recording SHA-256, and at least one step.
- Every step is a bounded `click` or control-key `press`; it contains selectors but no entered value.
- Every recorded URL hostname matches the selected protocol.
- A current recording includes an exact `repository-wallet-icon` outcome with the step boundary. Legacy recordings may omit it only when the compiler can identify exactly one connect click.

The Desktop recorder starts a fresh non-persistent Electron partition. Treat this as the clean-state guarantee for cookies, Local Storage, Session Storage, IndexedDB, Cache Storage, and service workers. Do not replace it by clearing the user's shared `persist:onekey` partition.

### 2. Inspect current source and live DOM

Read [recording-schema.md](references/recording-schema.md) and [generated-e2e-contract.md](references/generated-e2e-contract.md). Inspect the relevant site adapter and existing cases. Rebuild the actual custom preload before validation:

```bash
npm --prefix packages/connect-button-workbench run build:desktop-preload
```

Reuse the running Desktop CDP endpoint on `http://127.0.0.1:9222`. Never start a standalone Electron harness. Confirm the target is a real OneKey Desktop `webview`, its hostname matches the recording, its custom-workspace marker is active, and the active preload points into this workspace.

### 3. Generate a versioned E2E

Desktop automatically releases the recording WebView state and then invokes the repository generator after saving a recording. To run the same pure-code compiler directly:

```bash
npm --prefix packages/connect-button-workbench run generate:recording-e2e -- \
  --file packages/connect-button-workbench/dapps/<source>/<protocol-slug>/recording.json
```

The compiler requires every retained action to have either a locator that was unique at recording time or enough independent composite context: multiple locators, a stable ancestor scope, a shadow-host chain, or stable class tokens. It preserves locator strength and match-count metadata plus the bounded target context, trims actions after the recorded wallet outcome, marks exactly one click with `readiness: true`, and writes a temporary compact candidate module. The shared `runDesktopRecordingE2EModule()` helper expands that marker into the standardized readiness action, applies runtime defaults, and owns direct-module execution. The generator syntax-checks the candidate and runs its fixed driver against the real Desktop. The driver creates sequentially named attempts from `clean-session-1` through at most `clean-session-3`, each in a fresh WebView. The first result with `passed: true`, `freshWebView: true`, and either `repositoryIconDetected: true` or `oneKeyWalletIdDetected: true` ends validation successfully; earlier failed attempts are retained as diagnostics. Only then may the compiler atomically replace the canonical E2E. If all three attempts fail, or compilation or result validation fails, it must delete the candidate and leave the previous E2E untouched.

Create or overwrite exactly one canonical file:

```text
packages/connect-button-workbench/dapps/<source>/<protocol-slug>/e2e.mjs
```

The generated file is Git-versioned and self-contained. Do not create timestamped E2E copies. Embed the normalized DApp source, compact actions, and source recording SHA-256; never import the ignored JSON at runtime. Import only `runDesktopRecordingE2EModule` from `../../../src/lib/desktop-recording-e2e.mjs` and follow the contract reference exactly. Do not copy validation, main-module detection, readiness expansion, delay defaults, CDP logic, or verdict logic into a DApp file. If the canonical recording SHA differs from the existing E2E SHA, treat that E2E as stale, but preserve it until the new candidate passes validation.

Keep complete generation and validation diagnostics in the existing Desktop/CLI logs. On failure,
also atomically append only the bounded repair reason to
`dappsDirectory/<source>/<protocol-slug>/e2e-failure.json`. This ignored per-DApp artifact keeps the
latest 20 entries, is capped at 64 KiB, and caps each reason at 2,000 characters. It may retain the
phase, stage, clean-session attempt, and failed action description, but must not duplicate full
passes, locator dumps, DOM, form values, cookies, storage, or other page state. Do not delete the
bounded failure history after a later success.

The pure-code compiler applies these rules:

- Prefer unique test IDs, IDs, accessible roles/names, or aria labels over text and structural CSS.
- Preserve all independent target evidence. The runtime resolver ranks visible candidates by locator strength and consensus, then checks tag/role/name/input/class fingerprints, ancestor scopes, and shadow-host ancestry. Geometry is only a weak tie-breaker. Require both the confidence threshold and winner margin; never select the first ambiguous match.
- Mark exactly one retained click with `readiness: true`. Normally mark the wallet-opening click. When that target has role `menuitem` or `option` and an earlier click reveals it, mark the nearest preceding click instead. The shared helper expands this marker into `Escape` against the same ordered locators and timeout, followed by a `3000` ms wait. DApp files must not duplicate the readiness action or its locator list.
- Omit standard generated `timeoutMs`, `waitBeforeMs`, and `waitAfterMs` values from compact DApp actions. The shared helper supplies a `10000` ms action timeout, `2000` ms before the first click, `2000` ms after every click, `750` ms after recorded presses, and `3000` ms after generated readiness. Declare a timing field only for an intentional non-default override allowed by the bounded runtime contract; do not add speculative delays.
- Keep only actions required to reveal the wallet picker.
- Stop at the first appearance of a repository OneKey or joint icon.
- Do not include typing, secrets, wallet selection, signing, approval, or transactions. Terms/privacy acceptance controls and checkbox/radio prerequisites are allowed when they are required to reveal the wallet picker.
- Do not add heuristics for OneKey text, colors, screenshots, image understanding, or remote classification.
- Do not call Desktop APIs or write `manualReview` / registry state.

If automatic generation reports that a step has neither a unique locator nor enough composite target context, rebuild the current preload and re-record once so schema-version-2 context and the outcome marker are present. Do not make the generator click the first ambiguous match. Inspecting live DOM and hand-repairing an E2E is outside the automatic path and requires a separately requested repair task.

Run unit and syntax checks before touching Desktop:

```bash
node --check packages/connect-button-workbench/dapps/<source>/<protocol-slug>/e2e.mjs
node --test packages/connect-button-workbench/tests/desktop-recording-e2e.test.mjs
```

### 4. Validate with CDP and bounded Computer Use

Run the generated script against the real Desktop:

```bash
node packages/connect-button-workbench/dapps/<source>/<protocol-slug>/e2e.mjs
```

For source-qualified selection or repository-wide validation, use the versioned Workbench CLI
instead of writing temporary CDP scripts:

```bash
npm --prefix packages/connect-button-workbench run validate:recording-e2es -- \
  --source <source> --protocol <protocol-id-or-slug>
npm --prefix packages/connect-button-workbench run validate:recording-e2es -- --source <source>
npm --prefix packages/connect-button-workbench run validate:recording-e2es -- --all
```

Add `--dry-run` to resolve every E2E to an exact Desktop protocol without changing the active
protocol or creating a clean session. The CLI verifies that Desktop is attached to this exact
workspace, selects by source-qualified protocol identity (with a unique same-source hostname
fallback for legacy aliases), and emits one JSON batch result. It never writes `e2e-result.json`.
Failed cases append one compact reason to that DApp's ignored `e2e-failure.json`; the full batch
result remains in the normal output.
The reusable CDP and protocol-selection implementations live under
`packages/connect-button-workbench/src/lib/`; do not recreate them in `/tmp` or another skill.

The fixed driver must attempt validation up to three times as the automatic candidate promotion gate and up to five times when a generated E2E is run directly or validation is launched manually. Before each attempt, request a new uniquely named non-persistent partition from OneKey Desktop and refuse to use a WebView until CDP exposes a matching target ID that did not exist before the request. This is the clean-state guarantee for every attempt; never clear or reuse the shared `persist:onekey` partition. Each attempt dispatches real CDP mouse/key input and computes the verdict by loading built `WALLET_CONNECT_INFO`, traversing document and open shadow roots, and matching either an exact image source value or an exact OneKey wallet ID using the same markers as Desktop auto-review. The final result passes as soon as one attempt reports `freshWebView: true` and detects either marker, and the driver must stop without running later attempts. If an attempt fails or throws, retain that failure and continue until the applicable limit. A manual run from Desktop's `Validate E2E` button remains available for rechecking the promoted script.

All Desktop CDP target discovery, WebSocket connection, and individual CDP command waits must have
10-second transport deadlines. Repository-wide validation additionally gives each source-qualified
DApp a 600-second total deadline covering protocol selection and all clean-session attempts. When
that deadline expires, abort the active transport, record the DApp as failed, and continue with the
next selected E2E. DOM action deadlines remain independently bounded by the generated case.

If CDP cannot resolve an action, use Computer Use only to inspect the visible OneKey Desktop and perform at most one obviously safe UI action such as opening a menu, accepting site terms, toggling a prerequisite checkbox/radio, or opening a wallet modal. Never choose a wallet, complete a wallet connection, sign, approve, or submit a transaction. Immediately inspect the resulting DOM through CDP, revise the generated locator, then reload and rerun the entire generated script without Computer Use. A run assisted by Computer Use is diagnostic evidence only and can never be the final passing run.

If neither an exact repository icon nor an exact OneKey wallet ID is present, report `not detected`; do not infer success from pixels or text. If Computer Use and CDP disagree, CDP exact-marker evidence controls the verdict.

### 5. Verify repository boundaries

Run:

```bash
git check-ignore -v packages/connect-button-workbench/dapps/<source>/<protocol-slug>/recording.json
git check-ignore -v packages/connect-button-workbench/dapps/<source>/<protocol-slug>/e2e-failure.json
git check-ignore packages/connect-button-workbench/dapps/<source>/<protocol-slug>/e2e.mjs
git diff --check
```

The first command must show an ignore rule. The second must produce no output. Report the source-qualified DApp key, recording used, generated script path, Desktop target URL, attempt results, matched icon key/source kind, and any diagnostic-only Computer Use action.

## Safety invariants

- Keep CDP on loopback; do not attach to a remote endpoint.
- Do not clear or mutate the user's persistent browser storage.
- Do not read or record form values, wallet data, cookies, storage, clipboard, or network credentials.
- Terms/privacy acceptance controls and checkbox/radio prerequisites are allowed when required to reveal the wallet picker.
- Do not click a wallet entry or any transaction-oriented sign/approve/confirm/send/swap/deposit/withdraw/stake/bridge/buy action.
- Do not make screenshot or LLM output part of pass/fail.
- Do not write `manualReview`; the existing deterministic Desktop auto-review owns that state transition.
