import { v4 as uuidV4 } from 'uuid';
import type { ProviderEthereum } from './ProviderEthereum';

export function registerEIP6963Provider({
  image,
  provider,
}: {
  image: string;
  provider: ProviderEthereum;
}) {
  // EIP-6963: https://eips.ethereum.org/EIPS/eip-6963
  const info = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    uuid: uuidV4(),
    name: 'OneKey',
    icon: image,
    rdns: 'so.onekey.wallet',
  };

  function announceProvider() {
    window.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({ info, provider: provider }),
      }),
    );
  }
  window.addEventListener('eip6963:requestProvider', announceProvider);
  announceProvider();
}
