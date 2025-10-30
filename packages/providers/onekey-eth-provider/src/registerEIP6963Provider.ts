import { v4 as uuidV4 } from 'uuid';
import type { ProviderEthereum } from './ProviderEthereum';

const METAMASK_OVERRIDE_HOSTNAMES = [
  'app.layerbank.finance',
  'app.aevo.xyz',
  'shibaswap.com',
  'merlinswap.org',
  'stake.lido.fi',
  'www.lolik.com',
  'www.babylon.magpiexyz.io',
  'www.pendle.magpiexyz.io',
  'omni.apex.exchange',
  'app.dodoex.io',
  'app.jellyverse.org',
  'buidlpad.com',
];
export const METAMASK_UUID = '7677b54f-3486-46e2-4e37-bf8747814f12';

export function registerEIP6963Provider({
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
  provider: ProviderEthereum;
}) {
  if (uuid === METAMASK_UUID && !METAMASK_OVERRIDE_HOSTNAMES.includes(window.location.hostname)) {
    return;
  }

  // EIP-6963: https://eips.ethereum.org/EIPS/eip-6963
  const info = {
    uuid,
    name,
    icon: image,
    rdns,
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
