# Adapter generation

Prefer, in order:

1. Known wallet-library pattern.
2. Generic generated universal adapter.
3. Bespoke TypeScript only for complex Shadow DOM, WalletConnect QR handling, cloned DOM, or
   custom events.

Generated inputs live in `packages/connect-button-lab/manifests/*.json`. The generator writes:

`packages/providers/inpage-providers-hub/src/connectButtonHack/generated/defillama-sites.generated.ts`

Never hand-edit that generated file.

Manifest validation requires exact hostnames, stable selectors, known wallet/provider mappings,
and no arbitrary JavaScript. Case actions are limited to `click`, `fill`, `waitFor`, `press`, and
`reload`.

Use `WALLET_CONNECT_INFO`, preserve the original click handler, mark the replaced element with
`createWalletId()`, and stop rather than guessing when a selector is ambiguous.
