/* eslint-disable @typescript-eslint/ban-ts-comment */
function createCodeWithScriptTag({ code }: { code: string }): string {
  // script id check, only inject once.
  return `
    (function(){
      const s = document.createElement('script');
      s.setAttribute('async', 'false');
      s.setAttribute('data-onekey-injected', 'true');
      s.textContent=${JSON.stringify(code)};
      (document.head || document.documentElement).appendChild(s);
      s.remove();
    })();
  `;
}

function injectCodeWithScriptTag({
  code,
  file,
  remove = true,
}: {
  code?: string;
  file?: string;
  remove?: boolean;
}): void {
  (function () {
    const s = document.createElement('script');
    s.removeAttribute('async');
    s.removeAttribute('defer');
    s.setAttribute('data-onekey-injected', 'yes');
    if (code) {
      s.textContent = code;
    }
    if (file) {
      s.src = file;
    }
    s.onload = function () {
      if (remove && file) {
        s.remove();
      }
    };
    (document.head || document.documentElement).appendChild(s);
    if (remove && code) {
      s.remove();
    }
  })();
}

function createCodeJsBridgeReceive(payloadStr: string): string {
  return `
  if(window.$onekey && window.$onekey.jsBridge){
    window.$onekey.jsBridge.receive(${JSON.stringify(payloadStr)});
  }
  void 0;
  `;
}

export default {
  injectCodeWithScriptTag,
  createCodeWithScriptTag,
  createCodeJsBridgeReceive,
};
