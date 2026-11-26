import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createConsoleLogEntry,
  formatConsoleValue,
  hookConsole,
  type ConsoleLogEntry,
} from '../components/consoleUtils.ts';

void test('console logger formats circular objects and hooks console without string evaluation', () => {
  assert.ok(process.execArgv.includes('--disallow-code-generation-from-strings'));

  const value: { nested: { ok: boolean; big: bigint }; self?: unknown } = {
    nested: { ok: true, big: 42n },
  };
  value.self = value;

  const formatted = formatConsoleValue(value);
  assert.equal(formatted.isExpandable, true);
  assert.ok(formatted.detail?.includes('"ok": true'));
  assert.ok(formatted.detail?.includes('"42n"'));
  assert.ok(formatted.detail?.includes('"[Circular]"'));

  const captured: ConsoleLogEntry[] = [];
  const forwarded: unknown[][] = [];
  const fakeConsole = {
    log: (...args: unknown[]) => forwarded.push(args),
    info: (...args: unknown[]) => forwarded.push(args),
    warn: (...args: unknown[]) => forwarded.push(args),
    error: (...args: unknown[]) => forwarded.push(args),
    debug: (...args: unknown[]) => forwarded.push(args),
  };

  const unhook = hookConsole(fakeConsole, (entry) => captured.push(entry));
  fakeConsole.log('hello', value);
  fakeConsole.error(new Error('boom'));
  unhook();
  fakeConsole.log('after-unhook');

  assert.equal(captured.length, 2);
  assert.equal(captured[0].method, 'log');
  assert.equal(captured[0].items[0].preview, 'hello');
  assert.ok(captured[0].items[1].preview.includes('[Circular]'));
  assert.equal(captured[1].method, 'error');
  assert.ok(captured[1].items[0].preview.includes('boom'));
  assert.equal(forwarded.length, 3);

  const directEntry = createConsoleLogEntry('warn', ['note', { a: 1 }]);
  assert.equal(directEntry.method, 'warn');
  assert.equal(directEntry.items[1].preview, '{"a":1}');
});
