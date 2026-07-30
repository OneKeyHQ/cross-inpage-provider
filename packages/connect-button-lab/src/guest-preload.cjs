const { ipcRenderer, webFrame } = require('electron');

function notify(channel, payload) {
  try {
    ipcRenderer.sendToHost(channel, payload);
  } catch {
    // The host can disappear during full-suite navigation.
  }
}

window.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.source !== 'onekey-connect-button-lab') return;
  notify('lab-event', data);
});

async function injectHackBundle() {
  try {
    const source = ipcRenderer.sendSync('lab:get-hack-bundle');
    if (!source) throw new Error('Hack bundle is empty');
    await webFrame.executeJavaScript(source, true);
    notify('hack-bundle-status', {
      ok: true,
      url: location.href,
      at: new Date().toISOString(),
    });
  } catch (error) {
    notify('hack-bundle-status', {
      ok: false,
      url: location.href,
      error: error instanceof Error ? error.message : String(error),
      at: new Date().toISOString(),
    });
  }
}

void injectHackBundle();
