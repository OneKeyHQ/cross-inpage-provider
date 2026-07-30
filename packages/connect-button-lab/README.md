# Connect Button Lab

Standalone Electron dashboard, scripted E2E harness, and DeFiLlama batch pipeline for the
current worktree's `connectButtonHack` implementation. It does not require the OneKey browser
extension or `app-monorepo`.

## Open the dashboard

From the repository root:

```bash
npm run connect-button-lab
```

The first build runs `npm ci` automatically when the lockfile has not been installed on the
current machine. `node_modules/` remains local and ignored.

The dashboard loads the current hack bundle and the active DeFiLlama registry. Local hack source
never adds sites to the list. It only supplies implementation and E2E case data for matching
protocols. The dashboard supports:

- `Run selected` for one test-ready protocol and `Run all ready` for every protocol with a
  generated scripted case.
- A collapsible chain-grouped protocol list ordered by DeFiLlama chain TVL. Each row shows the
  site's total TVL and primary-chain rank/TVL. EVM chains share one `EVM Networks` group; non-EVM
  chains keep their own groups.
- `Refresh` fetches the current DeFiLlama and EIP-155 sources, merges the registry without losing
  completed work, and rebuilds the visible catalog without restarting Electron.
- Clicking a protocol immediately loads or reloads its URL in the live webview for manual preview;
  `Run selected` remains the separate entry point for scripted E2E.
- A live, interactive dapp webview that remains available after the test.
- Registry cycle/progress, protocol metadata, live provider requests, console events, and
  per-assertion results.
- Reload, screenshots, and guest DevTools for manual investigation.
- Generated DeFiLlama cases as soon as they exist in `cases/*.json`.

Dashboard interaction is a review surface only. Clicking or visually confirming a page never
changes a protocol to a verified outcome.

## Run deterministic E2E

```bash
npm run connect-button-lab:test
npm --prefix packages/connect-button-lab run test:site -- --site <protocol-id-or-resolved-hostname>
npm run connect-button-lab:test-all
```

The local smoke test opens the wallet modal and runs ten scripted assertions:

- injection succeeded;
- a visible replacement exists;
- `data-wallet-id` values are unique;
- exact joint-brand text and SHA-256 icon fingerprint are present;
- repeat mutation does not duplicate entries;
- each case marker occurs exactly once;
- reload and reopen remain stable;
- clicking the hacked item reaches the expected mock provider method.

`passed` is calculated only from these structured assertions. Screenshots are captured after the
verdict and are only failure evidence or a manual-review entry point; pixels and LLM descriptions
are never pass/fail inputs.

Results are written to `.data/results.json`. Screenshots are written to `artifacts/`. Both
directories are ignored by Git.

## Validate the real Desktop injection

The repository root `onekey-app-custom-injected.json` is the contract used by OneKey Desktop's
`custom-injected` developer mode. It points to the versioned DeFiLlama registry, the atomic
registry editor, and the locally generated `injectedDesktopPreload.js`.

Open the workspace with a URL-encoded absolute path:

```text
onekey-wallet://custom-injected?workspace=%2Fabsolute%2Fpath%2Fto%2Fcross-inpage-provider
```

The Desktop App requires enabled developer settings and an explicit confirmation before reading
or executing workspace content. After confirmation it opens the selected protocol as a normal tab
inside the existing DApp Browser and renders the developer toolbar at the bottom of that browser.
It must not open a separate WebView modal or maintain a second provider bridge. The DApp Browser
toolbar can navigate protocols, override an incorrect DeFiLlama dapp URL, reload a changed preload
bundle, and mark the independent human review state as pending or processed. URL and review edits
are atomically persisted to the versioned registry; they never replace scripted E2E evidence.

A successful repo skill batch automatically rebuilds this ignored preload in production mode from
the current workspace source and syntax-checks both the provider string and Electron preload. To
rebuild it without claiming another protocol batch:

```bash
npm --prefix packages/connect-button-lab run build:desktop-preload
```

## Run the DeFiLlama workflow

The registry is stored at:

```text
packages/providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json
```

Commands from the repository root:

```bash
npm run hack-buttons:sync
npm run hack-buttons:validate
npm run hack-buttons:batch
```

`hack-buttons:batch` atomically claims and processes at most three protocols. The normal path is
fully scripted: dapp discovery, wallet UI inspection, selector synthesis, manifest/code
generation, Electron E2E, failure classification, and registry update. A low-confidence exception
returns exit code `2` with a bounded work packet under `.data/work-packets/`.

Batch summaries are written under `.data/batches/`. When all active coverage tasks are complete,
the next run refreshes the DeFiLlama snapshot and starts a regression cycle.

Both CLI and Dashboard refreshes discover `packages/providers/onekey-*-provider/package.json`
files as the repository's chain-support evidence. EIP-155 chains are accepted when the Ethereum
provider package is present. Supported non-EVM chain names are mapped to their matching local
provider package. Chains without a repository provider are filtered before top-20 ranking, so
their protocols never enter the active queue or Dashboard catalog. The ranking limit is applied
independently to every supported chain; it is not a global top-20 across all sites.

After ranking, protocols that resolve to the same normalized hostname are collapsed into one site.
The representative keeps every source protocol ID and merges the best ranking for each supported
chain. A representative change on a later refresh carries forward the strongest completed or
in-progress state from its hostname aliases. The catalog repeats this deduplication defensively for
registries created by older versions of the pipeline.

## Automatic continuation on another machine

Commit the registry together with generated manifests, cases, adapter source, tests, and the
repo-scoped skill. After another contributor pulls that commit, they only invoke the project skill:

```bash
node .agents/skills/defillama-hack-buttons/scripts/run.mjs
```

The normal batch startup validates the registry and all referenced persistent files, restores
dependencies from the lockfile when needed, then continues from the next batch of at most three
protocols. A persisted `claimed` protocol from an interrupted run is immediately reassigned to the
new run without incrementing its attempt counter. There is no separate transfer or handoff mode.

All committed file references are repository-relative POSIX paths. Registry validation rejects
machine-local paths such as `/Users/...` or `C:\...`. Missing ignored screenshots, work packets,
build output, and installed dependencies never invalidate completed progress; dependencies and
build output are recreated automatically.

## Version-control boundary

The only persistent workflow state committed to Git is
`connectButtonHack/defillama-protocols.json`. Source code, deterministic patterns, generated
adapter manifests/cases, tests, documentation, and the repo-scoped
`.agents/skills/defillama-hack-buttons` skill are also versioned.

Screenshots, Electron results, batch summaries, work packets, research captures, traces, coverage,
build output, and installed dependencies are runtime artifacts. They stay under ignored
directories such as `artifacts/`, `.data/`, `traces/`, `dist/`, and `node_modules/`.

## Safety model

The guest page has no Node or Electron access. The harness exposes mock providers only. Account
discovery is deterministic; signing and transaction requests are rejected and are never forwarded
to a real wallet.
