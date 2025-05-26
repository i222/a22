/**
 * AppServiceContainer is a service container that manages core services for the application.
 * 
 * It extends the `TypedServiceContainer` class and registers essential services like `console`, 
 * `ytdlp`, and `queue` with their respective factories. It also provides named getters for easy access
 * to the registered services.
 * 
 * Features:
 * - Registers core services using `registerCoreServices`.
 * - Provides named getters for each service (`consoleService`, `ytdlpService`, `queueService`).
 * 
 * Usage:
 * 
 * const container = new AppServiceContainer();
 * container.registerCoreServices(getWindow);  // register core services
 * 
 * const consoleService = container.consoleService;  // access the console service
 * const ytdlpService = container.ytdlpService;    // access the ytdlp service
 * const queueService = container.queueService;    // access the queue service
 */

import { BrowserWindow } from "electron";
import { ConsoleService } from "../lib/services/console-service.js";
import { TypedServiceContainer } from "../lib/services/service-container.js";
import { YTDLPService } from "./ytdlp-service.js";
import { JsonQueueStore } from "./json-queue-store-service.js";
import { AbstractQueueStore } from "../lib/services/abstract-queue-store.js";
import { AbstractConfigStore } from "src/lib/services/abstract-config-store.js";
import { TaskProc } from "a22-shared";
import { ElectronConfigStore } from "./electron-config-store.js";


// Define the services that will be managed by the container
interface AppServices {
	console: ConsoleService;
	ytdlp: YTDLPService;
	queue: AbstractQueueStore;
	settings: AbstractConfigStore<TaskProc.AppSettings>;
}

/**
 * AppServiceContainer is a concrete implementation of the TypedServiceContainer, 
 * responsible for registering and managing core application services.
 */
class AppServiceContainer extends TypedServiceContainer<AppServices> {
	// Register core services with their respective factories
	registerCoreServices(getWindow: () => BrowserWindow | null) {
		this.register('console', () => new ConsoleService(getWindow));
		this.register('ytdlp', () => new YTDLPService(getWindow));
		this.register('queue', () => new JsonQueueStore(getWindow));
		this.register('settings', () => new ElectronConfigStore<TaskProc.AppSettings>());
		console.log('[Service Container] core services added');
	}

	// Named getter for console service
	get consoleService() {
		return this.get('console');
	}

	// Named getter for ytdlp service
	get ytdlpService() {
		return this.get('ytdlp');
	}

	// Named getter for queue service
	get queueService(): Promise<AbstractQueueStore> {
		return this.get('queue');
	}

	get appSettingsService(): Promise<AbstractConfigStore<TaskProc.AppSettings>> {
		return this.get('settings');
	}
}

// Create a global instance of the AppServiceContainer
export const serviceContainer = new AppServiceContainer();