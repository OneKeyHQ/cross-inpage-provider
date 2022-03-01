const gulp = require('gulp');
const { execSync, exec } = require('child_process');

function execCmd(cmd) {
  return execSync(cmd, { stdio: 'inherit' });
}

function build(cb) {
  exec('yarn start', { stdio: 'inherit' });
  cb();
}

function buildInjected(cb) {
  // execSync('yarn build-inject');
  execCmd('cd packages/injected && yarn build && cd -');
  execCmd('sh rsync-npm.sh');
  execCmd('cd ~/workspace/onekey-app-monorepo && yarn copy:inject');
  execCmd('echo "manually set app-monorepo WebView.js hash"');
  cb();
}

function watching(cb) {
  gulp.watch(['packages/**/src/**/*.ts'], buildInjected);
  cb();
}
const watch = gulp.series(buildInjected, watching);

exports.default = buildInjected;
exports.build = buildInjected;
exports.watch = watch;
