import { runDesktopRecordingE2EModule } from '../../../src/lib/desktop-recording-e2e.mjs';

export const testCase = await runDesktopRecordingE2EModule(import.meta.url, {
  schemaVersion: 1,
  kind: "onekey-connect-button-desktop-e2e",
  source: "custom",
  protocolId: "compound",
  site: "app.compound.finance",
  startUrl: "https://app.compound.finance/?market=usdc-mainnet",
  recordingSha256: "3f6fe432d4e4478982072cd3e9d28950f250d2f0498364937b5e7290b9e2e66b",
  actions: [
    {
      action: "click",
      description: "Open the Compound wallet selection modal",
      locators: [
        {
          kind: "css",
          value: "div:nth-of-type(3) > svg > g:nth-of-type(1) > rect"
        }
      ],
      readiness: true
    }
  ]
});
