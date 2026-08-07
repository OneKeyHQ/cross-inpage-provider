import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4409",
  site: "dex.swapdegen.tips",
  startUrl: "https://dex.swapdegen.tips/#/",
  recordingSha256: "b1a6638d01149f74ef8ccc3913ffd929ee10ddcc4606350fb8a0fb5e9e38c976",
  actions: [
    {
      action: "click",
      description: "Open the DegenSwap wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#swap-page button[class~=\"sc-1pv9wit-2\"]"
        },
        {
          kind: "css",
          value: "#swap-page button[class~=\"dAOczQ\"]"
        },
        {
          kind: "css",
          value: "#swap-page button[class~=\"cXTJXh\"][class~=\"sc-1pv9wit-2\"]"
        },
        {
          kind: "css",
          value: "div:nth-of-type(3) > button"
        },
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        }
      ],
      readiness: true
    }
  ]
});
