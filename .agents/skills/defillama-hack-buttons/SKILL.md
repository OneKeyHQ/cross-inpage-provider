---
name: defillama-hack-buttons
description: Resolve a named or recently selected DApp from Custom Injection operation logs, inspect its real wallet UI through OneKey Desktop DApp Browser CDP, implement or repair connect-button Hack adapters, rebuild the real custom injected preload, and verify the replacement DOM in Desktop. Use for protocol button research and Hack code work; this skill intentionally does not author or run standalone Electron E2E.
---

# DeFiLlama Hack Buttons

Use the real OneKey Desktop DApp Browser as the research and development target. Keep protocol
selection, CDP inspection, builds, and validation script-first. The deliverable is Hack source code,
not an E2E case.

## Select targets

If the user names a protocol, URL, or hostname, resolve only that target:

```bash
node <skill-dir>/scripts/run.mjs --site <protocol-or-hostname>
```

Never run or claim an unrelated batch for an explicitly named site.

If the user asks about the current, active, last, or recently used site without naming it, resolve the
last completed protocol selection from the ignored Custom Injection operation logs first:

```bash
node <skill-dir>/scripts/last-log-site.mjs --repo-root <repo-root>
node <skill-dir>/scripts/run.mjs --site <returned-protocol-key>
```

Treat the log result as a target candidate, not proof of the currently rendered page. The resolver
reads the active and rotated JSONL files, prefers the last completed `protocol.select`, and may use a
later same-protocol `pageUrl` as the more specific URL. Do not infer the site from `logs.view`, a
stale failed auto-review, Slack thread history, or the last JSONL line alone. If the resolver finds
no site, do not select an unrelated batch; check the current CDP webviews or ask the user to open the
target.

Otherwise select at most three protocols whose manual review is still pending:

```bash
node <skill-dir>/scripts/run.mjs --limit 3
```

The selector is read-only. It uses
`urlOverride > resolvedDappUrl > sourceUrl`, and orders by DeFiLlama priority. Do not use the old
batch/E2E runner or recreate its state fields.

## Research in OneKey Desktop

The paired Desktop repository for this worktree is `<repo-root>/app-monorepo`, and its expected
feature branch is `feat/custom-injected-webview`. Before changing or starting Desktop, verify it
with:

```bash
git -C <repo-root>/app-monorepo branch --show-current
git -C <repo-root>/app-monorepo status --short
```

Do not substitute a sibling checkout such as `/Users/admin/workspace/app-monorepo`; preserve dirty
user changes in the paired repository.

First check whether the project Desktop instance is already reachable:

```bash
node <skill-dir>/scripts/desktop-cdp.mjs list
```

For a log-resolved target, require the DApp `webview` hostname reported by CDP to match before making
adapter changes. If it differs, report both values and use the actual CDP page only after reconciling
the mismatch; logs identify the last selection but do not observe later manual navigation. Once the
log candidate and CDP page match, freeze that target for the task. Do not chase later log selections
while implementing it. If concurrent navigation changes the webview before verification, safely
reopen the frozen URL or report the mismatch instead of silently switching adapters.

If it succeeds, reuse that instance and do not start another renderer or Electron process. If it
fails because Desktop is not running, start the complete development stack once from
`<repo-root>/app-monorepo`:

```bash
yarn app:desktop
```

This command already builds the main process, starts the renderer, launches Electron, and exposes
CDP on loopback port `9222` (plus Node Inspector on `5858`). Do not also run
`yarn app:desktop:web` or `yarn app:desktop:electron`; mixing the combined and split startup modes
creates duplicate processes and port conflicts. Use the split commands only when the user
explicitly requests independent process debugging, and only after confirming the combined stack
is not running.

With Developer Settings enabled, open the DApp Browser sidebar settings menu, choose
`Custom Injection`, select the repository root, enable it, and save. The setting persists across
restarts but cannot inject while Developer Settings is disabled. The `custom-injected` DeepLink is
only a shortcut to this setting; when its workspace matches the enabled saved config, it may open a
supplied `url` directly.

Use the returned commands, in this order when useful:

```bash
node <skill-dir>/scripts/desktop-cdp.mjs list
node <skill-dir>/scripts/desktop-cdp.mjs preload --site <hostname>
node <skill-dir>/scripts/desktop-cdp.mjs open-wallet --site <hostname>
node <skill-dir>/scripts/desktop-cdp.mjs inspect --site <hostname>
```

CDP is the primary source for DOM structure, rendered state, duplicate IDs, replacement markers,
and the actual preload URL. It observes the real DApp Browser with the same EIP-6963/provider
environment as Desktop.

`open-wallet` only clicks a visible, enabled, exact wallet-connect trigger. If that safe scripted
click does not open the modal, use Computer Use for the single UI interaction, then return to CDP
for DOM inspection. Do not log in, accept terms, select a wallet, sign, or transact. Screenshots are
optional research evidence only.

Read [references/desktop-cdp.md](references/desktop-cdp.md) for connection and troubleshooting.

## Implement the Hack

Inspect existing adapters and use the smallest source change that fits:

1. Reuse a proven universal pattern when selectors are stable and unique.
2. Add or repair `packages/connect-button-workbench/dapps/defillama/<slug>/adapter.ts` for cloned DOM,
   duplicate IDs, bespoke modal structure, or ambiguous library behavior. Keep companion
   `adapter.<part>.ts` and `adapter.test.ts` files in the same DApp directory.
3. Treat that source-qualified DApp file as the only hand-maintained adapter source. The workbench
   build scans `dapps/*/*/adapter.ts` and generates the ignored provider compilation mirror and static entry;
   never edit the generated mirror or manually register imports in `connectButtonHack/index.ts`.

Preserve the original button and click handler. Replace only the wallet text/icon and mark the
result with `createWalletId()`. Use `WALLET_CONNECT_INFO` for OneKey joint branding.

Do not depend on generated CSS hashes or assume HTML `id` values are unique. A temporarily disabled
wallet button may still require a visual replacement. Choose the rendered/active clone using
visibility, opacity, pointer events, geometry, disabled state, and DOM order as the page requires.

Read [references/adapter-guidelines.md](references/adapter-guidelines.md) before implementing a
bespoke adapter.

## Rebuild and verify in Desktop

Build the real preload from the current worktree:

```bash
npm --prefix packages/connect-button-workbench run build:desktop-preload
```

Then destroy and recreate the current DApp Browser webview through its development toolbar and
inspect the new page:

```bash
node <skill-dir>/scripts/desktop-cdp.mjs reload --site <hostname>
node <skill-dir>/scripts/desktop-cdp.mjs open-wallet --site <hostname>
node <skill-dir>/scripts/desktop-cdp.mjs verify --site <hostname>
```

The CDP verdict is a development DOM check only. It confirms the custom-workspace runtime marker, a
visible `OneKey & …` replacement, OneKey joint icon, unique wallet IDs, and current real Desktop
injection. It must not create legacy coverage, regression, automation, evidence, or E2E state.

Do not create case manifests, Electron harness files, screenshots, traces, or E2E scripts. Do not
write `manualReview` directly from this skill or from CDP. When Developer Settings and Custom
Injection are both enabled, the isolated Desktop preload may automatically mark the selected
protocol `processed` after its `MutationObserver` detects an exact OneKey or `OneKey & …` icon
source exported by this repository. That path must still use the existing atomic registry updater
and all session, WebView, URL, and bundle validation. If no repository icon is detected, leave the
protocol pending for the manual toolbar action.

Keep automatic review entirely deterministic and local. Base the decision only on DOM mutation
events and exact icon sources from `WALLET_CONNECT_INFO`. Never call an LLM, AI/model inference,
remote classifier, or natural-language heuristic to decide or write `manualReview`. LLM research
and CDP inspection may help implement an adapter, but neither may participate in the runtime
decision or directly mark a protocol processed.

## Final checks

Run proportionate source checks and:

```bash
npm run hack-buttons:validate
git diff --check
```

Report the adapter changed, build result, CDP preload/result, and anything still requiring manual
interaction. Preserve user changes. Do not commit, push, or open a PR unless asked.

Read [references/registry-schema.md](references/registry-schema.md) only for registry/state
questions.
