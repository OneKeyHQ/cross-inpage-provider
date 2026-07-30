const { app, BrowserWindow, ipcMain, session, shell, webContents } = require('electron');
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const labDir = path.resolve(__dirname, '..');
const distDir = path.join(labDir, 'dist');
const dataDir = path.join(labDir, '.data');
const artifactsDir = path.join(labDir, 'artifacts');
const bundleFile = path.join(distDir, 'hack-bundle.js');
const catalogFile = path.join(distDir, 'site-catalog.json');
const resultsFile = path.join(dataDir, 'results.json');
const registryFile = path.join(
  labDir,
  '../providers/inpage-providers-hub/src/connectButtonHack/defillama-protocols.json',
);
const guestPreloadFile = path.join(__dirname, 'guest-preload.cjs');
const dashboardPreloadFile = path.join(__dirname, 'preload.cjs');
const demoFile = path.join(labDir, 'fixtures/demo.html');
const syncRegistryScript = path.join(labDir, 'src/cli/sync-registry.mjs');
const buildCatalogScript = path.join(labDir, 'scripts/build-catalog.mjs');

const args = process.argv.slice(2);
function argumentValue(name) {
  const index = args.indexOf(name);
  const inline = args.find((arg) => arg.startsWith(`${name}=`));
  return index >= 0 ? args[index + 1] : inline?.slice(name.length + 1) || null;
}

const smokeTest = args.includes('--smoke-test');
const machineRun = args.includes('--machine-run');
const researchMode = args.includes('--research');
const runAll = args.includes('--run-all');
const requestedSite = argumentValue('--site');
const requestedUrl = argumentValue('--url');
const requestedId = argumentValue('--id');
const resultFile = argumentValue('--result-file');
const caseFile = argumentValue('--case-file');
const caseDefinition = caseFile
  ? readJson(path.resolve(caseFile), null)
  : smokeTest
    ? readJson(path.join(labDir, 'fixtures/demo.case.json'), null)
    : null;
const runSite = args.includes('--run-site') || Boolean(requestedSite) || machineRun;
const autoExit = smokeTest || machineRun;

let mainWindow;
let catalogRefreshPromise = null;

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(tempFile, file);
}

function runNodeScript(file, scriptArgs = [], timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    execFile(
      process.execPath,
      [file, ...scriptArgs],
      {
        cwd: labDir,
        encoding: 'utf8',
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: '1',
        },
        maxBuffer: 1024 * 1024,
        timeout: timeoutMs,
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = String(stderr || stdout || error.message).trim().slice(-12000);
          reject(new Error(detail || error.message));
          return;
        }
        resolve(String(stdout || '').trim());
      },
    );
  });
}

function lastJsonLine(output) {
  const lines = String(output || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  try {
    return JSON.parse(lines.at(-1));
  } catch {
    return null;
  }
}

function safeName(value) {
  return String(value || 'site')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

function getCatalog() {
  const generated = readJson(catalogFile, []);
  const catalog = smokeTest
    ? [{
      id: 'lab-demo',
      hostname: 'local-fixture',
      name: 'Local Hack Demo',
      url: pathToFileURL(demoFile).href,
      source: 'fixture',
      testReady: true,
      caseDefinition,
    }]
    : generated;
  if (requestedUrl) {
    let hostname = requestedUrl;
    try {
      hostname = new URL(requestedUrl).hostname;
    } catch {
      // The renderer will report a navigation error for invalid URLs.
    }
    catalog.unshift({
      id: requestedId || requestedSite || safeName(hostname),
      hostname,
      name: caseDefinition?.name || hostname,
      url: requestedUrl,
      source: researchMode ? 'research' : 'protocol',
      testReady: Boolean(caseDefinition) || researchMode,
      caseDefinition,
    });
  }
  return catalog;
}

function getResults() {
  return readJson(resultsFile, {});
}

function getRegistrySummary() {
  const registry = readJson(registryFile, null);
  if (!registry) return null;
  const active = registry.protocols.filter((protocol) => protocol.active);
  const count = (predicate) => active.filter(predicate).length;
  return {
    cycle: registry.cycle,
    settings: registry.settings,
    source: {
      fetchedAt: registry.source?.fetchedAt || null,
    },
    chains: Array.isArray(registry.chains) ? registry.chains.length : 0,
    progress: {
      active: active.length,
      pendingCoverage: count((protocol) => protocol.coverage.state === 'pending'),
      claimedCoverage: count((protocol) => protocol.coverage.state === 'claimed'),
      doneCoverage: count((protocol) => protocol.coverage.state === 'done'),
      pendingRegression: count((protocol) => protocol.regression.state === 'pending'),
      doneRegression: count((protocol) => protocol.regression.state === 'done'),
      needsLlm: count((protocol) => protocol.automation.needsLlm),
    },
    claimed: active
      .filter(
        (protocol) =>
          protocol.coverage.state === 'claimed' ||
          protocol.regression.state === 'claimed',
      )
      .slice(0, 3)
      .map((protocol) => ({
        id: protocol.id,
        name: protocol.name,
        slug: protocol.slug,
        sourceUrl: protocol.sourceUrl,
      })),
  };
}

function registerIpc() {
  ipcMain.on('lab:get-hack-bundle', (event) => {
    event.returnValue = fs.readFileSync(bundleFile, 'utf8');
  });

  ipcMain.handle('lab:get-bootstrap', () => ({
    catalog: getCatalog(),
    results: getResults(),
    registry: getRegistrySummary(),
    guestPreloadUrl: pathToFileURL(guestPreloadFile).href,
    options: {
      smokeTest,
      runAll,
      runSite,
      requestedSite,
      requestedUrl,
      requestedId,
      machineRun,
      researchMode,
      caseDefinition,
    },
  }));

  ipcMain.handle('lab:refresh-catalog', () => {
    if (!catalogRefreshPromise) {
      catalogRefreshPromise = (async () => {
        const syncOutput = await runNodeScript(syncRegistryScript);
        const catalogOutput = await runNodeScript(buildCatalogScript);
        return {
          catalog: getCatalog(),
          registry: getRegistrySummary(),
          sync: lastJsonLine(syncOutput),
          build: lastJsonLine(catalogOutput),
        };
      })().finally(() => {
        catalogRefreshPromise = null;
      });
    }
    return catalogRefreshPromise;
  });

  ipcMain.handle('lab:save-result', (_event, result) => {
    if (!result || typeof result.id !== 'string') {
      throw new Error('Invalid test result');
    }
    const results = getResults();
    results[result.id] = {
      ...result,
      updatedAt: new Date().toISOString(),
    };
    atomicWriteJson(resultsFile, results);
    return results[result.id];
  });

  ipcMain.handle('lab:capture-webview', async (_event, { webContentsId, id }) => {
    const guest = webContents.fromId(Number(webContentsId));
    if (!guest || guest.isDestroyed()) {
      throw new Error('Target webview is not available');
    }
    fs.mkdirSync(artifactsDir, { recursive: true });
    const file = path.join(
      artifactsDir,
      `${safeName(id)}-${new Date().toISOString().replace(/[:.]/g, '-')}.png`,
    );
    const image = await guest.capturePage();
    if (image.isEmpty()) {
      throw new Error('Webview returned an empty screenshot');
    }
    fs.writeFileSync(file, image.toPNG());
    return file;
  });

  ipcMain.handle('lab:open-devtools', (_event, webContentsId) => {
    const guest = webContents.fromId(Number(webContentsId));
    guest?.openDevTools({ mode: 'detach' });
  });

  ipcMain.handle('lab:show-artifact', (_event, file) => {
    if (typeof file !== 'string' || !path.resolve(file).startsWith(path.resolve(artifactsDir))) {
      throw new Error('Artifact path is outside the lab artifacts directory');
    }
    shell.showItemInFolder(file);
  });

  ipcMain.on('lab:smoke-complete', (_event, result) => {
    if (!smokeTest) return;
    const passed = result?.status === 'passed';
    process.stdout.write(`${JSON.stringify(result)}\n`);
    setTimeout(() => app.exit(passed ? 0 : 1), 500);
  });

  ipcMain.on('lab:machine-complete', (_event, result) => {
    if (!machineRun) return;
    if (resultFile) atomicWriteJson(path.resolve(resultFile), result);
    process.stdout.write(`${JSON.stringify(result)}\n`);
    setTimeout(() => app.exit(result?.status === 'failed' ? 4 : 0), 500);
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1640,
    height: 1000,
    minWidth: 1180,
    minHeight: 720,
    show: !autoExit,
    title: 'OneKey Connect Button Lab',
    backgroundColor: '#07100b',
    webPreferences: {
      preload: dashboardPreloadFile,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webviewTag: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.loadFile(path.join(__dirname, 'renderer/index.html'));
  return window;
}

registerIpc();

app.whenReady().then(() => {
  for (const targetSession of [
    session.defaultSession,
    session.fromPartition('persist:connect-button-lab'),
  ]) {
    targetSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
    targetSession.setPermissionCheckHandler(() => false);
  }

  mainWindow = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || autoExit) {
    app.quit();
  }
});
