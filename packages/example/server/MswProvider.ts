'use client';

import { handlers } from './worker';
import { useEffect, useState } from 'react';

export default function MswProvider({ children }: { children: React.ReactNode }) {
  const [mocksReady, setMocksReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      void import('msw/browser').then((a) => {
        void a
          .setupWorker(...handlers(window.location.origin))
          .start({
            onUnhandledRequest: (req) => {
              if (req.url.includes('webpack-hot-update.json')) {
                return;
              }
              console.warn('Found an unhandled %s request to %s', req.method, req.url);
            },
          })
          .then(() => setMocksReady(true));
      });
    }
  }, []);

  return mocksReady && children;
}
