# Registry and manual-review state

The repository registry is:

`packages/providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json`

The skill selector reads this file but never edits, claims, or completes a protocol. This prevents
an interrupted investigation or an explicitly named site from mutating unrelated queue entries.

## Selection rules

- DeFiLlama CEX protocols and chains without a repository-supported provider are filtered during
  registry refresh.
- Runtime support and non-EVM chain aliases come from
  `packages/providers/inpage-providers-hub/src/injected-provider-capabilities.json`.
- EVM candidates require DeFiLlama chain metadata; EIP-155 metadata may identify and deduplicate
  them but cannot create a chain from an ambiguous protocol key by itself.
- A positive, non-CEX `protocol.chainTvls` key can add a chain missing from `/v2/chains` only when
  it exactly matches a configured named-chain alias. Alias TVLs are ranked under one canonical
  chain with `max`, never summed.
- Protocols are hostname-deduplicated during refresh.
- DeFiLlama entries marked `deadUrl`, `deadFrom`, `rugged`, or `deprecated` are excluded before
  global and per-chain ranking.
- Active selection is the union of global protocol-TVL top 1000 and each supported chain's
  chain-TVL top 20. Protocol-level `tvl` is never replaced with chain TVL.
- Reviewed missing URLs come from `packages/connect-button-workbench/dapp-url-resolutions.json`.
  `resolved` entries populate `target.resolvedDappUrl`; `no_runnable_dapp` and `unresolved`
  entries remain non-runnable instead of guessing a hostname.
- Preferred page URL is `target.urlOverride`, then `target.resolvedDappUrl`, then `sourceUrl`.
- A missing `manualReview` object is interpreted as `pending` for backward compatibility.
- `manualReview.state` is `pending`, `processed`, or `unsupported`. `unsupported` is a terminal
  manual state for entries without a usable DApp, such as an informational website only.
- Untargeted runs select at most three active protocols whose coverage and manual review are both
  pending, using `bestRank ASC`,
  `rankedChainCount DESC`, `maxChainTvl DESC`, and numeric `id ASC`.
- `--site` matches protocol ID, slug, exact name, source hostname, or target hostname and returns
  exactly one protocol.

## Allowed persistent user state

The Desktop Custom Injection runtime and toolbar, through the project updater, own:

- `target.urlOverride`
- `manualReview.state`
- `manualReview.reviewedAt`
- `manualReview.reviewedUrl`
- `manualReview.injectedBundleSha256`

Changing `urlOverride` resets manual review to `pending`. Marking `processed` must go through the
existing atomic project updater. It can happen either through the explicit toolbar action or,
while Developer Settings and Custom Injection are both enabled, through the capability-
authenticated isolated-preload event produced when a `MutationObserver` detects an exact OneKey or
`OneKey & …` icon source exported by this repository. The Desktop side must validate the active
session, actual WebView, current protocol URL, and injected bundle before invoking the updater.
This automatic decision is pure local code: it must not call or depend on an LLM, AI/model
inference, remote classifier, or natural-language heuristic.

Marking `unsupported` must also go through the atomic project updater and clears the processed
review metadata. Automatic review must never overwrite `unsupported`; only `pending` may be
automatically promoted to `processed`.

Hack implementation through this skill must not write coverage, automation, evidence, regression,
claims, attempts, or terminal outcomes. In particular, CDP inspection is not E2E evidence and must
never synthesize `scriptedAssertionsPassed`, `implemented_verified`, `existing_verified`, `passed`,
or `repaired`.

Validate the registry after source work:

```bash
npm run hack-buttons:validate
```
