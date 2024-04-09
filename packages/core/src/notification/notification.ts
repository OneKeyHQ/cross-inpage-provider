/* eslint-disable @typescript-eslint/no-explicit-any */
import { IconClose } from './icon'

interface Options {
  content: string;
  closeButton: HTMLElement | string;
  container: HTMLElement;
  timeout: number;
  onHide?: () => void;
  className?: string;
  closeable: boolean;
}
class Notification {
  options: Options;
  el: HTMLDivElement | null;
  events: Record<string, (...args: any) => void>;

  closeButton?: HTMLElement;

  timer?: number | null;

  constructor(options: Options) {
    this.options = options;
    this.el = document.createElement("div");
    this.el.className = `onekey-notice ${
      this.options.className ? this.options.className : ""
    }`;

    // initial events
    this.events = {};

    // inner element
    this.insert();

    // auto hide animation
    if (this.options.timeout) {
      this.startTimer();
    }

    // mouse events
    this.registerEvents();
  }

  insert() {
    if (!this.el) {
      return;
    }

    // main
    const elMain = document.createElement("div");
    elMain.className = "onekey-notice-content";
    elMain.innerHTML = this.options.content;
    this.el?.appendChild(elMain);

    // close button
    if (this.options.closeable) {
      this.closeButton = document.createElement("div");
      this.closeButton.className = "onekey-notice-close-wrapper";
      const closeBtnImg = document.createElement("img");
      closeBtnImg.setAttribute("src", IconClose);
      closeBtnImg.className = "onekey-notice-close";
      this.closeButton.appendChild(closeBtnImg);
      this.el.appendChild(this.closeButton);
    }

    this.options.container.appendChild(this.el);
  }

  registerEvents() {
    this.events.hide = () => this.hide();

    this.closeButton?.addEventListener("click", this.events.hide, false);
  }

  startTimer(timeout = this.options.timeout) {
    this.timer = setTimeout(() => {
      this.hide();
    }, timeout) as unknown as number;
  }

  stopTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  hide() {
    if (!this.el) {
      return;
    }
    this.el.classList.add(".onekey-notice-is-hide");
    // setTimeout(() => {
    this.options.container.removeChild(this.el);
    this.el = null;
    if (this.options.onHide) {
      this.options.onHide();
    }
    this.stopTimer();
    // }, 300);
  }
}
let container: HTMLDivElement | null = null;
let style: HTMLStyleElement | null = null;

const styles = `
    .onekey-notice-container {
      position: fixed;
      z-index: 99999;
      top: 60px;
      right: 42px;
    }
    .onekey-notice {
      min-width: 230px;
      min-height: 44px;
      background: #FFFFFF;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
      box-shadow: 0px 4px 12px 0px rgba(0, 0, 0, 0.10);
      border-radius: 8px;
      display: flex;
      align-items: center;

      font-family: 'Arial', sans-serif;
      font-style: normal;
      font-weight: 500;
      font-size: 13px;
      line-height: 19px;
      color: rgba(0, 0, 0, 0.88);

      padding: 16px;
      gap: 8px;

      opacity: 1;
    }
    .onekey-notice + .onekey-notice {
      margin-top: 30px;
    }
    .onekey-notice-content {
      display: flex;
      align-items: center;
      color: #13141A;
    }
    .onekey-notice-is-hide {
      opacity: 0;
      transition: 0.3s;
    }

    .onekey-notice-icon {
      width: 20px;
    }
    .onekey-notice-close-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 32px;
      height: 32px;
      cursor: pointer;
    }
    .onekey-notice-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
    }
    .onekey-strong {
      font-weight: bold;
      color: #13141A;
    }
    .onekey-notice-default-wallet {
      border-radius: 8px;
      height: 71px;

      font-size: 12px;
      line-height: 16px;
      color: #13141A;
    }
  `;

function notification(options: Partial<Options>) {
  const {
    content = "",
    // timeout = 3000,
    timeout = 0,
    closeButton = "×",
    className = "",
    closeable = false,
  } = options || {};

  if (!container) {
    const hostElement = document.createElement('div');
    hostElement.id = 'onekey-notification-center';
    const shadowRoot = hostElement.attachShadow({ mode: 'open' })
    container = document.createElement("div");
    container.classList.add("onekey-notice-container");
    style = document.createElement("style");
    style.innerHTML = styles;
    shadowRoot.appendChild(style);
    shadowRoot.appendChild(container);
    document.body.appendChild(hostElement);
  }

  return new Notification({
    content,
    timeout,
    closeButton,
    container,
    className,
    closeable,
    onHide: () => {
      if (container && !container?.hasChildNodes()) {
        const rootNode = container.getRootNode()
        if (rootNode instanceof ShadowRoot) {
          document.body.removeChild(rootNode.host);
        } else {
          document.body.removeChild(rootNode)
        }
        style = null;
        container = null;
      }
    },
  });
}

export default notification;

const isInIframe = () => {
  return window.self !== window.top;
};

export const isInSameOriginIframe = () => {
  if (!isInIframe()) {
    return false;
  }

  try {
    return window.self.location.origin === window.top?.location?.origin;
  } catch (e) {
    return false;
  }
};
