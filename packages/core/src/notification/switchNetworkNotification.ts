import notification, { isInSameOriginIframe } from "./notification";
import { IconLogo } from './icon'

let instance: ReturnType<typeof notification> | null;

export const switchNetworkNotification = (networkChangedText: string) => {
	console.log('====>1')
  if (isInSameOriginIframe()) {
		console.log('====>2')
    return;
  }
  if (instance) {
		console.log('====>3')
    instance.dismiss();
    instance = null;
  }
	console.log('===>4')
  instance = notification({
    dismissible: false,
    duration: 1500,
    customClass: "onekey-alert-network-changed",
    content: `<div style="display: flex; align-items: center; gap: 8px;">
      <img style="width: 32px;" src="${IconLogo}"/>
      <div>
        <div style="color: rgba(0, 0, 0, 0.88); font-size: 13px;"><span style="line-height: 19px; font-weight: 500;">${networkChangedText}</span></div>
      </div>
    </div>
    `,
  });
};
