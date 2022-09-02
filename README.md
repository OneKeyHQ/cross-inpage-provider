# cross-inpage-provider

[OneKey DApp Example](https://dapp-example.onekeytest.com/)

```
# init monorepo
yarn
yarn bootstrap
yarn build

# watch and build
yarn clean && yarn bootstrap && yarn start

# watch and build `packages/injected`, then rsync local npm packages to app-monorepo
#   re-build `packages/injected` only, if you change others monorepo code, run `yarn build`
gulp watch

# run dapp example web
yarn example

# update all versions before publish
yarn update-version 1.0.1

# publish to npmjs.com
yarn publish-packages
```

