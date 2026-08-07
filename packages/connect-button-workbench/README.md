# Connect Button Workbench

Repository tooling and versioned DApp work units for OneKey Desktop connect-button development.
All interactive research, recording, and E2E validation runs in the real OneKey Desktop DApp
Browser.

## Build the Desktop preload

From the repository root:

```bash
npm --prefix packages/connect-button-workbench run build:desktop-preload
```

The build generates the adapter entry from `dapps/<source>/<slug>/adapter.ts`, type-checks the
adapter sources, and builds `packages/injected/dist/injected/injectedDesktopPreload.js` for the
OneKey Desktop Custom Injection workflow.

Enable Developer Settings in OneKey Desktop, select this repository in `Custom Injection`, and
reload the DApp Browser WebView after each build.

## Adapter sources

Each hand-maintained adapter lives at:

```text
dapps/<source>/<slug>/adapter.ts
```

Provider builds scan those source-qualified directories and create an ignored compilation mirror
under `packages/providers/inpage-providers-hub/src/connectButtonHack/generated/`. Do not edit or
commit the generated mirror.

Useful checks:

```bash
npm --prefix packages/connect-button-workbench run generate:adapter-entry
npm --prefix packages/connect-button-workbench run typecheck:adapters
npm --prefix packages/connect-button-workbench run test:adapters
```

## Registry tools

The Custom Injection manifest,
`packages/connect-button-workbench/config/onekey-app-custom-injected.json`, declares every
protocol registry and its updater. Keep registry operations deterministic and atomic:

```bash
npm run hack-buttons:sync
npm run hack-buttons:validate
```

OneKey Desktop invokes `registry:custom-injected` with the expected registry digest when it updates
a URL override or manual-review state.

## Recording E2E

OneKey Desktop saves the latest canonical recording to:

```text
dapps/<source>/<slug>/recording.json
```

Recordings are ignored. Desktop invokes the configured generator after saving, or the same command
can be run directly:

```bash
npm --prefix packages/connect-button-workbench run generate:recording-e2e -- \
  --file packages/connect-button-workbench/dapps/<source>/<slug>/recording.json
```

Current schema-version-2 recordings keep bounded locator match counts, target fingerprints,
stable ancestor scopes, open-shadow-host chains, and normalized geometry. Generated E2Es preserve
that context. The shared Desktop resolver combines independent evidence and requires a confident
winner with a sufficient margin; duplicate targets that remain indistinguishable fail explicitly
instead of clicking the first DOM match. Legacy schema-version-1 recordings and E2Es remain
supported.

The generator validates a temporary candidate against fresh, non-persistent OneKey Desktop DApp
Browser sessions. It promotes exactly one versioned `e2e.mjs` only after exact repository-icon
detection succeeds. A generated E2E can also be run directly while OneKey Desktop CDP is available:

```bash
node packages/connect-button-workbench/dapps/<source>/<slug>/e2e.mjs
```

Use the shared validator for exact Desktop protocol selection and batch runs:

```bash
npm --prefix packages/connect-button-workbench run validate:recording-e2es -- \
  --source custom --protocol aave-v3
npm --prefix packages/connect-button-workbench run validate:recording-e2es -- --source custom
npm --prefix packages/connect-button-workbench run validate:recording-e2es -- --all
```

`--dry-run` checks discovery, workspace identity, and protocol mapping without switching the active
DApp. The validator prints a single JSON summary and does not create `e2e-result.json` files.

Complete generation and validation output continues through the normal Desktop/CLI logs. In
addition, each failed generation or validation appends only a compact failure reason to the ignored
runtime artifact beside that DApp's recording and E2E:

```text
dapps/<source>/<slug>/e2e-failure.json
```

The file is atomically rewritten, keeps the latest 20 reasons, and has a hard 64 KiB limit. Each
reason is capped at 2,000 characters and may identify the failed stage, clean-session attempt, and
action, but never stores full passes, DOM, form values, cookies, storage, or other page state.
Successful runs do not erase this bounded repair history.

## Tests

```bash
npm --prefix packages/connect-button-workbench test
```

This runs the registry, generator, Desktop CDP driver, adapter-entry, and adapter unit tests. It
does not launch a separate desktop application.
