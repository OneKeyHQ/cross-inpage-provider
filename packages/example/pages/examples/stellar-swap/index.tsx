import dynamic from 'next/dynamic';

const StellarSwapApp = dynamic(() => import('./StellarSwapApp'), { ssr: false });

export default function () {
  return <StellarSwapApp />;
}
