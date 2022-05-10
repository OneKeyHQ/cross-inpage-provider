import dynamic from 'next/dynamic';
import styles from '../../styles/Home.module.css';
import Link from 'next/link';
import { LogsContainer } from '../../components/LogsContainer';
import { useEffect, useState } from 'react';
import { JsBridgeIframe } from '@onekeyfe/cross-inpage-provider-core';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import * as utils from './utils';
import { sendMethod } from './utils';

declare global {
  interface Window {
    frameBridge?: JsBridgeIframe;
  }
}

export default function () {
  useEffect(() => {
    window.frameBridge = new JsBridgeIframe({
      remoteFrame: parent,
      remoteFrameName: 'HOST',
      selfFrameName: 'FRAME',
      channel: 'onekey-js-sdk',
      receiveHandler(payload) {
        const { method, params } = payload.data as IJsonRpcRequest;
        console.log('receiveHandler >>>>> ', { method, params });
        if (method === 'hi') {
          return 'from FRAME: 99999';
        }
        if (method === 'hello') {
          return { message: 'from FRAME: 88888' };
        }
        if (method === 'error') {
          throw new Error('from FRAME: something is wrong');
        }
      },
    });
  }, []);
  return (
    <div>
      <div className={styles.container}>
        <h2>FRAME</h2>
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
                  window.frameBridge,
                );
              }}
            >
              sendToHost ({method})
            </button>
          );
        })}
      </div>
    </div>
  );
}
