import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "2929",
  site: "app.spark.finance",
  startUrl: "https://app.spark.finance/",
  recordingSha256: "682aa413bf2581555a9420db7f619e8155530f3f0250613f26e6e79835de70ef",
  actions: [
    {
      action: "click",
      description: "Open the SparkLend wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#root > div > div:nth-of-type(4) > nav > div:nth-of-type(3) > div > button"
        },
        {
          kind: "css",
          value: "nav > div:nth-of-type(3) > div > button"
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
