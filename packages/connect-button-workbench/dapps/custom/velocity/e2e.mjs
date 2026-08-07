import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "velocity",
  site: "velocity.exchange",
  startUrl: "https://velocity.exchange/",
  recordingSha256: "22f82d75a18f34adf8f6c40dcd18ffa90dc5623ea9079853a21ac55dac2658ed",
  actions: [
    {
      action: "click",
      description: "Open the Velocity wallet selection modal",
      locators: [
        {
          kind: "testId",
          value: "wallet_button"
        },
        {
          kind: "role",
          value: "button:Connect",
          role: "button",
          name: "Connect"
        },
        {
          kind: "text",
          value: "Connect"
        },
        {
          kind: "css",
          value: "#topbar button[class~=\"justify-center\"]"
        },
        {
          kind: "css",
          value: "#topbar button[class~=\"px-lg\"]"
        },
        {
          kind: "css",
          value: "#topbar button[class~=\"bg-button-primary-bg\"]"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > div > div:nth-of-type(2) > button:nth-of-type(1)"
        }
      ],
      readiness: true
    }
  ]
});
