export const CUSTOM_INJECTION_INDICATOR_ID = 'onekey-custom-injection-indicator';
export const CUSTOM_INJECTION_SOURCE = 'custom-workspace';

export type ICustomInjectionDevMarker = Readonly<{
  source: typeof CUSTOM_INJECTION_SOURCE;
  buildLabel: string;
}>;

declare global {
  interface Window {
    __ONEKEY_CUSTOM_INJECTION__?: ICustomInjectionDevMarker;
  }
}

type IInstallCustomInjectionDevIndicatorOptions = {
  buildLabel?: string;
};

function createIndicator(buildLabel: string, onDismiss: () => void): HTMLDivElement {
  const host = document.createElement('div');
  host.id = CUSTOM_INJECTION_INDICATOR_ID;
  host.setAttribute('data-onekey-injection-source', CUSTOM_INJECTION_SOURCE);
  host.setAttribute('data-onekey-build-label', buildLabel);
  host.style.cssText = [
    'all: initial !important',
    'position: fixed !important',
    'left: 12px !important',
    'bottom: 12px !important',
    'z-index: 2147483647 !important',
    'display: block !important',
    'pointer-events: none !important',
  ].join(';');

  const shadowRoot = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
    }

    .onekey-custom-injection-indicator {
      align-items: center;
      backdrop-filter: blur(8px);
      background: rgba(17, 24, 39, 0.92);
      border: 1px solid rgba(74, 222, 128, 0.72);
      border-radius: 999px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      color: #f9fafb;
      display: inline-flex;
      font: 600 11px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      gap: 7px;
      letter-spacing: 0.02em;
      padding: 6px 10px;
      white-space: nowrap;
    }

    .onekey-custom-injection-indicator__status {
      background: #4ade80;
      border-radius: 999px;
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.18);
      height: 7px;
      width: 7px;
    }

    .onekey-custom-injection-indicator__mode {
      color: #86efac;
    }

    .onekey-custom-injection-indicator__dismiss {
      align-items: center;
      appearance: none;
      background: transparent;
      border: 0;
      border-radius: 999px;
      color: #d1d5db;
      cursor: pointer;
      display: inline-flex;
      font: 600 15px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      height: 20px;
      justify-content: center;
      margin: -4px -5px -4px 0;
      padding: 0;
      pointer-events: auto;
      transition: background-color 120ms ease, color 120ms ease;
      width: 20px;
    }

    .onekey-custom-injection-indicator__dismiss:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }

    .onekey-custom-injection-indicator__dismiss:focus-visible {
      outline: 2px solid #4ade80;
      outline-offset: 1px;
    }
  `;

  const bar = document.createElement('div');
  bar.className = 'onekey-custom-injection-indicator';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-label', 'OneKey custom injection is active');

  const status = document.createElement('span');
  status.className = 'onekey-custom-injection-indicator__status';

  const title = document.createElement('span');
  title.textContent = 'OneKey Custom Injection';

  const mode = document.createElement('span');
  mode.className = 'onekey-custom-injection-indicator__mode';
  mode.textContent = `DEV · ${buildLabel}`;

  const dismiss = document.createElement('button');
  dismiss.className = 'onekey-custom-injection-indicator__dismiss';
  dismiss.type = 'button';
  dismiss.setAttribute('aria-label', 'Dismiss OneKey custom injection indicator');
  dismiss.textContent = '×';
  dismiss.addEventListener('click', onDismiss);

  bar.append(status, title, mode, dismiss);
  shadowRoot.append(style, bar);
  return host;
}

export function installCustomInjectionDevIndicator(
  options: IInstallCustomInjectionDevIndicatorOptions = {},
): () => void {
  const buildLabel = options.buildLabel?.trim() || 'local-workspace';
  if (window.__ONEKEY_CUSTOM_INJECTION__?.source === CUSTOM_INJECTION_SOURCE) {
    return () => undefined;
  }
  const marker = Object.freeze({
    source: CUSTOM_INJECTION_SOURCE,
    buildLabel,
  }) as ICustomInjectionDevMarker;

  Object.defineProperty(window, '__ONEKEY_CUSTOM_INJECTION__', {
    configurable: true,
    enumerable: false,
    value: marker,
    writable: false,
  });

  const mount = () => {
    if (!document.documentElement || document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)) {
      return;
    }
    const indicator = createIndicator(buildLabel, () => {
      indicator.remove();
    });
    document.documentElement.appendChild(indicator);
  };

  if (document.documentElement) {
    mount();
  } else {
    window.addEventListener('DOMContentLoaded', mount, {
      once: true,
    });
  }

  return () => {
    window.removeEventListener('DOMContentLoaded', mount);
    document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)?.remove();
    if (window.__ONEKEY_CUSTOM_INJECTION__ === marker) {
      delete window.__ONEKEY_CUSTOM_INJECTION__;
    }
  };
}
