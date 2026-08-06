import { pathToFileURL } from 'node:url';

import {
  runDesktopRecordingE2EAndExit,
  validateDesktopRecordingE2ECase,
} from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = validateDesktopRecordingE2ECase({
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "benqi",
  site: "app.benqi.fi",
  startUrl: "https://app.benqi.fi/savax",
  recordingSha256: "b9e839d7acba9e3089750d9f9d3a816505abc5a2a983ed0328772ed73be3db99",
  actions: [
    {
      action: "press",
      description: "Wait for the BENQI connect control to finish initializing",
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
      timeoutMs: 10000,
      waitAfterMs: 3000,
      key: "Escape"
    },
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
      timeoutMs: 10000,
      waitAfterMs: 1000
    }
  ]
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runDesktopRecordingE2EAndExit(testCase);
}
