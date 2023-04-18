const dotenv = require('dotenv');
const path = require('path');
function setupDotEnv() {
  const results = [
    dotenv.config({
      path: path.resolve(__dirname, './.env'),
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
  const appPath = process.env.APP_MONOREPO_LOCAL_PATH;
  if (!appPath) {
    throw new Error('APP_MONOREPO_LOCAL_PATH not found, please set it at .env file');
  }
  const currentPath = __dirname;

  // execSync('yarn build-inject');
  execCmd('cd packages/injected && yarn build && cd -');

  execCmd(`APP_MONOREPO_LOCAL_PATH=${appPath} CURRENT_WORKING_PATH=${currentPath} sh rsync-npm.sh`);
  execCmd(`cd ${appPath} && yarn copy:inject && cd -`);
  execCmd('echo ">>>>>>>>>>>>>>>  "');
  execCmd(
    'echo "\t Manually update app-monorepo WebView.js comment hash in code make iOS hot-reload take effect."',
  );
  execCmd(
    'echo "\t Manually update app-monorepo content-script.ts comment hash in code make EXT hot-reload take effect. Or use content-script reload button to force reload extension."',
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
