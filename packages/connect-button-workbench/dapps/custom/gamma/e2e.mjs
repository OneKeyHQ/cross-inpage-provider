import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "gamma",
  site: "gamma.io",
  startUrl: "https://gamma.io/ordinals/collections/soft-eulogies-domain-1-light/items",
  recordingSha256: "b4e8f9147a2184176607884787dd83e7b7a4f040385e5ceecfa82074e270663b",
  actions: [
    {
      action: "click",
      description: "Replay recorded click on button",
      locators: [
        {
          kind: "css",
          value: "#root > div:nth-of-type(4) > div:nth-of-type(2) > div:nth-of-type(1) > button:nth-of-type(2)"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > div:nth-of-type(1) > button:nth-of-type(2)"
        }
      ]
    },
    {
      action: "click",
      description: "Open the Gamma wallet selection modal",
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
          value: "#root > div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(3) > button"
        },
        {
          kind: "css",
          value: "div:nth-of-type(5) > div:nth-of-type(1) > div:nth-of-type(3) > button"
        }
      ],
      readiness: true
    }
  ]
});
