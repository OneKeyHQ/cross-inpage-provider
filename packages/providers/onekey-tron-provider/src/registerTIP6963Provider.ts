import { v4 as uuidV4 } from 'uuid';
import type { ProviderTron } from './ProviderTron';

export function registerTIP6963Provider({
  uuid = uuidV4(),
  name = 'OneKey',
  rdns = 'so.onekey.app.wallet',
  image,
  provider,
}: {
  uuid?: string;
  name?: string;
  rdns?: string;
  image: string;
  provider: ProviderTron;
}) {
  // TIP-6963: https://github.com/tronprotocol/tips/issues/737
  const info = {
    uuid,
    name,
    icon: image,
    rdns,
  };

  function announceProvider() {
    window.dispatchEvent(
      new CustomEvent('TIP6963:announceProvider', {
        detail: { info, provider: provider },
      }),
    );
  }
  window.addEventListener('TIP6963:requestProvider', announceProvider);
  announceProvider();
}
