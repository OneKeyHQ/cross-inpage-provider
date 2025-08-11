/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
export class LocalStorageStore {
  private memoryCache: Map<string, any> = new Map();
  private writeTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly writeDelay: number = 100; // 延迟写入时间

  constructor(private keyPrefix: string = '$onekey.local_storage_store.') {}

  get<T>(key: string): T | undefined {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    try {
      const storageKey = this.keyPrefix + key;
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const value = JSON.parse(stored);
        this.memoryCache.set(key, value); // 同时更新内存缓存
        return value;
      }
    } catch (error) {
      console.warn(`Failed to read from localStorage: ${key}`, error);
    }

    return undefined;
  }

  set<T>(key: string, value: T): void {
    this.memoryCache.set(key, value);

    const existingTimer = this.writeTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.writeToLocalStorage(key, value);
      this.writeTimers.delete(key);
    }, this.writeDelay);

    this.writeTimers.set(key, timer);
  }

  private writeToLocalStorage<T>(key: string, value: T): void {
    try {
      const storageKey = this.keyPrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write to localStorage: ${key}`, error);
    }
  }

  remove(key: string): void {
    this.memoryCache.delete(key);

    const timer = this.writeTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.writeTimers.delete(key);
    }

    setTimeout(() => {
      try {
        const storageKey = this.keyPrefix + key;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn(`Failed to remove from localStorage: ${key}`, error);
      }
    }, this.writeDelay);
  }

  flush(): void {
    for (const [key, timer] of this.writeTimers) {
      clearTimeout(timer);
      const value = this.memoryCache.get(key);
      this.writeToLocalStorage(key, value);
    }
    this.writeTimers.clear();
  }
}
