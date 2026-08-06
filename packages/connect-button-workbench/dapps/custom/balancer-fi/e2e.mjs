import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "balancer-fi",
  site: "balancer.fi",
  startUrl: "https://balancer.fi/pools",
  recordingSha256: "2282c483d734af3f9c5fe1c7a744c749f261d97fc2bad30f3ca99bfa2dee07ec",
  actions: [
    {
      action: "press",
      description: "Wait for the Balancer connect control to finish initializing",
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
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
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
      timeoutMs: 10000,
      waitAfterMs: 1000
    }
  ]
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
