const dotenv = require('dotenv');
function setupDotEnv() {
  const results = [
    dotenv.config({
      path: path.resolve(__dirname, '../.env'),
    }),
    dotenv.config({
      path: path.resolve(__dirname, '../.env.version'),
    }),
    dotenv.config({
      path: path.resolve(__dirname, '../.env.expo'),
    }),
  ];
  const errorResult = results.find((result) => result.error);

  if (errorResult) {
    throw errorResult.error;
  }
}
setupDotEnv();

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
  // TODO use .env set onekey-app-monorepo folder
  execCmd('cd ~/workspace/onekey-app-monorepo && yarn copy:inject && cd -');
  execCmd('echo ">>>>>>>>>>>>>>>  "');
  execCmd(
    'echo "\t Manually update app-monorepo WebView.js comment hash in code make iOS hot-reload take effect."',
  );
  execCmd(
    'echo "\t Manually update app-monorepo content-script.ts comment hash in code make EXT hot-reload take effect."',
  );
  execCmd('echo ">>>>>>>>>>>>>>>  "');
  cb();
}

function watching(cb) {
  gulp.watch(['packages/**/src/**/*.ts', 'packages/**/src/**/*.tsx'], buildInjected);
  cb();
}
const watch = gulp.series(buildInjected, watching);

exports.default = buildInjected;
exports.build = buildInjected;
exports.watch = watch;
