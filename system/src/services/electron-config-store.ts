// system/src/services/electron-config-store.ts
import Store from 'electron-store';
import { AbstractConfigStore } from 'src/lib/services/abstract-config-store.js';

/**
 * Electron Store-based implementation of ConfigStore.
 * Provides persistent storage for application configuration.
 */
export class ElectronConfigStore<T extends Record<string, any>> implements AbstractConfigStore<T> {
  private store: Store<T>;

  constructor(storeName: string = 'config', defaults?: T) {
    this.store = new Store<T>({ name: storeName, defaults });
  }

  setParam<K extends keyof T>(key: K, value: T[K]): void {
    this.store.set(key, value);
  }

  getParam<K extends keyof T>(key: K): T[K] | undefined {
    return this.store.get(key);
  }

  setConfig(config: T): void {
    this.store.set(config); // ✅ Now TypeScript recognizes `.set()`
  }

  getConfig(): T {
    return this.store.store;
  }
}
