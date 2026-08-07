const fs = require('fs');
const path = require('path');

const ts = require('typescript');

function loadAutoReviewModule() {
  const source = fs.readFileSync(path.join(__dirname, 'customInjectionAutoReview.ts'), 'utf8');
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
  createCustomInjectionRepositoryIcons,
  installCustomInjectionAutoReview,
  installCustomInjectionAutoReviewObserver,
} = loadAutoReviewModule();

const iconicOneKeyIcon = 'https://iconic.dynamic-static-assets.com/icons/sprite.svg#onekey';

const repositoryIcons = [
  {
    key: 'onekey',
    label: 'OneKey',
    source: 'https://uni.onekey-asset.com/static/logo/onekey.png',
    sourceKind: 'asset',
  },
  {
    key: 'metamask',
    label: 'OneKey & MetaMask',
    source: 'data:image/svg+xml;base64,repository-joint-icon',
    sourceKind: 'inline',
  },
];

function flushMutations() {
  return new Promise((resolve) => {
    queueMicrotask(resolve);
  });
}

describe('custom injection automatic review observer', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.head.replaceChildren();
  });

  test('reports a repository asset icon added after installation exactly once', async () => {
    const onDetected = jest.fn();
    const cleanup = installCustomInjectionAutoReviewObserver({
      icons: repositoryIcons,
      onDetected,
    });

    const unrelated = document.createElement('img');
    unrelated.src = 'https://example.com/wallet.png';
    document.body.append(unrelated);
    await flushMutations();
    expect(onDetected).not.toHaveBeenCalled();

    const icon = document.createElement('img');
    icon.src = repositoryIcons[0].source;
    document.body.append(icon);
    await flushMutations();

    expect(onDetected).toHaveBeenCalledTimes(1);
    expect(onDetected).toHaveBeenCalledWith({
      iconKey: 'onekey',
      iconLabel: 'OneKey',
      sourceKind: 'asset',
    });

    const second = document.createElement('img');
    second.src = repositoryIcons[1].source;
    document.body.append(second);
    await flushMutations();
    expect(onDetected).toHaveBeenCalledTimes(1);
    cleanup();
  });

  test('detects an additional exact OneKey SVG sprite source', async () => {
    const icons = createCustomInjectionRepositoryIcons({
      onekey: {
        text: 'OneKey',
        icon: 'data:image/svg+xml;base64,repository-onekey-icon',
        iconUrl: 'https://uni.onekey-asset.com/static/logo/onekey.png',
        autoReviewIconUrls: [iconicOneKeyIcon],
      },
    });
    const onDetected = jest.fn();
    const cleanup = installCustomInjectionAutoReviewObserver({
      icons,
      onDetected,
    });
    const icon = document.createElement('img');

    icon.src = iconicOneKeyIcon;
    document.body.append(icon);
    await flushMutations();

    expect(onDetected).toHaveBeenCalledWith({
      iconKey: 'onekey',
      iconLabel: 'OneKey',
      sourceKind: 'asset',
    });
    cleanup();
  });

  test('detects an exact OneKey wallet ID without a repository icon', async () => {
    const onDetected = jest.fn();
    const cleanup = installCustomInjectionAutoReviewObserver({
      icons: repositoryIcons,
      onDetected,
    });
    const wallet = document.createElement('button');

    wallet.dataset.walletId = 'ethereum-onekey-wallet';
    document.body.append(wallet);
    await flushMutations();

    expect(onDetected).toHaveBeenCalledWith({
      iconKey: 'onekey',
      iconLabel: 'OneKey',
      sourceKind: 'wallet-id',
      walletId: 'ethereum-onekey-wallet',
    });
    cleanup();
  });

  test('ignores unrelated and malformed wallet IDs', async () => {
    const onDetected = jest.fn();
    const cleanup = installCustomInjectionAutoReviewObserver({
      icons: repositoryIcons,
      onDetected,
    });
    const unrelated = document.createElement('button');
    const malformed = document.createElement('button');

    unrelated.dataset.walletId = 'ethereum-metamask';
    malformed.dataset.walletId = 'onekey-wallet';
    document.body.append(unrelated, malformed);
    await flushMutations();

    expect(onDetected).not.toHaveBeenCalled();
    cleanup();
  });

  test('detects attribute and inline background-image mutations without polling', async () => {
    const setIntervalSpy = jest.spyOn(globalThis, 'setInterval');
    const onDetected = jest.fn();
    const icon = document.createElement('div');
    document.body.append(icon);
    const cleanup = installCustomInjectionAutoReviewObserver({
      icons: repositoryIcons,
      onDetected,
    });

    icon.style.backgroundImage = `url("${repositoryIcons[1].source}")`;
    await flushMutations();

    expect(onDetected).toHaveBeenCalledWith({
      iconKey: 'metamask',
      iconLabel: 'OneKey & MetaMask',
      sourceKind: 'inline',
    });
    expect(setIntervalSpy).not.toHaveBeenCalled();
    setIntervalSpy.mockRestore();
    cleanup();
  });

  test('scans the initial DOM and open shadow roots once', () => {
    const host = document.createElement('div');
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const icon = document.createElement('img');
    icon.src = repositoryIcons[0].source;
    shadowRoot.append(icon);
    document.body.append(host);
    const onDetected = jest.fn();

    const cleanup = installCustomInjectionAutoReviewObserver({
      icons: repositoryIcons,
      onDetected,
    });

    expect(onDetected).toHaveBeenCalledTimes(1);
    cleanup();
  });

  test('re-arms detection once for each new capability token', async () => {
    const icon = document.createElement('img');
    icon.src = repositoryIcons[0].source;
    document.body.append(icon);
    const onReport = jest.fn();
    const autoReview = installCustomInjectionAutoReview({
      icons: repositoryIcons,
      onReport,
    });

    autoReview.configure('first-capability-token');
    expect(onReport).toHaveBeenCalledTimes(1);
    expect(onReport).toHaveBeenLastCalledWith({
      token: 'first-capability-token',
      detection: {
        iconKey: 'onekey',
        iconLabel: 'OneKey',
        sourceKind: 'asset',
      },
    });

    autoReview.configure('first-capability-token');
    expect(onReport).toHaveBeenCalledTimes(1);

    autoReview.configure('second-capability-token');
    expect(onReport).toHaveBeenCalledTimes(2);
    expect(onReport).toHaveBeenLastCalledWith({
      token: 'second-capability-token',
      detection: {
        iconKey: 'onekey',
        iconLabel: 'OneKey',
        sourceKind: 'asset',
      },
    });

    icon.remove();
    autoReview.configure('third-capability-token');
    expect(onReport).toHaveBeenCalledTimes(2);

    const replacement = document.createElement('img');
    replacement.src = repositoryIcons[1].source;
    document.body.append(replacement);
    await flushMutations();
    expect(onReport).toHaveBeenCalledTimes(3);
    expect(onReport).toHaveBeenLastCalledWith({
      token: 'third-capability-token',
      detection: {
        iconKey: 'metamask',
        iconLabel: 'OneKey & MetaMask',
        sourceKind: 'inline',
      },
    });

    autoReview.stop();
  });
});
