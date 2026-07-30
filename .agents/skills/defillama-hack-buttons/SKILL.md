---
name: defillama-hack-buttons
description: Run the script-first DeFiLlama connect-button pipeline for cross-inpage-provider. Use when Codex needs to fetch or refresh per-chain top-TVL protocol coverage, process the next batch of at most three protocols, discover dapp wallet UIs, generate or repair OneKey hack-button adapters and case manifests, run standalone Electron E2E, inspect bounded failure packets, or start a new regression cycle.
---

# DeFiLlama Hack Buttons

Use the repository pipeline as the source of truth. Do not manually reproduce ranking, queue,
selector, codegen, E2E, or registry logic.

## Normal workflow

1. Locate the `cross-inpage-provider` repository.
2. Run:

   ```bash
   node <skill-dir>/scripts/run.mjs
   ```

3. Read only the one-line JSON result. Follow the exact exit-code boundary below.
4. Interpret the exit code:
   - `0`: The launcher has also rebuilt the ignored real Desktop
     `injectedDesktopPreload.js`. Read `summaryFile`. Report up to three terminal outcomes and
     remaining counts. Do not load protocol details.
   - `2`: Do not read the batch result file or summary. Read exactly one returned `workPacket`.
     Resolve only its named task, apply the smallest patch, then rerun this launcher. There is no
     process-resume token; registry state provides recovery.
   - `3`: Read only the one-line `retryCondition` and report or retry the external dependency.
   - `4`: Read only the inline `diagnostics.error`, which is capped at 12 KB. Fix the
     generator/harness or bespoke adapter, then rerun the targeted command. Do not open full
     logs, HTML, traces, registries, or screenshot collections.

The runner enforces `--limit 3`.

## Non-negotiable validation rule

Never decide success by viewing a screenshot. A verified outcome requires
`scriptedAssertionsPassed: true` from Electron E2E. The scripts assert DOM wallet IDs, exact joint
text, joint icon source, uniqueness, mutation stability, reload stability, and mock-provider
routing. Screenshots and traces are failure evidence or manual-review aids only.

Never set `implemented_verified`, `existing_verified`, `passed`, or `repaired` from an LLM or
human visual judgment.

Only inspect a screenshot when one exit-2 work packet explicitly names it and UI research is
necessary. Inspect at most one screenshot per exception. It may guide investigation but must not
determine a success, failure, classification, or terminal registry outcome.

## Exception handling

Use Browser Control or Computer Use only after the runner returns exit `2` with a bounded packet.
Work only on the packet's task:

- `resolve_dapp`
- `choose_selector`
- `implement_bespoke`
- `repair_e2e`

For `choose_selector` or `repair_e2e`, a successful programmatic DOM click is not required. If the
bounded packet shows that the target exists but scripted DOM/Electron input does not open the
wallet UI, use Computer Use to perform the real UI click and research the interaction path. Record
the resulting steps, selectors, and bounded DOM state in the case or adapter code. Computer Use may
drive the exceptional UI interaction, but it must never decide the verdict: completion still
requires Electron to emit `scriptedAssertionsPassed: true`.

Do not read the full registry, full HTML, full trace, or all screenshots. Do not log in, enter
wallet credentials, sign messages, or transact.

Read the matching reference only when needed:

- Registry/state question: [references/registry-schema.md](references/registry-schema.md)
- Adapter/codegen question: [references/adapter-guidelines.md](references/adapter-guidelines.md)
- Electron assertion or failure question:
  [references/electron-harness.md](references/electron-harness.md)

## Maintenance commands

Run these only when the user explicitly asks for that operation or when repairing the pipeline:

```bash
npm run hack-buttons:sync
npm run hack-buttons:validate
npm run connect-button-lab
```

Preserve user changes. Do not commit, push, or open a PR unless asked.
