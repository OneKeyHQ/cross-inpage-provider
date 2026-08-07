import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4867",
  site: "stargate.finance",
  startUrl: "https://stargate.finance/",
  recordingSha256: "cedf7dde178b70bc9378613c05be4360d0f59c1c5044719ec6753665c740a675",
  actions: [
    {
      action: "click",
      description: "Open the Stargate wallet selection modal",
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
          value: "header > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
