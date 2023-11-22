/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { useEffect, useState } from 'react';
import { Console, Hook, Unhook } from 'console-feed';
import { JsBridgeBase } from '@onekeyfe/cross-inpage-provider-core';
import { isString } from 'lodash';

const loggers: Record<string, boolean> = {};

function loadLoggersConfig() {
  if (typeof window === 'undefined') {
    return;
  }
  const config = localStorage.getItem('$$ONEKEY_DEBUG_LOGGER') || '';
  config.split(',').map((name) => {
    name = name ? name.trim() : '';
    if (name) {
      loggers[name] = true;
    }
  });
}

loadLoggersConfig();

export const LogsContainer = ({ bridge }: { bridge?: JsBridgeBase } = {}) => {
  const [logs, setLogs] = useState([]);

  // run once!
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Hook(
      window.console,
      (...logs) => {
        setLogs((currLogs) => {
          const newLogs = [...(currLogs || []), ...(logs || [])];
          newLogs.forEach((item) => {
            item.data = (item.data || []).map((content: any, index: number) => {
              try {
                // second console.log params should be string type
                if (index > 0 && !isString(content)) {
                  return JSON.stringify(content);
                }
              } catch (error) {
                // noop
                return `LogsContainer: JSON.stringify error` || 'LogsContainer:  ERROR';
              }
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              return content;
            });
          });
          return newLogs;
        });
      },
      false,
    );
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return () => void Unhook(window.console);
  }, []);

  return (
    <div
      style={{
        background: 'black',
        position: 'relative',
        color: 'white',
        height: 340,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          fontSize: 12,
          position: 'sticky',
          top: 0,
          right: 0,
          left: 0,
          zIndex: 1,
          background: '#333',
        }}
      >
        <button onClick={() => setLogs([])}>Clear</button>{' '}
        {['jsBridge', 'providerBase', 'extInjected'].map((name) => {
          return (
            <label key={name}>
              <input
                type="checkbox"
                defaultChecked={loggers[name]}
                onClick={(e) => {
                  // @ts-ignore
                  loggers[name] = Boolean(e.target.checked);
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
                  const _bridge = bridge ?? window?.$onekey?.jsBridge ?? window?.hostBridge;
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                  _bridge?.debugLogger?._debug?.enable(
                    Object.entries(loggers)
                      .map(([k, v]) => (v ? k : null))
                      .filter(Boolean)
                      .join(','),
                  );
                }}
              />
              {name}
            </label>
          );
        })}
      </div>
      <Console logs={logs} variant="dark" />
    </div>
  );
};
