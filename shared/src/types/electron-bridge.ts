import { MediaFile } from "./media-file";
import { TaskProc } from "./task-processor";

/**
 * ElectronBridge interface defines the available methods that can be called
 * from the renderer process using IPC. This helps ensure type safety
 * across all interactions between the renderer and main process.
 */
export interface ElectronBridge {
	/**
	 * Analyze the media source (e.g., YouTube URL) and return either
	 * detailed metadata or summary info if it's a playlist.
	 */
	getSourceByUrl(url: string): Promise<MediaFile.SourceFile | MediaFile.UrlInfo>;

	/**
	 * Add a media source to the persistent store (e.g. DB or file list).
	 */
	addSource(source: MediaFile.Data): Promise<boolean>;

	/**
	 * Fetch the list of all saved media entries.
	 */
	getList(): Promise<Array<MediaFile.Data>>;

	/**
	 * Run a registered background task by name and payload.
	 * Returns a unique taskId for tracking.
	 */
	runTask(task: TaskProc.Input): Promise<string>;

	/**
	 * Abort a running task by taskId (if it is cancellable).
	 */
	abortTask(taskId: string): Promise<boolean>;

	// onTaskProcessorEvent: (callback: Function) => void,
	// offTaskProcessorEvent: () => void,

	// onEvent(callback: (payload: any) => void);

	// Subscribe to events
	subscribe(eventHandler: (event: TaskProc.Event) => void): void;

	// Unsubscribe from events
	// unsubscribe(eventHandler: (event: TaskProc.Event) => void): void;

}

/**
 * Utility to validate that the bridge object implements all required methods.
 * Useful for runtime verification of preload-injected bridges in the renderer.
 */
export function validateElectronBridge(bridge: ElectronBridge): boolean {
	const methods: (keyof ElectronBridge)[] = Object.keys(bridge) as (keyof ElectronBridge)[];

	console.log('[Bridge][Check] methods =', methods.join(', '));

	return methods.every((method) => typeof bridge[method] === 'function');
}


/**
 * IPC Constants for communication between main and renderer processes.
 * These constants are used for all IPC messages to ensure consistency
 * and type-safety across the application.
 *
 * Invoke-type constants are used with ipcRenderer.invoke (request-response).
 * On-type constants are used with ipcRenderer.on (event-based).
 */

/**
 * List of all invoke IPC channels, used with ipcRenderer.invoke.
 */
export const allConstantsInvoke = [
	'CID_GET_SOURCE_INFO',   // Request media info by URL
	'CID_ADD_SOURCE',        // Add a new media file to database
	'CID_GET_LIST',          // Get the list of media sources

	'CID_RUN_TASK',          // Start a long-running background task
	'CID_ABORT_TASK',        // Abort a previously started task
] as const;

/**
 * Union type of all invoke IPC constants.
 */
export type IPCConstantsInvoke = typeof allConstantsInvoke[number];

/**
 * List of event-based (listener) channels, used with ipcRenderer.on.
 */
export type IPCConstantsOn =
	| 'CID_ON_CONSOLE_LOG'            // Console log forwarding from main
	| 'CID_ON_TASK_PROCESSOR_EVENT';  // Events emitted by TaskProcessor (progress, result, etc.)

/**
 * The name under which the ElectronBridge is exposed in window context.
 */
export const RIPIT_BRIDGE_NAME = 'electronBridge';
