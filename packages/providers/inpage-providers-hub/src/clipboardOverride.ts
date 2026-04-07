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

  const clipboardProxy = {
    async readText(): Promise<string> {
      const allowed = await requestClipboardPermission($private, 'read');
      if (!allowed) throw createNotAllowedError();
      return originalClipboard!.readText();
    },
    async read(): Promise<ClipboardItems> {
      const allowed = await requestClipboardPermission($private, 'read');
      if (!allowed) throw createNotAllowedError();
      return originalClipboard!.read();
    },
    async writeText(text: string): Promise<void> {
      const allowed = await requestClipboardPermission($private, 'write');
      if (!allowed) throw createNotAllowedError();
      return originalClipboard!.writeText(text);
    },
    async write(data: ClipboardItems): Promise<void> {
      const allowed = await requestClipboardPermission($private, 'write');
      if (!allowed) throw createNotAllowedError();
      return originalClipboard!.write(data);
    },
    addEventListener: originalClipboard?.addEventListener?.bind(originalClipboard),
    removeEventListener: originalClipboard?.removeEventListener?.bind(originalClipboard),
    dispatchEvent: originalClipboard?.dispatchEvent?.bind(originalClipboard),
  };

  try {
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboardProxy,
      configurable: false,
      enumerable: true,
    });
  } catch (e) {
    console.warn('[OneKey] Failed to override navigator.clipboard:', e);
  }

  // Override document.execCommand for 'copy' and 'paste'
  if (typeof document !== 'undefined' && originalExecCommand) {
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
