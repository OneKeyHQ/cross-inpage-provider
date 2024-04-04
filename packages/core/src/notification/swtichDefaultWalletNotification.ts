import notification from "./notification";
import {IconLogo} from './icon'

let instance: ReturnType<typeof notification> | null;

export const switchDefaultWalletNotification = (isDefaultWallet: boolean) => {
  if (instance) {
    instance.hide();
    instance = null;
  }
  instance = notification({
    closeable: true,
    timeout: 0,
    className: "onekey-notice-default-wallet",
    content: `<div style="display: flex; align-items: center; gap: 12px; color: #13141A;">
      <img style="width: 28px;" src="${IconLogo}"/>
      <div style="color: #13141A;">
        <div style="color: #13141A;"><span style="font-weight: bold; color: #13141A;">OneKey</span> is ${isDefaultWallet ? '' : 'not'} your default wallet now. </div>
        <div style="color: #13141A;">
        Please <a
          href="javascript:window.location.reload();"
          style="color: #8697FF; text-decoration: underline;">refresh the web page</a> 
        and retry
        </div>
      </div>
    </div>
    `,
  });
};
