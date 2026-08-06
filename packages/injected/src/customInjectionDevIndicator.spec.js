const fs = require('fs');
const path = require('path');

const ts = require('typescript');

function loadIndicatorModule() {
  const source = fs.readFileSync(path.join(__dirname, 'customInjectionDevIndicator.ts'), 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
    },
  }).outputText;
  const loadedModule = { exports: {} };
  const load = new Function('module', 'exports', output);
  load(loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const {
  CUSTOM_INJECTION_INDICATOR_ID,
  CUSTOM_INJECTION_SOURCE,
  installCustomInjectionDevIndicator,
} = loadIndicatorModule();

describe('custom injection development indicator', () => {
  afterEach(() => {
    document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)?.remove();
    delete window.__ONEKEY_CUSTOM_INJECTION__;
  });

  test('exposes a script-readable marker and isolated floating indicator', () => {
    const cleanup = installCustomInjectionDevIndicator({
      buildLabel: 'test-build',
    });
    const indicator = document.getElementById(CUSTOM_INJECTION_INDICATOR_ID);

    expect(indicator).not.toBeNull();
    expect(indicator.dataset.onekeyInjectionSource).toBe(CUSTOM_INJECTION_SOURCE);
    expect(indicator.dataset.onekeyBuildLabel).toBe('test-build');
    expect(indicator.style.pointerEvents).toBe('none');
    expect(indicator.shadowRoot?.textContent).toContain('OneKey Custom Injection');
    expect(indicator.shadowRoot?.textContent).toContain('DEV · test-build');
    expect(
      indicator.shadowRoot?.querySelector(
        '[aria-label="Dismiss OneKey custom injection indicator"]',
      ),
    ).not.toBeNull();
    expect(window.__ONEKEY_CUSTOM_INJECTION__).toEqual({
      source: CUSTOM_INJECTION_SOURCE,
      buildLabel: 'test-build',
    });
    expect(Object.isFrozen(window.__ONEKEY_CUSTOM_INJECTION__)).toBe(true);

    installCustomInjectionDevIndicator({ buildLabel: 'test-build' });
    expect(document.querySelectorAll(`#${CUSTOM_INJECTION_INDICATOR_ID}`)).toHaveLength(1);

    cleanup();
    expect(document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)).toBeNull();
  });

  test('does not restore the indicator after it is removed', async () => {
    const cleanup = installCustomInjectionDevIndicator({
      buildLabel: 'test-build',
    });

    document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)?.remove();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)).toBeNull();
    cleanup();
  });

  test('can be dismissed without removing the script-readable marker', () => {
    const cleanup = installCustomInjectionDevIndicator({
      buildLabel: 'test-build',
    });
    const indicator = document.getElementById(CUSTOM_INJECTION_INDICATOR_ID);
    const dismiss = indicator?.shadowRoot?.querySelector(
      '[aria-label="Dismiss OneKey custom injection indicator"]',
    );

    dismiss?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.getElementById(CUSTOM_INJECTION_INDICATOR_ID)).toBeNull();
    expect(window.__ONEKEY_CUSTOM_INJECTION__).toEqual({
      source: CUSTOM_INJECTION_SOURCE,
      buildLabel: 'test-build',
    });
    cleanup();
  });
});
