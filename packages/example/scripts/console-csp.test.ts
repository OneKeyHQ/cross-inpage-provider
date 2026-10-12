import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Console, Decode, Encode } from 'console-feed';

void test('console-feed loads and preserves circular logs without string evaluation', () => {
  assert.ok(process.execArgv.includes('--disallow-code-generation-from-strings'));
  assert.equal(typeof Console, 'function');

  const value: { nested: { ok: boolean }; self?: unknown } = {
    nested: { ok: true },
  };
  value.self = value;
  const decoded = Decode(Encode({ method: 'log', data: [value] }));
  const data = decoded.data as (typeof value)[];

  assert.equal(decoded.method, 'log');
  assert.equal(data[0].nested.ok, true);
  assert.equal(data[0].self, data[0]);
});
