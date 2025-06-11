// system/src/lib/services/abstract-config-store.ts

/**
 * Abstract class for configuration storage management.
 * Defines a generic structure for storing configuration.
 */
export abstract class AbstractConfigStore<T extends Record<string, any>> {
  /**
   * Sets a configuration parameter by key.
   * @param key - The parameter name
   * @param value - The parameter value
   */
  abstract setParam<K extends keyof T>(key: K, value: T[K]): void;

  /**
   * Gets a configuration parameter by key.
   * @param key - The parameter name
   * @returns The value of the parameter or undefined if not found
   */
  abstract getParam<K extends keyof T>(key: K): T[K] | undefined;

  /**
   * Sets the entire configuration object.
   * @param config - The configuration object
   */
  abstract setConfig(config: T): void;

  /**
   * Retrieves the entire configuration object.
   * @returns The configuration object
   */
  abstract getConfig(): T;
}
