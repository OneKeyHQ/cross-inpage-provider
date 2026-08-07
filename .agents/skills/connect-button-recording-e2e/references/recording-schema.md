# Recording schema

Desktop persists a normalized envelope under the manifest's `dappsDirectory` as `<source>/<protocol-slug>/recording.json`. The protocol's normalized source must be declared in `protocolSources[]` and selects the source directory. Only this file is ignored. A new recording atomically replaces it; timestamped recording history is not retained:

```json
{
  "schemaVersion": 2,
  "kind": "onekey-connect-button-recording",
  "protocol": {
    "source": "defillama",
    "id": "protocol-id",
    "name": "Protocol",
    "slug": "protocol",
    "url": "https://app.example"
  },
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
        "inputType": null,
        "stableClassTokens": ["wallet-trigger"],
        "scopes": [
          {
            "relation": "ancestor",
            "tag": "section",
            "locator": {
              "kind": "testId",
              "value": "account-panel",
              "unique": true,
              "matchCount": 1,
              "visibleMatchCount": 1,
              "strength": "stable"
            }
          }
        ],
        "shadowHosts": [],
        "geometry": {
          "centerXRatio": 0.75,
          "centerYRatio": 0.125,
          "widthRatio": 0.125,
          "heightRatio": 0.055556
        },
        "selectors": [
          {
            "kind": "role",
            "value": "button:Connect Wallet",
            "role": "button",
            "name": "Connect Wallet",
            "unique": false,
            "matchCount": 2,
            "visibleMatchCount": 2,
            "strength": "semantic"
          }
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

If Desktop cannot start, stop, sanitize, or save a recording after it has resolved the exact
source-qualified DApp directory, it should keep the complete error in its normal log and append
only the compact recording-phase reason to the ignored sibling `e2e-failure.json`. Use the same
bounded failure-log contract as generation and validation: latest 20 entries, 64 KiB total, and
2,000 characters per reason. Do not store the incomplete capture, DOM, form values, cookies, or
storage in that failure artifact.

Current recordings use schema version 2. The compiler also accepts legacy schema-version-1 files and
infers missing locator strengths and empty target context. Allowed selector kinds are `testId`,
`dataTest`, `dataCy`, `id`, `ariaLabel`, `role`, `text`, and `css`. Each selector records whether it
was unique, total and visible match counts capped at 10,000, and one strength: `stable`, `anchored`,
`class`, `semantic`, or `structural`. Allowed key presses are Enter, Escape, Tab, Space, and arrow
keys. There are at most 100 steps and 8 selectors per target. Unknown fields are removed by the
main process before persistence; the Desktop schema-version-2 sanitizer must preserve every field
shown above.

The recorder generates contextual CSS from stable ancestor `data-testid`, `data-test`, `data-cy`,
`id`, or `aria-label` anchors when the clicked element's own semantic selectors are ambiguous. The
target fingerprint also contains tag, accessible name, role, aria label, non-sensitive input type,
up to 6 stable non-generated class tokens, up to 4 ancestor scopes, up to 4 open shadow hosts with
up to 4 selectors each, and viewport-normalized geometry. Geometry is weak evidence only. The
recorder stores only bounded context; it never persists `outerHTML`, form values, raw XPath,
cookies, storage, or network data.

`outcome.afterStep` is the one-based count of recorded steps present when either an exact repository
OneKey or joint icon, or an exact OneKey wallet ID produced by `createWalletId()`, was first
detected. The version-1 `repository-wallet-icon` kind is retained for file compatibility and now
represents either deterministic repository wallet marker. The pure-code compiler discards any later
recorded modal actions. Legacy recordings may omit `outcome`; they compile only when exactly one
click has connect semantics, or the capture contains a single click.
