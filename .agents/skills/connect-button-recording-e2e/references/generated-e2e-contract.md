# Generated E2E contract

Use this exact compact module shape:

```js
import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: 'protocol-id',
  site: 'app.example',
  startUrl: 'https://app.example/',
  recordingSha256: '<64 lowercase hex>',
  actions: [
    {
      action: 'click',
      description: 'Open wallet modal',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
          strength: 'semantic',
          uniqueAtRecording: false,
          matchCount: 2,
          visibleMatchCount: 2,
        },
      ],
      target: {
        tag: 'button',
        role: 'button',
        name: 'Connect Wallet',
        stableClassTokens: ['wallet-trigger'],
        scopes: [
          {
            relation: 'ancestor',
            tag: 'section',
            locator: {
              kind: 'testId',
              value: 'account-panel',
              strength: 'stable',
              uniqueAtRecording: true,
              matchCount: 1,
              visibleMatchCount: 1,
            },
          },
        ],
      },
      readiness: true,
    },
  ],
});
```

Store it only as `dappsDirectory/<source>/<protocol-slug>/e2e.mjs`, next to the ignored `recording.json`. The static `source` must match the source directory and the recording's `protocol.source`. Regeneration overwrites the same Git-versioned file. Desktop enables validation only when `recordingSha256` equals the SHA-256 of the canonical current recording.

The configured `recordingE2EGenerator` compiles this module without LLM assistance after Desktop atomically saves `recording.json` and releases the recording partition. It must write and syntax-check a temporary `.mjs`, then execute that candidate against the real Desktop in up to three sequential clean-session attempts. Each failed attempt is retained, and the first attempt reporting `passed: true`, `freshWebView: true`, and either `repositoryIconDetected: true` or `oneKeyWalletIdDetected: true` ends validation immediately. Source, protocol, hostname, and recording SHA must match the candidate. It may atomically promote the candidate to `e2e.mjs` only after that gate passes. If all three attempts fail, or result validation fails, the candidate is removed and the existing canonical file is preserved.

Only `click` and recorded `press` actions are accepted in the compact definition. A recorded
`press` additionally needs an allowed `key`. Each action needs a concise description and 1-8
ordered locator candidates. Newly compiled actions preserve locator strength, recording-time
uniqueness/counts, and a bounded target fingerprint with optional ancestor scopes, shadow-host
ancestry, and normalized geometry. Legacy actions without this metadata retain their existing
first-locator-that-resolves-uniquely behavior.

For enhanced actions, the driver gathers every visible candidate across the document and open
shadow roots. It combines independent locator evidence and then verifies the target fingerprint,
ancestor scopes, and shadow-host ancestry. Stable identity and anchored context outweigh semantic
name and structural CSS; geometry can contribute only a weak tie-break. Resolution requires a
score of at least 90 and a margin of at least 25 over the runner-up. Missing targets, low-confidence
matches, and indistinguishable duplicates return bounded diagnostics and retry until the action
timeout; they never click the first match. A stable identity can therefore survive accessible-name
drift, while an ambiguous redesign fails explicitly.

Generated actions omit standard timing fields: the shared helper supplies a `10000` ms timeout,
`2000` ms before the first click, `2000` ms after every click, and `750` ms after a recorded press.
Bounded timing fields remain available only for an intentional non-default override.

Every compact generated case must mark exactly one click with `readiness: true`. The shared helper expands that marker into the standardized readiness `press` immediately before the marked click. It uses `Escape`, copies that click's ordered locators and bounded timeout exactly, and sets `waitAfterMs` to `3000`. Normally the marked click is the wallet-opening click. When the wallet-opening target has role `menuitem` or `option` and an earlier click reveals it, the compiler marks the nearest preceding click. This deterministic exception prevents `Escape` from closing a transient menu before its wallet-opening item can be clicked. DApp files must not duplicate the readiness press, its locators, or standard delays.

Terms/privacy acceptance controls and checkbox/radio prerequisites may be included when required to reveal the wallet picker. They must not read or enter values. Wallet selection, completing a wallet connection, signing, approval, and transaction actions remain prohibited.

The shared driver owns clean-state setup. The generator limits candidate promotion validation to three attempts, while direct or manually launched validation retains the default five attempts. Before each attempt, the driver asks Desktop to remount the selected protocol in a new non-persistent partition. It must observe a new CDP WebView target ID for a successful attempt and emit `freshWebView: true`; generated files must not add storage-clearing or reload logic. The driver stops immediately after the first successful attempt.

Repository-wide validation must use `validate:recording-e2es`. That CLI discovers only canonical
`dappsDirectory/<source>/<slug>/e2e.mjs` files, verifies the active Desktop workspace path, maps the
test case to an exact source-qualified Desktop protocol, and uses the same shared five-attempt
driver. It may use a unique same-source hostname mapping only when a legacy E2E protocol ID is an
alias for the Desktop registry ID. Ambiguous mappings fail closed. A dry run performs discovery and
mapping only; neither mode writes validation-result files or registry state.

Desktop CDP target discovery, WebSocket connection, and each CDP command have independent
10-second transport deadlines. Batch validation also applies one 600-second total deadline to each
source-qualified DApp, including protocol selection and all validation attempts. Expiry aborts the
active transport, records a deterministic failure for that DApp, and advances to the next selected
case. These transport and batch deadlines are separate from each action's bounded DOM timeout.

Full generator, direct-run, and batch diagnostics remain in their existing Desktop/CLI output. A
failed generation or validation also atomically appends one compact reason to the ignored
`e2e-failure.json` beside the DApp's `recording.json` and `e2e.mjs`. The file keeps only the latest
20 entries, never exceeds 64 KiB, caps each reason at 2,000 characters, and does not contain full
passes, locators, DOM, input values, cookies, or storage. Later success does not erase this bounded
repair history.

When Desktop reads a persisted schema-version-1 result, it derives the current verdict from the individual passes using the current any-pass-success rule. This keeps historical two-pass results readable: two successful legacy passes remain successful, and a legacy mixed result becomes successful when either pass has valid fresh-WebView repository-icon evidence. New runner output must still stop after its first success.

Do not import anything except `runDesktopRecordingE2EModule` from the shared driver. Do not copy main-module detection, validation calls, timers, or custom CDP expressions into generated files. Do not embed recording paths, input values, icon sources, verdict code, Desktop API calls, or registry writes.
