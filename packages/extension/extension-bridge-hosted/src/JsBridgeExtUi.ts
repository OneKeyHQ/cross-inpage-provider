import messagePort from './extensionMessagePort';
import { IJsBridgeConfig, IJsBridgeMessagePayload } from '@onekeyfe/cross-inpage-provider-types';

import { JsBridgeBase, consts } from '@onekeyfe/cross-inpage-provider-core';

const { EXT_PORT_UI_TO_BG } = consts;

export type IJsBridgeExtUiConfig = IJsBridgeConfig & {
  onPortConnect: (port0: chrome.runtime.Port) => void;
};

class JsBridgeExtUi extends JsBridgeBase {
  constructor(config: IJsBridgeExtUiConfig) {
    super(config as IJsBridgeConfig);
    this.setupMessagePortConnect(config);
  }

  isExtUi = true;

  sendAsString = false;

  private portToBg: chrome.runtime.Port | null = null;

  sendPayload(payload: IJsBridgeMessagePayload | string) {
    if (this.portToBg) {
      this.portToBg.postMessage(payload);
    }
  }

  _getOriginFromPort(port: chrome.runtime.Port) {
    // chrome
    let origin = port?.sender?.origin || '';
    // firefox
    if (!origin && port?.sender?.url) {
      const uri = new URL(port?.sender?.url);
      origin = uri?.origin || '';
    }
    return origin;
  }

  setupMessagePortConnect(config: IJsBridgeExtUiConfig) {
    messagePort.connect({
      name: EXT_PORT_UI_TO_BG,
      // #### background -> ui
      onMessage: (payload: any, port0: chrome.runtime.Port) => {
        let origin = this._getOriginFromPort(port0) || '';

        // in ext ui, port.sender?.origin is always empty,
        //    so we trust remote (background) origin
        origin = origin || (payload as IJsBridgeMessagePayload).origin || '';

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const jsBridge = this;
        jsBridge.receive(payload as IJsBridgeMessagePayload, {
          origin,
          // trust message from background
          internal: port0.name === EXT_PORT_UI_TO_BG,
        });
      },
      onConnect: (port) => {
        this.portToBg = port;
        setTimeout(() => {
          config.onPortConnect(port);
        }, 0);
        return () => {
          this.portToBg = null;
        };
      },
    });
  }
}

export { JsBridgeExtUi };
