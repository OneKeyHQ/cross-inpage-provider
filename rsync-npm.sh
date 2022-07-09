#!/usr/bin/env bash

syncFiles() {

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/events/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-events/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/core/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-core/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/errors/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-errors/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/types/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-types/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/injected/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/cross-inpage-provider-injected/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/providers/inpage-providers-hub/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/inpage-providers-hub/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/extension/extension-bridge-hosted/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/extension-bridge-hosted/

    rsync -avz --exclude node_modules \
              ~/Documents/blockchain/onekeyhq/cross-inpage-provider/packages/webview/   \
              ~/Documents/blockchain/onekeyhq/app-monorepo/node_modules/@onekeyfe/onekey-cross-webview/
}

syncFiles
