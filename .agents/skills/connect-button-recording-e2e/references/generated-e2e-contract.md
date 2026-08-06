# Generated E2E contract

Use this exact module shape:

```js
import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: 'onekey-connect-button-desktop-e2e',
  source: 'defillama',
  protocolId: 'protocol-id',
  site: 'app.example',
  startUrl: 'https://app.example/',
  recordingSha256: '<64 lowercase hex>',
  actions: [
    {
      action: 'press',
      description: 'Wait for the connect control to finish initializing',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
        },
      ],
      key: 'Escape',
      timeoutMs: 10000,
      waitAfterMs: 3000,
    },
    {
      action: 'click',
      description: 'Open wallet modal',
      locators: [
        {
          kind: 'role',
          value: 'button:Connect Wallet',
          role: 'button',
          name: 'Connect Wallet',
        },
      ],
      timeoutMs: 10000,
      waitAfterMs: 1000,
    },
  ],
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
```

Store it only as `dappsDirectory/<source>/<protocol-slug>/e2e.mjs`, next to the ignored `recording.json`. The static `source` must match the source directory and the recording's `protocol.source`. Regeneration overwrites the same Git-versioned file. Desktop enables validation only when `recordingSha256` equals the SHA-256 of the canonical current recording.

The configured `recordingE2EGenerator` compiles this module without LLM assistance after Desktop atomically saves `recording.json` and releases the recording partition. It must write and syntax-check a temporary `.mjs`, then execute that candidate against the real Desktop in up to five sequential clean-session attempts. Each failed attempt is retained, and the first attempt reporting `passed: true`, `freshWebView: true`, and `repositoryIconDetected: true` ends validation immediately. Source, protocol, hostname, and recording SHA must match the candidate. It may atomically promote the candidate to `e2e.mjs` only after that gate passes. If all five attempts fail, or result validation fails, the candidate is removed and the existing canonical file is preserved.

Only `click` and `press` actions are accepted. A `press` additionally needs an allowed `key`. Each action needs a concise description and 1-8 ordered locator candidates. The driver uses the first locator that resolves to exactly one visible element across the document and open shadow roots.

Every generated case must include the standardized readiness `press` immediately before a click. It uses `Escape`, copies that following click's ordered locators and bounded timeout exactly, and sets `waitAfterMs` to `3000`. Normally the following click is the wallet-opening click. When the wallet-opening target has role `menuitem` or `option` and an earlier click reveals it, the compiler must instead place readiness immediately before the nearest preceding click. This deterministic exception prevents `Escape` from closing a transient menu before its wallet-opening item can be clicked. The readiness action protects clean sessions from SPA hydration races where a control is visible before its click handler is ready. It is the only generated action that need not appear in the recording. Do not use a custom timer, shorten the wait, or add unrelated speculative delays.

Terms/privacy acceptance controls and checkbox/radio prerequisites may be included when required to reveal the wallet picker. They must not read or enter values. Wallet selection, completing a wallet connection, signing, approval, and transaction actions remain prohibited.

The shared driver owns clean-state setup. It runs up to five attempts and asks Desktop to remount the selected protocol in a new non-persistent partition before each one. It must observe a new CDP WebView target ID for a successful attempt and emit `freshWebView: true`; generated files must not add storage-clearing or reload logic. The driver stops immediately after the first successful attempt.

When Desktop reads a persisted schema-version-1 result, it derives the current verdict from the individual passes using the current any-pass-success rule. This keeps historical two-pass results readable: two successful legacy passes remain successful, and a legacy mixed result becomes successful when either pass has valid fresh-WebView repository-icon evidence. New runner output must still stop after its first success.

Do not add imports beyond `node:url` and the shared driver. Do not use timers or custom CDP expressions in generated files. Do not embed recording paths, input values, icon sources, verdict code, Desktop API calls, or registry writes.
