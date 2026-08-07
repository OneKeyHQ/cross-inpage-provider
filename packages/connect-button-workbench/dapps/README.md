# OneKey DApp connect-button work units

Each DApp entry owns a source-qualified directory, `dapps/<source>/<slug>`. The source and slug are normalized path segments, and `<source>:<slug>` is the unique key. A slug must never be resolved without its source. The directory may contain:

- `recording.json`: ignored, latest manual recording only;
- `e2e-failure.json`: ignored, latest 20 compact failure reasons, at most 64 KiB;
- `e2e.mjs`: versioned, self-contained OneKey Desktop test;
- `adapter.ts`: versioned, canonical bespoke connect-button adapter;
- `adapter.test.ts`: versioned adapter unit test;
- additional `adapter.<part>.ts` implementation modules when one file is not enough.

Legacy hand-maintained adapters live under `custom/`; Desktop's current DeFiLlama workflow writes
under `defillama/`. Additional registries can add another source directory without colliding with
an existing slug.

`adapter.ts` is the only hand-maintained production source. Provider builds scan these directories
and create an ignored internal compilation mirror plus a static import entry. Never edit or commit
that generated mirror.

Each E2E must export its source-qualified test case, import
`../../../src/lib/desktop-recording-e2e.mjs`, and be
executable with Node.

Do not import `recording.json` at runtime or copy form values, cookies, local storage, IndexedDB
data, or other page state into a generated test.

Desktop invokes the workspace `recordingE2EGenerator` after saving the canonical recording. The
generator is deterministic: it requires either a unique recorded locator or enough independent
composite target context for each retained action, stops at the repository-icon outcome, marks one
compact readiness boundary, and writes a temporary candidate. It atomically replaces `e2e.mjs`
only after syntax validation and a successful real Desktop attempt with a fresh non-persistent
WebView and exact repository-icon detection. It tries at most three fresh sessions and stops after
the first success. Every failed generation preserves the previous canonical script and appends one
bounded reason to `e2e-failure.json`; complete diagnostics remain in the normal process logs.

The shared driver only accepts bounded `click` and control-key `press` actions. Its final verdict
is computed locally by matching DOM image sources against the exact OneKey and OneKey joint icon
sources in the built repository `WALLET_CONNECT_INFO`. Every attempt uses a new non-persistent
partition and a new WebView target in the real OneKey Desktop DApp Browser. Direct, manual, and
batch validation keep the normal five-attempt limit. Use `validate:recording-e2es` for exact
source-qualified Desktop selection and multi-DApp runs instead of creating local CDP scripts.
