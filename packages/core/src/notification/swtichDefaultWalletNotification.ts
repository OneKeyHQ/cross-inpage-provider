import notification, { isInSameOriginIframe } from "./notification";
import { IconLogo } from './icon'

let instance: ReturnType<typeof notification> | null;

export const switchDefaultWalletNotification = (isDefaultWallet: boolean) => {
  if (isInSameOriginIframe()) {
    return;
  }
  if (instance) {
    instance.dismiss();
    instance = null;
  }
  const text = isDefaultWallet ? 'OneKey is your default wallet now.' : 'OneKey Default Canceled';
  instance = notification({
    dismissible: true,
    duration: 0,
    customClass: "onekey-alert-default-wallet",
    content: `<div style="display: flex; align-items: center; gap: 8px;">
      <img style="width: 32px;" src="${IconLogo}"/>
      <div>
        <div style="color: rgba(0, 0, 0, 0.88); font-size: 13px;"><span style="line-height: 19px; font-weight: ${isDefaultWallet ? '500' : '700'};">${text}</span></div>
        <div style="font-size: 13px; line-height: 18px; color: rgba(0, 0, 0, 0.61);">
        Please <a
          href="javascript:window.location.reload();"
          style="color: #0091FF; text-decoration: underline;">refresh the web page</a> 
        and retry
        </div>
      </div>
    </div>
    `,
  });
};
