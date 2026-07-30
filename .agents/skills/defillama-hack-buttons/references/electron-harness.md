# Electron scripted E2E

The standalone harness is `packages/connect-button-lab`. It bundles the current worktree
`connectButtonHack` source and injects mock providers without the OneKey extension or App.

## Required assertions

- hack bundle injected
- expected visible replacement exists
- exact `data-wallet-id` count
- exact joint wallet text
- OneKey joint icon data/asset source
- unique wallet IDs
- stable after repeated DOM mutation
- stable after reload and reopening the modal
- click reaches the expected mock-provider scope/method

Only `scriptedAssertionsPassed: true` permits verified registry outcomes. Screenshot paths are
excluded from the classifier.

Signing and transaction methods are rejected. Remote pages have no Node integration and receive
no filesystem or unrestricted IPC access.

Useful commands:

```bash
npm --prefix packages/connect-button-lab test
npm --prefix packages/connect-button-lab run inspect:wallet -- --url <url>
npm --prefix packages/connect-button-lab run diagnose -- --result <result.json>
```
