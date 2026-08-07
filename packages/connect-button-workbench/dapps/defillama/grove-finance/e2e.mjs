import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "7583",
  site: "app.grove.finance",
  startUrl: "https://app.grove.finance/dashboard",
  recordingSha256: "3a70b241d2f1d63855f68f5387cbfc795115e9f972bdb4acdbcc3119d0c08077",
  actions: [
    {
      action: "click",
      description: "Open the Grove Finance wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(2) > div:nth-of-type(2) > button"
        },
        {
          kind: "role",
          value: "button:CONNECT WALLET",
          role: "button",
          name: "CONNECT WALLET"
        },
        {
          kind: "text",
          value: "CONNECT WALLET"
        }
      ],
      readiness: true
    }
  ]
});
