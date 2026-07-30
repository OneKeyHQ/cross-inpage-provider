# Registry and state transitions

The project registry is:

`packages/providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json`

Do not edit it manually. Use the project CLI.

## Task order

DeFiLlama protocols whose normalized `category` is `CEX` are filtered before per-chain top-20
selection and never enter the registry.

1. Resume any persisted claim and reassign it to the current run. This lets a new machine continue
   immediately after an interrupted run without incrementing the attempt counter.
2. Claim active `coverage.state: pending`.
3. Claim current-cycle `regression.state: pending`.
4. After all active work is terminal, refresh the snapshot and start the next regression cycle.

Priority is `bestRank ASC`, `rankedChainCount DESC`, `maxChainTvl DESC`, `id ASC`. A batch claims
at most three primary protocols and prefers distinct hostnames.

## Verified outcomes

`implemented_verified` and `existing_verified` require all of:

- `evidence.lastE2eStatus: passed`
- `evidence.scriptedAssertionsPassed: true`
- a valid case file
- for generated code, an existing adapter source and source manifest

Regression `passed` and `repaired` use the same scripted-evidence gate.

Use:

```bash
npm --prefix packages/connect-button-lab run registry:validate
```

All persisted file references must be repository-relative POSIX paths. Installed dependencies,
build output, screenshots, research results, batch summaries, and work packets are ignored runtime
artifacts and are not required on the next machine.

## OneKey Desktop custom injection

The repository root `onekey-app-custom-injected.json` exposes the registry, the atomic registry
updater, and the generated Desktop preload as repository-relative paths. The Desktop App may only
write `target.urlOverride` and `manualReview` through that updater.

`target.urlOverride` is the first-choice dapp URL and survives DeFiLlama refreshes. Changing it
resets `manualReview` to `pending`.

`manualReview.state` is `pending` or `processed`. A processed review records the reviewed URL,
timestamp, and injected bundle SHA-256. This human state is independent of the scripted evidence
gate above and must never be used to synthesize a verified coverage or regression outcome.
