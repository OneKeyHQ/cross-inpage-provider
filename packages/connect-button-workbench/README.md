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

The Custom Injection manifest, `onekey-app-custom-injected.json`, declares every protocol registry
and its updater. Keep registry operations deterministic and atomic:

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

The generator validates a temporary candidate against fresh, non-persistent OneKey Desktop DApp
Browser sessions. It promotes exactly one versioned `e2e.mjs` only after exact repository-icon
detection succeeds. A generated E2E can also be run directly while OneKey Desktop CDP is available:

```bash
node packages/connect-button-workbench/dapps/<source>/<slug>/e2e.mjs
```

## Tests

```bash
npm --prefix packages/connect-button-workbench test
```

This runs the registry, generator, Desktop CDP driver, adapter-entry, and adapter unit tests. It
does not launch a separate desktop application.
