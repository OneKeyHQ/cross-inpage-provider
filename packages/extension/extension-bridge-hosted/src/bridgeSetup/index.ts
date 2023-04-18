import background from './background';
import ui from './ui';
import contentScript from './contentScript';
import offscreen from './offscreen';

export const bridgeSetup = {
  contentScript,
  ui,
  background,
  offscreen,
};
