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

async function requestClipboardPermission(
  $private: ProviderPrivate,
  type: 'read' | 'write',
): Promise<boolean> {
  try {
    const result = await $private.request({
      method: 'wallet_requestClipboardPermission',
      params: { type },
    });
    return !!(result as { allowed?: boolean })?.allowed;
  } catch {
    return false;
  }
}

export function injectClipboardOverride($private: ProviderPrivate): void {
  if (typeof navigator === 'undefined') return;
  console.log('[OneKey] Clipboard override: initializing');

  const clipboardProxy = {
    async readText(): Promise<string> {
      console.log('[OneKey] Clipboard: readText() intercepted, requesting permission');
      try {
        const result = await $private.request({
          method: 'wallet_requestClipboardPermission',
          params: { type: 'read' },
        }) as { allowed?: boolean; content?: string } | undefined;
        console.log('[OneKey] Clipboard: readText() permission result:', result?.allowed);
        if (!result?.allowed) throw createNotAllowedError();
        return result.content ?? '';
      } catch (e) {
        if (e instanceof DOMException) throw e;
        throw createNotAllowedError();
      }
    },
    async read(): Promise<ClipboardItems> {
      // ClipboardItems are complex (binary data), not supported through bridge
      // Fall back to readText and wrap as plain text ClipboardItem
      const text = await clipboardProxy.readText();
      const blob = new Blob([text], { type: 'text/plain' });
      return [new ClipboardItem({ 'text/plain': blob })];
    },
    async writeText(text: string): Promise<void> {
      console.log('[OneKey] Clipboard: writeText() intercepted, requesting permission');
      try {
        const result = await $private.request({
          method: 'wallet_requestClipboardPermission',
          params: { type: 'write', text },
        }) as { allowed?: boolean } | undefined;
        console.log('[OneKey] Clipboard: writeText() permission result:', result?.allowed);
        if (!result?.allowed) throw createNotAllowedError();
      } catch (e) {
        if (e instanceof DOMException) throw e;
        throw createNotAllowedError();
      }
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
    get(target, prop, receiver) {
      if (prop === 'clipboard') return clipboardProxy;
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') return value.bind(target);
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
