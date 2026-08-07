import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "6212",
  site: "app.steakhouse.financial",
  startUrl: "https://app.steakhouse.financial/",
  recordingSha256: "6ddf0287acc4dd08455d4d29c8775e790e59b5deaede2fea789c6dc1bca5d313",
  actions: [
    {
      action: "click",
      description: "Open the Steakhouse Financial wallet selection modal",
      locators: [
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
          value: "div:nth-of-type(2) > button"
        }
      ],
      readiness: true
    }
  ]
});
