# cross-inpage-provider

[OneKey DApp Example](https://dapp-example.onekeytest.com/)


# Init monorepo
```bash
yarn
yarn bootstrap
yarn build
```

# Develop monorepo
```bash
# Clean cache
yarn clean && yarn bootstrap

# Start watch and build all packages
yarn start

# check and configure .env file
#  if not exist, copy .env.example to .env
#  if exist, check and update APP_MONOREPO_LOCAL_PATH
APP_MONOREPO_LOCAL_PATH=/path/to/your/app-monorepo

# watch and build `packages/injected`, then rsync local npm packages to app-monorepo
#   re-build `packages/injected` only, if you change others monorepo code, run `yarn build`
# open new terminal
yarn gulp-watch
```

# Run dapp example web
```bash
yarn example
```

# Update all versions before publish
```bash
yarn update-version 1.0.1
```

# Publish to npmjs.com
```bash
yarn publish-packages
```


