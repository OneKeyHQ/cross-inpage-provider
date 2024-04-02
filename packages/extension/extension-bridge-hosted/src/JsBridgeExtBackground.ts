import isFunction from 'lodash/isFunction';
import entries from 'lodash/entries';

import {
  IInjectedProviderNamesStrings,
  IJsBridgeConfig,
  IJsBridgeMessagePayload,
} from '@onekeyfe/cross-inpage-provider-types';
import utils from './utils';
import * as uuid from 'uuid';

import { JsBridgeBase, consts } from '@onekeyfe/cross-inpage-provider-core';

const { EXT_PORT_OFFSCREEN_TO_BG, EXT_PORT_CS_TO_BG, EXT_PORT_UI_TO_BG } = consts;

class JsBridgeExtBackground extends JsBridgeBase {
  constructor(config: IJsBridgeConfig) {
    super(config);
    this.setupMessagePortOnConnect();
  }

  sendAsString = false;

  public ports: Record<number | string, chrome.runtime.Port> = {};
  public offscreenPort: chrome.runtime.Port | undefined;
  public offscreenPortId: number | string | undefined;

  addPort({ portId, port }: { portId: number | string; port: chrome.runtime.Port }) {
    this.ports[portId] = port;
    if (port.name === EXT_PORT_OFFSCREEN_TO_BG) {
      this.offscreenPort = port;
      this.offscreenPortId = portId;
    }
  }
  removePort({ portId, port }: { portId: number | string; port: chrome.runtime.Port }) {
    delete this.ports[portId];
    if (port.name === EXT_PORT_OFFSCREEN_TO_BG) {
      this.offscreenPort = undefined;
      this.offscreenPortId = undefined;
    }
  }

  sendPayload(payload0: IJsBridgeMessagePayload | string): void {
    const payload = payload0 as IJsBridgeMessagePayload;
    if (!payload.remoteId) {
      return;
    }
    const port: chrome.runtime.Port = this.ports[payload.remoteId as string];

    const portOrigin = utils.getOriginFromPort(port);
    const requestOrigin: string = payload?.peerOrigin || '';

    if (!portOrigin) {
      throw new Error('port origin not found, maybe its destroyed');
    }

    if (portOrigin && requestOrigin && portOrigin !== requestOrigin) {
      throw new Error(`Origin not matched! expected: ${requestOrigin}, actual: ${portOrigin} .`);
    }

    // TODO onDisconnect remove ports cache
    //    try catch error test
    try {
      port.postMessage(payload);
    } catch (err: any) {
      const error = err as Error;
      // TODO message maybe different in browser
      if (error && error?.message === 'Attempting to use a disconnected port object') {
        console.error('onDisconnect handler');
      }
      throw error;
    }
  }

  setupMessagePortOnConnect() {
    // TODO removeListener
    chrome.runtime.onConnect.addListener((port) => {
      /* port.sender
                  frameId: 0
                  id: "nhccmkonbhjkihmkjcodcepopkjpldoa"
                  origin: "https://app.uniswap.org"
                  tab: {active: true, audible: false, autoDiscardable: true, discarded: false, favIconUrl: 'https://app.uniswap.org/favicon.png', …}
                  url: "https://app.uniswap.org/#/swap"
             */
      // content-script may be multiple
      if (
        port.name === EXT_PORT_CS_TO_BG ||
        port.name === EXT_PORT_UI_TO_BG ||
        port.name === EXT_PORT_OFFSCREEN_TO_BG
      ) {
        const portId = uuid.v4();
        this.addPort({
          portId,
          port,
        });
        const onMessage = (payload: IJsBridgeMessagePayload, port0: chrome.runtime.Port) => {
          const origin = utils.getOriginFromPort(port0);
          payload.remoteId = portId;
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const jsBridge = this;
          // TODO if EXT_PORT_CS_TO_BG ignore "internal_" prefix methods
          //    ignore scope=walletPrivate
          // - receive
          jsBridge.receive(payload, {
            origin,
            // TODO trust origin
            // only trust message from UI/Offscreen, but NOT from content-script(dapp)
            internal: port.name === EXT_PORT_UI_TO_BG || port.name === EXT_PORT_OFFSCREEN_TO_BG,
          });
        };
        // #### content-script -> background
        port.onMessage.addListener(onMessage);

        // TODO onDisconnect remove ports cache
        const onDisconnect = () => {
          port.onMessage.removeListener(onMessage);
          port.onDisconnect.removeListener(onDisconnect);
          this.removePort({
            portId,
            port,
          });
        };
        port.onDisconnect.addListener(onDisconnect);
      }
    });
  }

  requestToOffscreen(data: unknown) {
    if (!this.offscreenPort) {
      throw new Error('offscreenPort not ready.');
    }
    return this.request({ data, remoteId: this.offscreenPortId });
  }

  requestToAllCS(scope: IInjectedProviderNamesStrings, data: unknown, targetOrigin?: string) {
    // TODO optimize rename: broadcastRequest
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    entries(this.ports).forEach(async ([portId, port]) => {
      if (port.name === EXT_PORT_CS_TO_BG) {
        const origin = utils.getOriginFromPort(port);
        if (isFunction(data)) {
          // eslint-disable-next-line no-param-reassign
          data = await data({ origin });
        }
        // Send a notification to the port of the specified origin
        if (!targetOrigin || targetOrigin === origin) {
          // TODO check ports disconnected
          this.requestSync({
            data,
            scope,
            remoteId: portId,
          });
        }
      }
      void 0;
    });
  }

  requestToAllUi(data: unknown) {
    // TODO optimize
    entries(this.ports).forEach(([portId, port]) => {
      if (port.name === EXT_PORT_UI_TO_BG) {
        console.log(`notify to ui port: ${portId}`);
        // TODO check ports disconnected
        this.requestSync({
          data,
          remoteId: portId,
        });
      }
    });
  }
}

export { JsBridgeExtBackground };
