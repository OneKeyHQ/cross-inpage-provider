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

  const rememberedOrigins = new Set<string>();

  const clipboardProxy = {
    async readText(): Promise<string> {
      console.log('[OneKey] Clipboard: readText() intercepted');
      if (rememberedOrigins.has(window.location.origin)) {
        console.log('[OneKey] Clipboard: readText() - origin remembered, using original API');
        if (!originalClipboard) {
          throw new DOMException('Clipboard API not available', 'NotSupportedError');
        }
        return originalClipboard.readText();
      }
      console.log('[OneKey] Clipboard: readText() requesting permission');
      try {
        const result = await $private.request({
          method: 'wallet_requestClipboardPermission',
          params: { type: 'read' },
        }) as { allowed?: boolean; content?: string; remember?: boolean } | undefined;
        console.log('[OneKey] Clipboard: readText() permission result:', result?.allowed);
        if (!result?.allowed) throw createNotAllowedError();
        if (result.remember) {
          rememberedOrigins.add(window.location.origin);
          console.log('[OneKey] Clipboard: origin remembered for this session');
        }
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
      console.log('[OneKey] Clipboard: writeText() intercepted');
      if (rememberedOrigins.has(window.location.origin)) {
        console.log('[OneKey] Clipboard: writeText() - origin remembered, using original API');
        if (!originalClipboard) {
          throw new DOMException('Clipboard API not available', 'NotSupportedError');
        }
        return originalClipboard.writeText(text);
      }
      console.log('[OneKey] Clipboard: writeText() requesting permission');
      try {
        const result = await $private.request({
          method: 'wallet_requestClipboardPermission',
          params: { type: 'write', text },
        }) as { allowed?: boolean; remember?: boolean } | undefined;
        console.log('[OneKey] Clipboard: writeText() permission result:', result?.allowed);
        if (!result?.allowed) throw createNotAllowedError();
        if (result.remember) {
          rememberedOrigins.add(window.location.origin);
          console.log('[OneKey] Clipboard: origin remembered for this session');
        }
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
    get(target, prop, receiver): unknown {
      if (prop === 'clipboard') return clipboardProxy;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        return (value as Function).bind(target);
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
