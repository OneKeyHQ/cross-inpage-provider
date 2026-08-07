import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "meth-mantle",
  site: "app.methprotocol.xyz",
  startUrl: "https://app.methprotocol.xyz/stake",
  recordingSha256: "53e64dc9ba632a01dc5f9020a1573178a41dd51d922f08c6cd8d1c460add5968",
  actions: [
    {
      action: "click",
      description: "Open the mETH wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(3) > div > div > button"
        },
        {
          kind: "role",
          value: "button:Connect Wallet",
          role: "button",
          name: "Connect Wallet"
        },
        {
          kind: "text",
          value: "Connect Wallet"
        }
      ],
      readiness: true
    }
  ]
});
