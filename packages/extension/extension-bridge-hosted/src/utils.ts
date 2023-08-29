function getOriginFromPort(port: chrome.runtime.Port) {
  // chrome
  let origin = port?.sender?.origin || '';
  // firefox
  if (!origin && port?.sender?.url) {
    try {
      const uri = new URL(port?.sender?.url);
      origin = uri?.origin || '';
    } catch (error) {
      console.error(error);
    }
  }
  if (!origin) {
    console.error('ERROR: origin not found from port sender', port);
  }
  return origin || '';
}

export default {
  getOriginFromPort,
};
