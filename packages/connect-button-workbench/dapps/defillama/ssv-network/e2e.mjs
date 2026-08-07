import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "6359",
  site: "app.ssv.network",
  startUrl: "https://app.ssv.network/connect",
  recordingSha256: "bf1d24bb859e163f169fb86640e671614c21698eaa29260fc92d31836287aa22",
  actions: [
    {
      action: "click",
      description: "Open the SSV Network wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "main > div > button"
        },
        {
          kind: "dataCy",
          value: "connect-btn"
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
