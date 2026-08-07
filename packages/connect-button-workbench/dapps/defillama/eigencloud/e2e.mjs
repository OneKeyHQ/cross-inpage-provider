import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "3107",
  site: "app.eigenlayer.xyz",
  startUrl: "https://app.eigenlayer.xyz/",
  recordingSha256: "c9913ee7947238e02f44c9b8eaba5269a58ff67e49eb1fd1096fa7a27ef6b5cb",
  actions: [
    {
      action: "click",
      description: "Open the EigenCloud wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        },
        {
          kind: "css",
          value: "#root button[class~=\"bg-eigen-500\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"text-white\"]"
        },
        {
          kind: "css",
          value: "#root button[class~=\"border-eigen-500\"]"
        },
        {
          kind: "css",
          value: "header > div > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
