#!/usr/bin/env bash

syncFiles() {

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/core/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-core/

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/errors/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-errors/

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/types/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-types/

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/injected/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-injected/

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/providers/inpage-providers-hub/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/inpage-providers-hub/

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/extension/extension-bridge-hosted/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/extension-bridge-hosted/

    rsync -avz --exclude node_modules \
              ~/workspace/onekey/cross-inpage-provider/packages/webview/   \
              ~/workspace/onekey-app-monorepo/node_modules/@onekeyfe/onekey-cross-webview/
}

syncFiles
