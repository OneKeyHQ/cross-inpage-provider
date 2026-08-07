import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "aave-v3",
  site: "app.aave.com",
  startUrl: "https://app.aave.com/",
  recordingSha256: "c0a0b54bb3d1634d14dececfa9127653bc72dbd8ef03c79aef4904c0a6f10d1f",
  actions: [
    {
      action: "click",
      description: "Open the Aave V3 wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect wallet",
          role: "button",
          name: "Connect wallet"
        },
        {
          kind: "text",
          value: "Connect wallet"
        },
        {
          kind: "css",
          value: "#__next button[class~=\"MuiButton-gradient\"]"
        },
        {
          kind: "css",
          value: "#__next button[class~=\"MuiButton-gradientPrimary\"]"
        },
        {
          kind: "css",
          value: "#__next button[class~=\"MuiButton-gradientSizeMedium\"]"
        },
        {
          kind: "css",
          value: "header:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
