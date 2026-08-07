import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "defillama",
  protocolId: "2626",
  site: "ether.fi",
  startUrl: "https://www.ether.fi/app/cash/referral?ref_code=04bb2542",
  recordingSha256: "b80c3324b45ed77a4b0432fe6c3f1981f80b6d4f91de19b3f916882083b240c7",
  actions: [
    {
      action: "click",
      description: "Replay recorded click on Get Started",
      locators: [
        {
          kind: "id",
          value: "radix-_r_6_"
        },
        {
          kind: "role",
          value: "button:Get Started",
          role: "button",
          name: "Get Started"
        },
        {
          kind: "text",
          value: "Get Started"
        },
        {
          kind: "css",
          value: "body > div:nth-of-type(2) > div:nth-of-type(2) > button"
        }
      ],
      readiness: true
    },
    {
      action: "click",
      description: "Open the ether.fi Stake wallet selection modal",
      locators: [
        {
          kind: "role",
          value: "menuitem:Connect a Wallet",
          role: "menuitem",
          name: "Connect a Wallet"
        },
        {
          kind: "text",
          value: "Connect a Wallet"
        },
        {
          kind: "css",
          value: "#radix-_r_7_ div[class~=\"relative\"]"
        },
        {
          kind: "css",
          value: "#radix-_r_7_ div[class~=\"select-none\"]"
        },
        {
          kind: "css",
          value: "#radix-_r_7_ div[class~=\"rounded-lg\"]"
        },
        {
          kind: "css",
          value: "div > div:nth-of-type(5) > div > div"
        }
      ]
    }
  ]
});
