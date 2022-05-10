import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { JsBridgeIframe } from '@onekeyfe/cross-inpage-provider-core';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { sendMethod } from './utils';

declare global {
  interface Window {
    hostBridge?: JsBridgeIframe;
  }
}

export default function () {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  useLayoutEffect(() => {
    if (!iframeRef.current || !iframeRef.current?.contentWindow) {
      console.error('iframe not ready');
      return;
    }
    window.hostBridge = new JsBridgeIframe({
      remoteFrame: iframeRef.current?.contentWindow,
      remoteFrameName: 'FRAME',
      selfFrameName: 'HOST',
      channel: 'onekey-js-sdk',
      receiveHandler(payload) {
        const { method, params } = payload.data as IJsonRpcRequest;
        console.log('receiveHandler >>>>> ', { method, params });
        if (method === 'hi') {
          return 'from HOST: hahahah';
        }
        if (method === 'hello') {
          return { message: 'from HOST: okok' };
        }
        if (method === 'error') {
          throw new Error('from HOST: something is wrong');
        }
      },
    });
  }, []);
  return (
    <div>
      <div className={styles.container}>
        <h2>HOST</h2>
        {['hi', 'hello', 'error'].map((method, index) => {
          return (
            <button
              key={method}
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                void sendMethod(
                  {
                    method,
                    params: [{ index }],
                  },
                  window.hostBridge,
                );
              }}
            >
              sendToFrame ({method})
            </button>
          );
        })}
        <iframe
          ref={iframeRef}
          src={'/iframe/frame'}
          style={{ width: '100%', height: '400px' }}
          frameBorder={0}
        />
        <LogsContainer />
      </div>
    </div>
  );
}
