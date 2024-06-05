/* eslint-disable @typescript-eslint/restrict-plus-operands,@typescript-eslint/ban-ts-comment */
import React from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { JsBridgeIframe } from '@onekeyfe/cross-inpage-provider-core';
import { IJsonRpcRequest } from '@onekeyfe/cross-inpage-provider-types';
import { sendMethod } from './utils';
import { Button } from '../../ui/button';

declare global {
  interface Window {
    frameBridge: JsBridgeIframe;
    hostBridge: JsBridgeIframe;
  }
}

export default function IFrameExample() {
  useEffect(() => {
    window.frameBridge = new JsBridgeIframe({
      remoteFrame: window.parent,
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
    <div className="flex flex-wrap gap-2">
      {['hi', 'hello', 'error'].map((method, index) => {
        return (
          <Button
            variant="outline"
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
          </Button>
        );
      })}
    </div>
  );
}
