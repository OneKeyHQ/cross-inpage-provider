const ONEKEY_WEBSITE_LIST = [
  'app.onekey.so',
  '1key.so',
  'app.onekeytest.com',
];

export function isOneKeyWebsite() {
 return ONEKEY_WEBSITE_LIST.some(hostname => window.location.origin.includes(hostname));
}
