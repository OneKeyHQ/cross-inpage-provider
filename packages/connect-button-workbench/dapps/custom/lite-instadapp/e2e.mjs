import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "lite-instadapp",
  site: "fluid.io",
  startUrl: "https://fluid.io/1/lending",
  recordingSha256: "63cb9fdefc2ecf6ddd09e653e2f84d958d9661910e0197023f7aed632895522c",
  actions: [
    {
      action: "click",
      description: "Open the Instadapp Lite wallet selection modal",
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
          value: "button:nth-of-type(3)"
        }
      ],
      readiness: true
    }
  ]
});
