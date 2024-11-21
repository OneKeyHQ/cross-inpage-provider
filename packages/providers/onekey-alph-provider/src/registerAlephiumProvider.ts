import type { ProviderAlph } from './OnekeyAlphProvider';

export function registerAlephiumProvider(provider: ProviderAlph) {
  function announceProvider() {
    window.dispatchEvent(
      new CustomEvent('announceAlephiumProvider', {
        detail: Object.freeze({ provider }),
      }),
    );
  }
  window.addEventListener('requestAlephiumProvider', announceProvider);
  announceProvider();
}