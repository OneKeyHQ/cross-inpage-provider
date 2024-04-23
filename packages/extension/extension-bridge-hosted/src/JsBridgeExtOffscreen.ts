import messagePort from './extensionMessagePort';
import { IJsBridgeConfig, IJsBridgeMessagePayload } from '@onekeyfe/cross-inpage-provider-types';

import { JsBridgeBase, consts } from '@onekeyfe/cross-inpage-provider-core';

import utils from './utils';

const { EXT_PORT_OFFSCREEN_TO_BG } = consts;

export type IJsBridgeExtOffscreenConfig = IJsBridgeConfig & {
  onPortConnect: (port0: chrome.runtime.Port) => void;
};

class JsBridgeExtOffscreen extends JsBridgeBase {
  constructor(config: IJsBridgeExtOffscreenConfig) {
    super(config as IJsBridgeConfig);
    this.setupMessagePortConnect(config);
  }

  sendAsString = false;

  private portToBg: chrome.runtime.Port | null = null;

  sendPayload(payload: IJsBridgeMessagePayload | string) {
    if (this.portToBg) {
      this.portToBg.postMessage(payload);
    }
  }

  setupMessagePortConnect(config: IJsBridgeExtOffscreenConfig) {
    messagePort.connect({
      name: EXT_PORT_OFFSCREEN_TO_BG,
      // #### background -> offscreen
      onMessage: (payload: any, port0: chrome.runtime.Port) => {
        let origin = utils.getOriginFromPort(port0, { skipError: true }) || '';

        // in ext offscreen, port.sender?.origin is always empty,
        //    so we trust remote (background) origin
        origin = origin || (payload as IJsBridgeMessagePayload).origin || '';

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const jsBridge = this;
        jsBridge.receive(payload as IJsBridgeMessagePayload, {
          origin,
          // trust message from background
          internal: port0.name === EXT_PORT_OFFSCREEN_TO_BG,
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

export { JsBridgeExtOffscreen };
