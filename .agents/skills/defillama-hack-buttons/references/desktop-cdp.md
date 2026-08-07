# OneKey Desktop CDP

From `app-monorepo`, the normal one-command startup is:

```bash
yarn app:desktop
```

Its launch chain reaches `dev:main`, which starts Electron with
`--remote-debugging-port=9222 --remote-debugging-address=127.0.0.1` and Node Inspector on `5858`.
Do not start `yarn app:desktop:web` or `yarn app:desktop:electron` alongside it. Those split commands
are only for explicitly requested independent process debugging. Before starting anything, run
`desktop-cdp.mjs list`; when it succeeds, reuse the existing Desktop instance.

The skill connects to `http://127.0.0.1:9222` by default. Override it with
`--endpoint http://127.0.0.1:<port>` when Desktop uses another port.

## Targets

`list` returns bounded `page` and `webview` metadata. The dapp itself must appear as a `webview`
target. The host `page` owns the development toolbar and `<webview preload="...">` attribute.

```bash
node <skill-dir>/scripts/desktop-cdp.mjs list
node <skill-dir>/scripts/desktop-cdp.mjs preload --site app.example.org
```

`preload` is the direct proof that DApp Browser is pointing at the local custom-injection bundle,
not the built-in Desktop injected file.

The host-page commands inspect the real `All protocols` session and exercise its refresh button:

```bash
node <skill-dir>/scripts/desktop-cdp.mjs protocols
node <skill-dir>/scripts/desktop-cdp.mjs refresh-protocols
```

`protocols` reports a bounded top-10 summary, the exact protocol count, and any protocol-TVL
descending-order violations. `refresh-protocols` opens `All protocols`, clicks its
`Refresh protocols` button, waits for the registry SHA-256 to change, and returns before/after
summaries.

## Safe page operations

```bash
node <skill-dir>/scripts/desktop-cdp.mjs inspect --site app.example.org
node <skill-dir>/scripts/desktop-cdp.mjs open-wallet --site app.example.org
node <skill-dir>/scripts/desktop-cdp.mjs verify --site app.example.org
```

`inspect` returns bounded wallet triggers/options, rendered state, HTML fragments, replacement
markers, the custom-workspace runtime marker, and duplicate IDs. `open-wallet` clicks only an exact
visible enabled connect-wallet trigger; it never clicks a wallet option, terms checkbox, signature
prompt, or transaction action.

The host control allowlist permits `dapp-connection-reject-btn` so an unexpected connection request
can be cancelled. Approval, confirmation, connection, signing, and transaction controls remain
blocked.

If a framework rejects programmatic click, use Computer Use only to open the wallet modal, then
inspect it with CDP.

## Loading a rebuilt preload

The preload is attached when Electron creates the `<webview>`. Building a new file does not update
an existing webview. Use:

```bash
node <skill-dir>/scripts/desktop-cdp.mjs reload --site app.example.org
```

This clicks the custom-injection toolbar reload control, which destroys/recreates the webview. If
the button is unavailable, manually press the toolbar Reload button in OneKey Desktop. Restarting
the whole Desktop app is normally unnecessary.

## Troubleshooting

- Connection refused: from `app-monorepo`, run `yarn app:desktop` once and wait for
  `DevTools listening on ws://127.0.0.1:9222/...`.
- Port `3001`, `5858`, or `9222` already in use: do not launch a second stack. Retry `list` and
  reuse the existing instance, or stop the known development process before restarting it.
- No matching webview: open the target protocol URL in DApp Browser and retry `list`.
- No preload match: custom workspace mode is not enabled or the wrong DApp Browser tab is active.
- Reload button not found: the custom workspace development toolbar is not mounted.
- No wallet trigger: navigate to the dapp page that exposes wallet connection, or use Computer Use
  to reach it without accepting terms or connecting a wallet.
- Verification false: first run `inspect`; distinguish a selector miss, stale preload, hidden clone,
  missing icon mutation, or duplicate wallet marker.

Never expose the CDP port on a non-loopback interface.
