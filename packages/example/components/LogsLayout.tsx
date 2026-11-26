/* eslint-disable @typescript-eslint/ban-ts-comment */
import React, { useEffect, useState } from 'react';
import { JsBridgeBase } from '@onekeyfe/cross-inpage-provider-core';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ConsoleLogEntry, ConsoleMethod, hookConsole } from './consoleUtils';

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

const METHOD_STYLES: Record<ConsoleMethod, string> = {
  log: 'text-gray-100 border-gray-800',
  info: 'text-sky-300 border-sky-900/60 bg-sky-950/30',
  warn: 'text-amber-300 border-amber-900/60 bg-amber-950/30',
  error: 'text-red-300 border-red-900/60 bg-red-950/40',
  debug: 'text-gray-400 border-gray-800',
};

export const LogsContainer = ({ bridge }: { bridge?: JsBridgeBase } = {}) => {
  const [logs, setLogs] = useState<ConsoleLogEntry[]>([]);

  // run once!
  useEffect(() => {
    return hookConsole(window.console, (entry) => {
      setLogs((currLogs) => [...currLogs, entry]);
    });
  }, []);

  return (
    <div className="bg-black text-white overflow-auto flex flex-col h-full">
      <div className="flex space-x-6 flex-wrap font-size-11 sticky top-0 z-[11] bg-gray-800 p-2">
        <Button variant="destructive" size="sm" onClick={() => setLogs([])}>
          Clear
        </Button>

        {['jsBridge', 'providerBase', 'extInjected'].map((name) => {
          return (
            <div key={name} className="flex items-center space-x-2 min-h-8">
              <label
                htmlFor={name}
                className="p-0 m-0 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {name}
              </label>
              <Checkbox
                id={name}
                defaultChecked={loggers[name]}
                onCheckedChange={(checked) => {
                  // @ts-ignore
                  loggers[name] = Boolean(checked);
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
            </div>
          );
        })}
      </div>

      <div className="flex-grow z-10 font-mono text-xs divide-y divide-gray-800">
        {logs.map((entry) => (
          <div
            key={entry.id}
            className={`px-2 py-1.5 flex items-start gap-2 border-b ${METHOD_STYLES[entry.method]}`}
          >
            <span className="text-gray-500 shrink-0 select-none">{entry.timestamp}</span>
            <span className="uppercase text-[10px] opacity-70 shrink-0 select-none w-10">
              {entry.method}
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-1 min-w-0 break-all">
              {entry.items.map((item, idx) =>
                item.isExpandable && item.detail ? (
                  <details key={idx} className="max-w-full">
                    <summary className="cursor-pointer hover:underline">{item.preview}</summary>
                    <pre className="mt-1 p-2 rounded bg-gray-900 text-gray-200 overflow-x-auto whitespace-pre-wrap break-all">
                      {item.detail}
                    </pre>
                  </details>
                ) : (
                  <span key={idx} className="whitespace-pre-wrap">
                    {item.preview}
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
