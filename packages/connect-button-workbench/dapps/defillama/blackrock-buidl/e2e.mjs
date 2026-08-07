import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4853",
  site: "stocks.securitize.io",
  startUrl: "https://stocks.securitize.io/trading",
  recordingSha256: "7c97d2bfd3b6b049170f0947b07b5338b7c240588a2aac14e8c71a6f9923997a",
  actions: [
    {
      action: "click",
      description: "Open the BlackRock BUIDL wallet selection modal",
      locators: [
        {
          kind: "testId",
          value: "calculator-cta"
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
          value: "div:nth-of-type(6) > button"
        }
      ],
      readiness: true
    }
  ]
});
