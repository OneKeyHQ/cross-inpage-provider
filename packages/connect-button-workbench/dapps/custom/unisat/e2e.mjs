import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "unisat",
  site: "unisat.io",
  startUrl: "https://unisat.io/",
  recordingSha256: "c290142e1bdc461aca5fc1b3e6de3891d61918d3fc7ab0e477d5395712a76f3a",
  actions: [
    {
      action: "click",
      description: "Open the UniSat wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "#__next div[class~=\"button\"]"
        },
        {
          kind: "css",
          value: "#__next div[class~=\"border-btn\"]"
        },
        {
          kind: "css",
          value: "#__next div[class~=\"header_button__4RTji\"]"
        },
        {
          kind: "css",
          value: "body > div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3) > div"
        },
        {
          kind: "text",
          value: "Connect"
        }
      ],
      readiness: true
    }
  ]
});
