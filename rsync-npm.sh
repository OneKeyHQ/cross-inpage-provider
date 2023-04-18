#!/usr/bin/env bash


syncFiles() {

    appPath=$APP_MONOREPO_LOCAL_PATH
    workingPath=$CURRENT_WORKING_PATH

    echo "**********************" $workingPath
    echo "**********************" $appPath

    rsync -avz --exclude node_modules \
              $workingPath/packages/events/   \
              $appPath/node_modules/@onekeyfe/cross-inpage-provider-events/

    rsync -avz --exclude node_modules \
              $workingPath/packages/core/   \
              $appPath/node_modules/@onekeyfe/cross-inpage-provider-core/

    rsync -avz --exclude node_modules \
              $workingPath/packages/errors/   \
              $appPath/node_modules/@onekeyfe/cross-inpage-provider-errors/

    rsync -avz --exclude node_modules \
              $workingPath/packages/types/   \
              $appPath/node_modules/@onekeyfe/cross-inpage-provider-types/

    rsync -avz --exclude node_modules \
              $workingPath/packages/injected/   \
              $appPath/node_modules/@onekeyfe/cross-inpage-provider-injected/

    rsync -avz --exclude node_modules \
              $workingPath/packages/providers/inpage-providers-hub/   \
              $appPath/node_modules/@onekeyfe/inpage-providers-hub/

    rsync -avz --exclude node_modules \
              $workingPath/packages/extension/extension-bridge-hosted/   \
              $appPath/node_modules/@onekeyfe/extension-bridge-hosted/

    rsync -avz --exclude node_modules \
              $workingPath/packages/webview/   \
              $appPath/node_modules/@onekeyfe/onekey-cross-webview/
}

syncFiles
