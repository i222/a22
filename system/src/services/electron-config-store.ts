import Store, { Schema } from 'electron-store';
import { AbstractConfigStore } from 'src/lib/services/abstract-config-store.js';

/**
 * Electron Store-based implementation of ConfigStore.
 * Provides persistent storage for application configuration.
 */
export class ElectronConfigStore<T extends Record<string, any>> implements AbstractConfigStore<T> {
	private store: Store<T>;

	/**
	 * Creates an instance of ElectronConfigStore.
	 * @param storeName - The name of the store (used as filename, e.g. config.json).
	 * @param defaults - Optional default values to initialize the store if no file exists.
	 * 
	 * When the Store instance is created, electron-store automatically:
	 * - Loads existing data from the config file if it exists.
	 * - Creates a new config file with default values if no file is found.
	 */
	constructor(storeName: string = 'config', defaults: T, schema: Schema<T>) {
		this.store = new Store<T>({ name: storeName, defaults, schema });
	}

	/**
	 * Sets a single configuration parameter.
	 * @param key - The key to set.
	 * @param value - The value to store.
	 */
	setParam<K extends keyof T>(key: K, value: T[K]): void {
		this.store.set(key, value);
	}

	/**
	 * Gets a single configuration parameter.
	 * @param key - The key to retrieve.
	 * @returns The stored value or undefined if not set.
	 */
	getParam<K extends keyof T>(key: K): T[K] | undefined {
		return this.store.get(key);
	}

	/**
	 * Sets the entire configuration object.
	 * @param config - The full configuration to save.
	 */
	setConfig(config: T): void {
		this.store.set(config); // Save full config to file
	}

	/**
	 * Retrieves the entire configuration object currently in memory.
	 * @returns The current config.
	 */
	getConfig(): T {
		return this.store.store;
	}
}
