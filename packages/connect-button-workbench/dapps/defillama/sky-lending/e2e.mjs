import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "118",
  site: "app.sky.money",
  startUrl: "https://app.sky.money/",
  recordingSha256: "34be63e6266d748f0e1665ee44f84d74c8b41513f61d7514ac728aa20bed64f2",
  actions: [
    {
      action: "click",
      description: "Open the Sky Lending wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "[data-testid=\"widget-container\"] button[class~=\"inline-flex\"]"
        },
        {
          kind: "css",
          value: "[data-testid=\"widget-container\"] button[class~=\"font-circle\"]"
        },
        {
          kind: "css",
          value: "[data-testid=\"widget-container\"] button[class~=\"h-full\"]"
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
          value: "div:nth-of-type(2) > div > div > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
