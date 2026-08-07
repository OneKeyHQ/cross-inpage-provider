import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "ordinalsmarket",
  site: "satflow.com",
  startUrl: "https://www.satflow.com/",
  recordingSha256: "3c07b5c2857ab8dc86e28becbc542a8baa59fc120df6102a8af3c4638cfbe684",
  actions: [
    {
      action: "click",
      description: "Open the Ordinals Market wallet selection modal",
      locators: [
        {
          kind: "id",
          value: "connect-wallet"
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
        },
        {
          kind: "css",
          value: "header > div:nth-of-type(3) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
