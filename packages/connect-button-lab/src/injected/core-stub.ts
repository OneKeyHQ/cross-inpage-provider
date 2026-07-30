export enum ISpecialPropertyProviderNamesReflection {
  btc = 'unisat',
  sui = 'suiWallet',
  polkadot = 'polkadot-js',
}

export function checkWalletSwitchEnable() {
  return true;
}

export class Logger {
  constructor(private readonly scope: string) {}

  log(...args: unknown[]) {
    console.log(`[OneKey:${this.scope}]`, ...args);
  }

  debug(...args: unknown[]) {
    console.debug(`[OneKey:${this.scope}]`, ...args);
  }

  warn(...args: unknown[]) {
    console.warn(`[OneKey:${this.scope}]`, ...args);
  }

  error(...args: unknown[]) {
    console.error(`[OneKey:${this.scope}]`, ...args);
  }
}

export const commonLogger = new Logger('common');
