import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "balancer-fi",
  site: "balancer.fi",
  startUrl: "https://balancer.fi/pools",
  recordingSha256: "2282c483d734af3f9c5fe1c7a744c749f261d97fc2bad30f3ca99bfa2dee07ec",
  actions: [
    {
      action: "click",
      description: "Open the Balancer wallet selection modal",
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
          value: "div:nth-of-type(3) > div > button:nth-of-type(2)"
        }
      ],
      readiness: true
    }
  ]
});
