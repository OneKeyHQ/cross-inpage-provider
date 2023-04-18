
import { JsBridgeExtOffscreen, IJsBridgeExtOffscreenConfig } from '../JsBridgeExtOffscreen';

function createOffscreenJsBridge(config: IJsBridgeExtOffscreenConfig) {
  const bridge = new JsBridgeExtOffscreen(config);
  return bridge;
}

export default {
  createOffscreenJsBridge,
};
