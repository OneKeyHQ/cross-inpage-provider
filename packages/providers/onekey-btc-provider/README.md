# OneKey BTC provider

## `deriveContextHash(appName, context)`

This experimental Babylon API derives a deterministic **32-byte secret** using
HKDF-SHA-256. The public name remains `deriveContextHash` for compatibility with
the [Babylon specification](https://github.com/babylonlabs-io/babylon-toolkit/blob/main/docs/specs/derive-context-hash.md).
The result is sensitive key material, even though the API name includes “Hash”.
Do not log or publish it; use a test wallet when exercising the example page.

```ts
const provider = window.$onekey.btc;
await provider.requestAccounts();
const secret = await provider.deriveContextHash('test-app', 'deadbeef');
// Pass the secret directly to the application that needs it.
```

| Argument / result | Format                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------- |
| `appName`         | 1–64 ASCII bytes; only `a-z`, `0-9`, and `-`                                                  |
| `context`         | 1–1024 decoded bytes, encoded as 2–2048 lowercase hex characters; even length, no `0x` prefix |
| Result            | A 64-character lowercase hex string (`Promise<string>`)                                       |

The wallet binds derivation to its key material, the current canonical BTC
network, the connected public key, `appName`, and `context`. Repeating all inputs
returns the same secret. Changing the network, public key, application name, or
context changes the secret. Network and public key come from the wallet's current
connection, rather than additional dApp parameters. `appName` is a derivation
namespace, not proof of the caller's identity; wallet approval is still required.

## Account and hardware support

- HD software accounts backed by a mnemonic or xpriv are supported.
- OneKey hardware requires an App build containing the
  [hardware integration](https://github.com/OneKeyHQ/app-monorepo/pull/13846),
  **Classic 1s firmware >= 3.21.0**, and **Protocol V1**. The integration uses
  Hardware SDK `1.2.8-alpha.4`; installing this Provider alone does not enable
  hardware derivation in older App builds.
- Other hardware models, Protocol V2, Ledger/Trezor, QR, watching-only,
  imported private-key, and external accounts are unsupported by this integration.
- The App integration supports Bitcoin Mainnet, Testnet, and Signet. SDK Regtest
  support does not add an App Regtest network.

The Provider forwards the request to the wallet. The App validates parameters
before approval/device calls and rejects invalid input with JSON-RPC `-32602`
and a specific message. The SDK enforces firmware and protocol restrictions.
The Provider preserves backend errors, including cancellation and unsupported
method errors; it does not derive a fallback secret when a request fails.

## Example and manual checks

Open the BTC page in the [dApp example](https://dapp-example.onekeytest.com/),
select **Injected OneKey**, connect a test account, and use the
`deriveContextHash` presets. The presets are available after the updated example
is deployed; use `yarn example` for the local version.

1. **Valid and boundary inputs:** approve the normal, 1-byte, and maximum-length
   presets. Each returns 64 lowercase hex characters. Repeat the normal request
   with the same account/network/parameters and compare the results.
2. **Invalid inputs:** run the empty, odd-length, prefixed, uppercase, non-hex,
   and oversized context presets, plus the invalid/oversized application names.
   Expect `-32602` with a parameter-specific message before an approval dialog or
   device request.
3. **Cancellation:** run a valid request and reject it in the App. With supported
   hardware, also cancel PIN/passphrase/device approval. Each request must fail
   without returning a secret; retrying must remain possible.
4. **Hardware restrictions:** test Classic 1s firmware below 3.21.0, another
   model, and Protocol V2. Each must fail without deriving a secret. Test Classic
   1s >= 3.21.0 on V1 separately for successful approval and derivation.
5. **Network binding:** use the existing `switchChain` presets to switch between
   Mainnet, Testnet, and Signet, reconnect if needed, and repeat the same inputs.
   Verify the bound address/network in approval. Secrets must differ between
   networks and reproduce when returning to the original inputs.

Provider regression tests cover the bridge request shape, string result, and
backend error propagation. They do not replace App or physical-device checks.
Related work: [OK-64362](https://onekeyhq.atlassian.net/browse/OK-64362),
[Hardware SDK PR #966](https://github.com/OneKeyHQ/hardware-js-sdk/pull/966).
