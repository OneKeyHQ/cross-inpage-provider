# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OneKey Cross-Inpage-Provider is a TypeScript monorepo that provides blockchain wallet integration for dApps across 20+ networks including Ethereum, Solana, Bitcoin, Cosmos, and more. It enables cross-platform wallet communication through extensions, desktop apps, and mobile WebViews.

## Development Commands

### Initial Setup
```bash
yarn
yarn bootstrap
yarn build
```

### Development Workflow
```bash
# Start all packages in watch mode
yarn start

# Clean and rebuild everything
yarn clean && yarn bootstrap

# Watch and sync injected package to app-monorepo (requires .env setup)
yarn gulp-watch
```

### Testing and Quality
```bash
# Run unit tests (Jest with jsdom)
yarn test

# Run linting
yarn lint

# Run E2E tests
yarn test:e2e          # headless
yarn test:e2e:headed   # with browser UI
```

### Build and Deployment
```bash
# Build all packages except example
yarn build

# Update all package versions
yarn update-version 1.0.1

# Publish to npm
yarn publish-packages

# Run example dApp
yarn example
```

## Architecture Overview

### Core Package Structure
- **`packages/core/`** - Foundation classes and communication layer
- **`packages/providers/`** - Blockchain-specific provider implementations  
- **`packages/injected/`** - Injectable scripts for web pages
- **`packages/extension/`** - Chrome extension bridge components
- **`packages/desktop/`** - Desktop app bridge components
- **`packages/native/`** - Mobile WebView bridge components
- **`packages/webview/`** - React components for WebView integration
- **`packages/example/`** - Next.js dApp example and testing interface

### Key Architecture Components

**JsBridgeBase** - Abstract base class handling bidirectional communication between contexts (extension, desktop, web) with REQUEST/RESPONSE pattern, timeout management, and error handling.

**ProviderBase** - Abstract foundation for blockchain providers that extends CrossEventEmitter, manages bridge communication, and handles provider lifecycle with wallet connection info.

**CrossEventEmitter** - Enhanced EventEmitter with cross-platform compatibility and safe error handling to prevent stack interruption.

**Provider Hub System** - Global `window.$onekey` registry where providers register by `providerName`, with `injectedProviderReceiveHandler` routing messages to appropriate providers.

### Communication Flow
1. DApp calls blockchain provider methods
2. Provider sends requests through JsBridge to wallet backend  
3. Bridge handles message serialization and context routing
4. Responses flow back through injectedProviderReceiveHandler
5. Events distributed via CrossEventEmitter to dApp listeners

## Technology Stack

- **Language**: TypeScript 5.x
- **Build**: Lerna monorepo with Yarn workspaces  
- **Testing**: Jest with jsdom environment, Playwright for E2E
- **Bundling**: Webpack (for injected scripts), standard TypeScript compilation
- **Linting**: ESLint with TypeScript rules

## Key Development Patterns

### Provider Implementation
New blockchain providers should extend `ProviderBase` from `@onekeyfe/cross-inpage-provider-core` and implement required methods. Register in the provider hub using `providerName`.

### Bridge Communication  
Use `bridgeRequest()` method for wallet communication. All requests are scoped by provider name and include automatic timeout/error handling.

### Module Resolution
Package imports use `@onekeyfe/` scoped naming. Jest is configured with module name mapping for internal package resolution during testing.

### Error Handling
Use Web3-compatible error objects. The system has built-in timeout management (10min default) and automatic cleanup of failed requests.

## Configuration Files

- **`.env`** - Required for gulp-watch workflow, must set `APP_MONOREPO_LOCAL_PATH`
- **`lerna.json`** - Monorepo configuration with independent versioning
- **`jest.config.js`** - Test configuration with jsdom environment and module mapping
- **`gulpfile.js`** - Build automation for syncing with app-monorepo during development

## E2E Testing

E2E tests use Playwright and are located in `packages/e2e/`. Tests include dApp integration scenarios and connect button functionality across different blockchain networks. Reports and screenshots are saved to `packages/e2e/playwright-report/` and `packages/e2e/test-results/`.

## Important Notes

- The injected scripts have strict browser compatibility requirements and use a separate ESLint config (`syntax-compatibility.eslint.config.cjs`)
- Provider implementations must handle both string and object payloads via bridge configuration
- Site metadata is automatically collected for security/UX purposes
- The system supports iframe embedding with dedicated `JsBridgeIframe` implementation