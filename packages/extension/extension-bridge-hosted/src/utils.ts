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
  return origin || '';
}

export default {
  getOriginFromPort,
};
