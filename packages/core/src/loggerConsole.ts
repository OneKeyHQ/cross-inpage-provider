import { DEBUG_LOGGER_STORAGE_KEY } from './consts';

enum LogLevel {
  DEBUG = 0,
  LOG,
  WARN,
  ERROR,
}

function getStoredLogConfig(): LogLevel | undefined {
  if (typeof localStorage === 'undefined') {
    return undefined;
  }

  const config = localStorage.getItem(DEBUG_LOGGER_STORAGE_KEY);

  if (config !== null) {
    try {
      const level = parseInt(config, 10);
      if (level in LogLevel) {
        return level as LogLevel;
      }
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function setStoredLogConfig(config: LogLevel) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEBUG_LOGGER_STORAGE_KEY, config.toString());
  }
}

class Logger {
  private module?: string | null;
  private level: LogLevel;

  constructor(module: string | null = null) {
    this.module = module;
    const config = getStoredLogConfig();
    this.level = config ?? LogLevel.DEBUG;
    if (process.env.NODE_ENV === 'production') {
      this.level = config ?? LogLevel.ERROR;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatMessage(...args: unknown[]): unknown[] {
    return this.module ? [`[${this.module}]:`, ...args] : args;
  }

  debug(...args: unknown[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(...this.formatMessage(...args));
    }
  }

  log(...args: unknown[]) {
    if (this.shouldLog(LogLevel.LOG)) {
      console.log(...this.formatMessage(...args));
    }
  }

  warn(...args: unknown[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(...this.formatMessage(...args));
    }
  }

  error(...args: unknown[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(...this.formatMessage(...args));
    }
  }
}

const commonLogger = new Logger();
export { Logger, LogLevel, commonLogger, setStoredLogConfig };
