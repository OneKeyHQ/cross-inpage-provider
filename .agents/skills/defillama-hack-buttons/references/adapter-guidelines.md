# Hack adapter guidelines

## Prefer stable DOM evidence

Research the live modal through OneKey Desktop CDP. Prefer semantic text, stable attributes, and
known wallet-library structure. Avoid generated class names such as styled-components or CSS-module
hashes.

An `id` is not proof of uniqueness. Many dapps keep desktop/mobile or hidden/rendered modal clones
in the DOM. Inspect all matches and select the active copy using:

- computed `display`, `visibility`, and `opacity`
- pointer events
- non-zero geometry
- disabled state when it distinguishes a stale clone
- DOM order when the framework appends the active modal last

Do not blanket-filter disabled buttons. A real rendered wallet option may be disabled until the
user accepts terms, but the Hack still needs to replace its visual text/icon.

## Preserve site behavior

Keep the site's original clickable element and event handler. Change only the existing wallet icon
and text node where possible.

Use:

- `WALLET_CONNECT_INFO` for the supported joint icon/text
- `createWalletId()` and `walletId.updateFlag(element)` for idempotent DOM marking
- existing icon utilities instead of inventing inline assets
- a provider guard when the adapter only applies to a specific injected provider

Mutation observers can call the replacement repeatedly. Check the wallet marker before changing the
DOM and ensure repeated calls do not add wrappers, icons, text, or duplicate wallet IDs.

## Preserve the mutation throttle floor

`hackConnectButton` has a default and hard minimum `throttleDelay` of 600ms. Never lower it to make
an adapter appear more responsive. Mutation-heavy DApps can turn a shorter delay into repeated
full-DOM selector work, causing visible jank and sustained CPU usage. The runtime clamps smaller or
invalid values back to 600ms; adapters may only choose a larger delay.

When an adapter misses a wallet modal or works only after reload, diagnose the actual lifecycle
failure instead: verify the observer target is still connected, preserve pending mutation records,
handle asynchronous layout safely, and make selectors deterministic. Developers and LLM agents
must fix that root cause rather than use a shorter throttle as a timing workaround.

## Choosing the implementation shape

Use an existing universal adapter when a stable, unique selector already fits the dapp. Add a
bespoke `packages/connect-button-workbench/dapps/defillama/<slug>/adapter.ts` adapter when the page has
duplicate IDs, cloned modals, custom Shadow DOM, or a wallet option whose text/icon structure needs
targeted handling. Keep its implementation helpers and `adapter.test.ts` beside it.

A bespoke adapter should:

1. scope `urls` to the exact dapp hostname;
2. declare only the provider families it handles;
3. locate every candidate and choose the actual rendered target;
4. require both expected text and icon nodes before mutating;
5. preserve click behavior and disabled state;
6. set exactly one deterministic `data-wallet-id`;
7. safely no-op before the modal exists and after it is already updated.

The workbench build discovers `dapps/*/*/adapter.ts` and generates an ignored provider compilation
mirror plus static entry. Do not edit the generated mirror or manually register the module in
`connectButtonHack/index.ts`. Do not create Electron cases, generated manifests, traces, or
screenshot fixtures for this workflow.

## Real Desktop verification

After building the custom Desktop preload, use the DApp Browser toolbar reload so the `<webview>` is
destroyed and recreated. A normal in-page refresh can retain the old preload and produce a false
result.

Use CDP to confirm:

- the host `<webview preload="...">` points at the local workspace build;
- the replacement is visible;
- text begins with the expected `OneKey & …`;
- the icon source is the OneKey joint data/asset URL;
- `data-wallet-id` is present and unique;
- reopening the modal does not create duplicates.

This is a development check, not a persisted E2E verdict.
