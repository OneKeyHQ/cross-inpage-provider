const fs = require('fs');
const path = require('path');

const ts = require('typescript');

function loadRecorderModule() {
  const source = fs.readFileSync(path.join(__dirname, 'customInjectionRecorder.ts'), 'utf8');
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

const { installCustomInjectionRecorder } = loadRecorderModule();

describe('custom injection manual recorder', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  test('records semantic selectors for clicks and control-key presses', () => {
    const button = document.createElement('button');
    button.dataset.testid = 'navbar-connect-wallet';
    button.setAttribute('aria-label', 'Connect wallet');
    button.textContent = 'Connect';
    document.body.append(button);
    const recorder = installCustomInjectionRecorder({
      requireTrustedEvents: false,
    });

    recorder.start();
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
    button.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    const capture = recorder.stop();

    expect(capture.kind).toBe('onekey-connect-button-recording-capture');
    expect(capture.steps).toHaveLength(2);
    expect(capture.steps[0]).toEqual(
      expect.objectContaining({
        action: 'click',
        target: expect.objectContaining({
          tag: 'button',
          ariaLabel: 'Connect wallet',
          selectors: expect.arrayContaining([
            expect.objectContaining({
              kind: 'testId',
              value: 'navbar-connect-wallet',
              unique: true,
            }),
            expect.objectContaining({
              kind: 'role',
              role: 'button',
              name: 'Connect wallet',
              unique: true,
            }),
          ]),
        }),
      }),
    );
    expect(capture.steps[1]).toEqual(expect.objectContaining({ action: 'press', key: 'Enter' }));
  });

  test('records a unique selector scoped by a stable ancestor', () => {
    const headerButton = document.createElement('button');
    headerButton.textContent = 'Connect Wallet';
    const widget = document.createElement('section');
    widget.dataset.testid = 'widget-container';
    const widgetActions = document.createElement('div');
    const widgetButton = document.createElement('button');
    widgetButton.className = 'font-circle w-full';
    widgetButton.textContent = 'Connect Wallet';
    widgetActions.append(widgetButton);
    widget.append(widgetActions);
    document.body.append(headerButton, widget);
    const recorder = installCustomInjectionRecorder({
      requireTrustedEvents: false,
    });

    recorder.start();
    widgetButton.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
    recorder.markWalletPickerDetected();
    const capture = recorder.stop();

    expect(capture.outcome).toEqual({
      kind: 'repository-wallet-icon',
      afterStep: 1,
    });
    expect(capture.steps[0].target.selectors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'css',
          value: expect.stringMatching(/^\[data-testid="widget-container"\] /u),
          unique: true,
        }),
      ]),
    );
    expect(capture.steps[0].target.selectors.find((selector) => selector.kind === 'role')).toEqual(
      expect.objectContaining({ unique: false }),
    );
  });

  test('does not record editable fields or input values', () => {
    const input = document.createElement('input');
    input.type = 'password';
    input.value = 'never-persist-this';
    document.body.append(input);
    const recorder = installCustomInjectionRecorder({
      requireTrustedEvents: false,
    });

    recorder.start();
    input.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
    const capture = recorder.stop();

    expect(capture.steps).toHaveLength(0);
    expect(JSON.stringify(capture)).not.toContain('never-persist-this');
  });

  test('bounds the recording step count', () => {
    const button = document.createElement('button');
    button.id = 'connect';
    button.textContent = 'Connect';
    document.body.append(button);
    const recorder = installCustomInjectionRecorder({
      maximumSteps: 2,
      requireTrustedEvents: false,
    });

    recorder.start();
    for (let index = 0; index < 4; index += 1) {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }));
    }
    expect(recorder.getStepCount()).toBe(2);
    expect(recorder.stop().steps).toHaveLength(2);
  });
});
