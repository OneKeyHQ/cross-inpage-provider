import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "4133",
  site: "app.ethena.fi",
  startUrl: "https://www.app.ethena.fi/join/3y20d",
  recordingSha256: "645b0779d60399a39c0b78b302489b6bf9bf0732cc1016b1678eac07a1ee9b7a",
  actions: [
    {
      action: "click",
      description: "Open the Ethena USDe wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#headlessui-dialog-panel-_r_6_ button[class~=\"inline-flex\"]"
        },
        {
          kind: "css",
          value: "#headlessui-dialog-panel-_r_6_ button[class~=\"items-center\"]"
        },
        {
          kind: "css",
          value: "#headlessui-dialog-panel-_r_6_ button[class~=\"justify-center\"]"
        },
        {
          kind: "css",
          value: "span:nth-of-type(3) > div > div > div > button"
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
