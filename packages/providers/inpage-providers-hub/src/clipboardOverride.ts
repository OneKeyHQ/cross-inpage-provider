import type { ProviderPrivate } from '@onekeyfe/onekey-private-provider';

// Save original references immediately at module load time,
// before any DApp code can tamper with them.
const originalClipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
const originalExecCommand = typeof document !== 'undefined' ? document.execCommand.bind(document) : undefined;

function createNotAllowedError(): DOMException {
  return new DOMException(
    'Clipboard permission denied by wallet',
    'NotAllowedError',
  );
}

export function injectClipboardOverride($private: ProviderPrivate): void {
  if (typeof navigator === 'undefined') return;
  console.log('[OneKey] Clipboard override: initializing');

  // First decision per (origin, type) sticks for the rest of the page session.
  // Matches Chrome native UX: deny once → deny until reload. Read and write are
  // keyed separately so "allow read" does not implicitly grant write.
  const sessionDecisions = new Map<string, 'allow' | 'deny'>();
  // Coalesces concurrent requests so a burst of readText() calls only opens one
  // modal. Without this, DApps that fire N synchronous readText() calls stack N
  // modals before the first decision can land in sessionDecisions.
  const pendingRequests = new Map<string, Promise<unknown>>();

  const clipboardProxy = {
    async readText(): Promise<string> {
      console.log('[OneKey] Clipboard: readText() intercepted');
      const key = `${window.location.origin}:read`;

      const decision = sessionDecisions.get(key);
      if (decision === 'deny') {
        console.log('[OneKey] Clipboard: readText() - session-denied, short-circuit');
        throw createNotAllowedError();
      }
      if (decision === 'allow') {
        console.log('[OneKey] Clipboard: readText() - session-allowed, native API');
        if (!originalClipboard) {
          throw new DOMException('Clipboard API not available', 'NotSupportedError');
        }
        return originalClipboard.readText();
      }

      const existing = pendingRequests.get(key) as Promise<string> | undefined;
      if (existing) {
        console.log('[OneKey] Clipboard: readText() - coalescing with in-flight');
        return existing;
      }

      console.log('[OneKey] Clipboard: readText() requesting permission');
      const promise = (async (): Promise<string> => {
        try {
          const result = await $private.request({
            method: 'wallet_requestClipboardPermission',
            params: { type: 'read' },
          }) as { allowed?: boolean; content?: string } | undefined;
          console.log('[OneKey] Clipboard: readText() permission result:', result?.allowed);
          const allowed = Boolean(result?.allowed);
          sessionDecisions.set(key, allowed ? 'allow' : 'deny');
          if (!allowed) throw createNotAllowedError();
          return result?.content ?? '';
        } catch (e) {
          if (!sessionDecisions.has(key)) {
            sessionDecisions.set(key, 'deny');
          }
          if (e instanceof DOMException) throw e;
          throw createNotAllowedError();
        }
      })();

      pendingRequests.set(key, promise);
      void promise.finally(() => {
        pendingRequests.delete(key);
      });
      return promise;
    },
    async read(): Promise<ClipboardItems> {
      // ClipboardItems are complex (binary data), not supported through bridge
      // Fall back to readText and wrap as plain text ClipboardItem
      const text = await clipboardProxy.readText();
      const blob = new Blob([text], { type: 'text/plain' });
      return [new ClipboardItem({ 'text/plain': blob })];
    },
    async writeText(text: string): Promise<void> {
      console.log('[OneKey] Clipboard: writeText() intercepted');
      const key = `${window.location.origin}:write`;

      const decision = sessionDecisions.get(key);
      if (decision === 'deny') {
        console.log('[OneKey] Clipboard: writeText() - session-denied, short-circuit');
        throw createNotAllowedError();
      }
      if (decision === 'allow') {
        console.log('[OneKey] Clipboard: writeText() - session-allowed, native API');
        if (!originalClipboard) {
          throw new DOMException('Clipboard API not available', 'NotSupportedError');
        }
        return originalClipboard.writeText(text);
      }

      const existing = pendingRequests.get(key) as Promise<void> | undefined;
      if (existing) {
        console.log('[OneKey] Clipboard: writeText() - coalescing with in-flight');
        return existing;
      }

      console.log('[OneKey] Clipboard: writeText() requesting permission');
      const promise = (async (): Promise<void> => {
        try {
          const result = await $private.request({
            method: 'wallet_requestClipboardPermission',
            params: { type: 'write', text },
          }) as { allowed?: boolean } | undefined;
          console.log('[OneKey] Clipboard: writeText() permission result:', result?.allowed);
          const allowed = Boolean(result?.allowed);
          sessionDecisions.set(key, allowed ? 'allow' : 'deny');
          if (!allowed) throw createNotAllowedError();
        } catch (e) {
          if (!sessionDecisions.has(key)) {
            sessionDecisions.set(key, 'deny');
          }
          if (e instanceof DOMException) throw e;
          throw createNotAllowedError();
        }
      })();

      pendingRequests.set(key, promise);
      void promise.finally(() => {
        pendingRequests.delete(key);
      });
      return promise;
    },
    async write(data: ClipboardItems): Promise<void> {
      // Extract text from ClipboardItems and delegate to writeText
      for (const item of data) {
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain');
          const text = await blob.text();
          return clipboardProxy.writeText(text);
        }
      }
      throw new DOMException('No text/plain data in ClipboardItems', 'NotSupportedError');
    },
    addEventListener: originalClipboard?.addEventListener?.bind(originalClipboard),
    removeEventListener: originalClipboard?.removeEventListener?.bind(originalClipboard),
    dispatchEvent: originalClipboard?.dispatchEvent?.bind(originalClipboard),
  };

  const navigatorProxy = new Proxy(navigator, {
    get(target, prop): unknown {
      if (prop === 'clipboard') return clipboardProxy;
      // Use target (not receiver) so native getters run with the real
      // Navigator as `this`, avoiding "Illegal invocation" in Electron
      // webFrame.executeJavaScript() and other sandboxed contexts.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = Reflect.get(target, prop, target);
      if (typeof value === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/ban-types
        return (value as () => unknown).bind(target);
      }
      return value;
    },
  });

  try {
    Object.defineProperty(window, 'navigator', {
      value: navigatorProxy,
      configurable: false,
      enumerable: true,
    });
    console.log('[OneKey] Clipboard override: success (navigator proxy)');
  } catch {
    try {
      Object.defineProperty(navigator, 'clipboard', {
        value: clipboardProxy,
        configurable: false,
        enumerable: true,
      });
      console.log('[OneKey] Clipboard override: success (clipboard direct)');
    } catch (e) {
      console.warn('[OneKey] Clipboard override: FAILED - clipboard access is NOT protected', e);
    }
  }

  // Override document.execCommand for 'copy' and 'paste'
  if (typeof document !== 'undefined' && originalExecCommand) {
    try {
      Object.defineProperty(document, 'execCommand', {
        value: function (
          command: string,
          showUI?: boolean,
          value?: string,
        ): boolean {
          const cmd = command.toLowerCase();
          if (cmd === 'copy' || cmd === 'paste') {
            console.log(`[OneKey] Clipboard: execCommand('${cmd}') blocked`);
            return false;
          }
          return originalExecCommand(command, showUI, value);
        },
        configurable: false,
        writable: false,
      });
      console.log('[OneKey] Clipboard override: execCommand locked');
    } catch {
      // Fallback to simple assignment if defineProperty fails
      document.execCommand = function (
        command: string,
        showUI?: boolean,
        value?: string,
      ): boolean {
        const cmd = command.toLowerCase();
        if (cmd === 'copy' || cmd === 'paste') {
          return false;
        }
        return originalExecCommand(command, showUI, value);
      };
    }
  }
}
