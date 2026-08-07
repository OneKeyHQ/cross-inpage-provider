import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "benqi",
  site: "app.benqi.fi",
  startUrl: "https://app.benqi.fi/savax",
  recordingSha256: "b9e839d7acba9e3089750d9f9d3a816505abc5a2a983ed0328772ed73be3db99",
  actions: [
    {
      action: "click",
      description: "Open the BENQI wallet selection modal",
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
          value: "form > div:nth-of-type(1) > button"
        }
      ],
      readiness: true
    }
  ]
});
