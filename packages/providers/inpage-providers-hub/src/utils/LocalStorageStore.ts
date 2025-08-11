/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// LocalStorageStore 基础类
export class LocalStorageStore {
  private memoryCache: Map<string, any> = new Map();
  private writeTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly writeDelay: number = 100; // 延迟写入时间

  constructor(private keyPrefix: string = '$onekey.local_storage_store.') {}

  // 获取值：优先内存，内存为空时同步读 localStorage
  get<T>(key: string): T | undefined {
    // 1. 先检查内存缓存
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. 内存为空，同步读取 localStorage
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

  // 设置值：立即更新内存，异步写入 localStorage
  set<T>(key: string, value: T): void {
    // 1. 立即更新内存缓存
    this.memoryCache.set(key, value);

    // 2. 清除之前的写入定时器
    const existingTimer = this.writeTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 3. 设置新的异步写入定时器
    const timer = setTimeout(() => {
      this.writeToLocalStorage(key, value);
      this.writeTimers.delete(key);
    }, this.writeDelay);

    this.writeTimers.set(key, timer);
  }

  // 异步写入 localStorage
  private writeToLocalStorage<T>(key: string, value: T): void {
    try {
      const storageKey = this.keyPrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write to localStorage: ${key}`, error);
    }
  }

  // 删除值
  remove(key: string): void {
    this.memoryCache.delete(key);

    // 清除写入定时器
    const timer = this.writeTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.writeTimers.delete(key);
    }

    // 异步删除 localStorage
    setTimeout(() => {
      try {
        const storageKey = this.keyPrefix + key;
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.warn(`Failed to remove from localStorage: ${key}`, error);
      }
    }, this.writeDelay);
  }

  // 立即刷新所有待写入的数据到 localStorage
  flush(): void {
    for (const [key, timer] of this.writeTimers) {
      clearTimeout(timer);
      const value = this.memoryCache.get(key);
      this.writeToLocalStorage(key, value);
    }
    this.writeTimers.clear();
  }
}
