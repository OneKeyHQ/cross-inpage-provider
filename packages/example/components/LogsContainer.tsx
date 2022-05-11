/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
import { Console, Hook, Unhook } from 'console-feed';

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

export const LogsContainer = () => {
  const [logs, setLogs] = useState([]);

  // run once!
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Hook(window.console, (log) => setLogs((currLogs) => [...currLogs, log]), false);
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
        height: 300,
        overflow: 'auto',
      }}
    >
      <div style={{ fontSize: 12 }}>
        <button onClick={() => setLogs([])}>Clear</button>
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
                  const bridge = window?.$onekey?.jsBridge ?? window?.hostBridge;
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
                  bridge?.debugLogger?._debug?.enable(
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
