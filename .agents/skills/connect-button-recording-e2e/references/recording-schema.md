# Recording schema

Desktop persists a normalized envelope under the manifest's `dappsDirectory` as `<source>/<protocol-slug>/recording.json`. The protocol's normalized source must be declared in `protocolSources[]` and selects the source directory. Only this file is ignored. A new recording atomically replaces it; timestamped recording history is not retained:

```json
{
  "schemaVersion": 1,
  "kind": "onekey-connect-button-recording",
  "protocol": { "source": "defillama", "id": "protocol-id", "name": "Protocol", "slug": "protocol", "url": "https://app.example" },
  "runtime": { "bundleSha256": "<64 lowercase hex>", "privateSession": true },
  "startedAt": "<ISO timestamp>",
  "finishedAt": "<ISO timestamp>",
  "initialUrl": "https://app.example",
  "finalUrl": "https://app.example",
  "title": "Protocol",
  "viewport": { "width": 1280, "height": 720, "deviceScaleFactor": 1 },
  "outcome": { "kind": "repository-wallet-icon", "afterStep": 1 },
  "steps": [
    {
      "action": "click",
      "elapsedMs": 1000,
      "pageUrl": "https://app.example",
      "target": {
        "tag": "button",
        "text": "Connect Wallet",
        "role": "button",
        "ariaLabel": null,
        "selectors": [
          { "kind": "role", "value": "button:Connect Wallet", "role": "button", "name": "Connect Wallet", "unique": true }
        ]
      }
    }
  ]
}
```

`protocol.source` and the normalized form of `protocol.slug` must exactly match the two directory
segments. Normalize the source slug by lowercasing it, replacing each run of non-alphanumeric
characters with `-`, trimming boundary hyphens, and limiting it to 100 characters. For example,
`ether.fi-stake` is stored under `ether-fi-stake`.
The Desktop save API returns a SHA-256 digest alongside the relative file path. The tool
recalculates the digest from file bytes when listing recordings; use that digest as
`recordingSha256` in the generated case.

Allowed selector kinds are `testId`, `dataTest`, `dataCy`, `id`, `ariaLabel`, `role`, `text`, and `css`. Allowed key presses are Enter, Escape, Tab, Space, and arrow keys. There are at most 100 steps and 8 selectors per target. Unknown fields are removed by the main process before persistence.

The recorder generates contextual CSS from stable ancestor `data-testid`, `data-test`, `data-cy`, `id`, or `aria-label` anchors when the clicked element's own semantic selectors are ambiguous. It stores only selector candidates that fit the existing bounded schema; it does not persist `outerHTML`, form values, or raw XPath.

`outcome.afterStep` is the one-based count of recorded steps present when the exact repository OneKey or joint icon was first detected. The pure-code compiler discards any later recorded modal actions. Legacy recordings may omit `outcome`; they compile only when exactly one click has connect semantics, or the capture contains a single click.
