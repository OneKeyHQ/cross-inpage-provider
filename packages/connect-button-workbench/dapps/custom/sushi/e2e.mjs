import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "sushi",
  site: "sushi.com",
  startUrl: "https://www.sushi.com/ethereum/swap",
  recordingSha256: "9d29adfb09aae2478d71139bb5da49c8b57a7671df154d68e4b0e00b6b402671",
  actions: [
    {
      action: "click",
      description: "Replay recorded click on Accept all cookies",
      locators: [
        {
          kind: "role",
          value: "button:Accept all cookies",
          role: "button",
          name: "Accept all cookies"
        },
        {
          kind: "text",
          value: "Accept all cookies"
        },
        {
          kind: "css",
          value: "#radix-_R_2lb_ button[class~=\"bg-blue\"]"
        },
        {
          kind: "css",
          value: "#radix-_R_2lb_ button[class~=\"text-white\"]"
        },
        {
          kind: "css",
          value: "#radix-_R_2lb_ button[class~=\"cursor-pointer\"][class~=\"bg-blue\"]"
        },
        {
          kind: "css",
          value: "div:nth-of-type(7) > div:nth-of-type(2) > div:nth-of-type(2) > button:nth-of-type(1)"
        }
      ]
    },
    {
      action: "click",
      description: "Open the Sushi wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "button:Connect EVM Wallet",
          role: "button",
          name: "Connect EVM Wallet"
        },
        {
          kind: "text",
          value: "Connect EVM Wallet"
        },
        {
          kind: "css",
          value: "div:nth-of-type(2) > div:nth-of-type(2) > div > button"
        }
      ],
      readiness: true
    }
  ]
});
