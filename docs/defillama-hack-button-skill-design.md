# Connect Button Workbench and OneKey Desktop integration

## Scope

`packages/connect-button-workbench` stores connect-button adapter sources, protocol registries,
recording compilers, and deterministic OneKey Desktop E2E support. It is not a desktop application.
The real OneKey Desktop DApp Browser is the only interactive research and validation environment.

The paired Desktop source lives in `app-monorepo/`. Custom Injection configuration is declared by
`onekey-app-custom-injected.json`, so Desktop never relies on a machine-specific repository path.

## Source ownership

Each DApp has a source-qualified key and directory:

```text
packages/connect-button-workbench/dapps/<source>/<slug>/
├── adapter.ts
├── adapter.<part>.ts
├── adapter.test.ts
├── recording.json
└── e2e.mjs
```

- `adapter.ts` and optional `adapter.<part>.ts` files are the canonical production sources.
- `adapter.test.ts` is versioned adapter coverage.
- `recording.json` is the latest local Desktop recording and is ignored.
- `e2e.mjs` is the versioned, self-contained Desktop CDP test generated from that recording.

Provider builds scan these directories and create an ignored compilation mirror plus a static
entry under `packages/providers/inpage-providers-hub/src/connectButtonHack/generated/`. Generated
provider files must never become hand-maintained sources.

## Adapter workflow

1. Resolve a named or pending protocol from the registries declared in
   `onekey-app-custom-injected.json`.
2. Inspect the actual OneKey Desktop DApp Browser WebView over loopback CDP.
3. Add or repair the smallest source-qualified adapter.
4. Build the real Custom Injection preload:

   ```bash
   npm --prefix packages/connect-button-workbench run build:desktop-preload
   ```

5. Recreate the Desktop WebView and verify exact OneKey replacement DOM and repository icon
   sources through CDP.

CDP inspection is development evidence. It does not write E2E outcomes or coverage state. Manual
review updates use the manifest-configured registry updater, an expected SHA-256 digest, and atomic
file replacement.

## Recording and E2E workflow

The OneKey Desktop developer toolbar records bounded clicks and control-key presses in a fresh,
non-persistent DApp Browser session. It saves one canonical `recording.json` and invokes the
manifest-configured generator.

The generator:

1. validates the recording schema, source-qualified path, URL boundaries, and unique locators;
2. stops at the first exact repository-wallet-icon outcome;
3. emits a temporary self-contained Desktop CDP candidate;
4. creates up to five fresh non-persistent Desktop WebViews;
5. stops after the first deterministic repository-icon match; and
6. atomically replaces the canonical `e2e.mjs` only after a passing attempt.

Failed candidates never replace the last passing E2E. The driver does not type values, select a
wallet, connect an account, sign, approve, or submit a transaction.

## Registry responsibilities

The DeFiLlama registry sync owns ranking, supported-chain filtering, DApp URL resolution, and
schema migration. The Desktop UI reads the declared registries directly and uses
`custom-injected-registry.mjs` for URL overrides and manual-review state.

Normal validation is:

```bash
npm run hack-buttons:validate
git diff --check
```

Registry refresh remains available through `npm run hack-buttons:sync`. Protocol selection for
adapter work is read-only; there is no batch runner that claims protocols or launches a separate
test application.

## Safety boundaries

- CDP is loopback-only and must target a real OneKey Desktop `webview`.
- Remote DApps never receive Node.js access.
- Recordings never persist secrets, typed values, cookies, storage, or wallet actions.
- Runtime verdicts use exact icon sources exported by this repository, not text, screenshots, or
  model inference.
- Existing user changes in both repositories are preserved.
