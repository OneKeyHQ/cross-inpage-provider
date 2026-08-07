import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "gem",
  site: "opensea.io",
  startUrl: "https://opensea.io/",
  recordingSha256: "3993f4a03355fac468a7046404232e887d824f000a8b1594acb0e6a562c6df2e",
  actions: [
    {
      action: "click",
      description: "Open the Gem wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        },
        {
          kind: "css",
          value: "[aria-label=\"Miscellaneous\"] button"
        },
        {
          kind: "css",
          value: "[aria-label=\"Miscellaneous\"] button[class~=\"inline-flex\"]"
        },
        {
          kind: "css",
          value: "[aria-label=\"Miscellaneous\"] button[class~=\"items-center\"]"
        },
        {
          kind: "css",
          value: "nav > div:nth-of-type(2) > div:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
