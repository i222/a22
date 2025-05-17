import mitt from 'mitt';
import { ElectronBridge, TaskProc, MediaFile, RIPIT_BRIDGE_NAME, validateElectronBridge } from 'a22-shared';
import { A22_ENV_USE_MOCK } from '../env-config';
import { mockElectronBridge } from '../../mocks/mockElectronBridge';

/**
 * Service for interacting with the Electron Bridge and handling events.
 * It provides an abstraction for subscribing to events and executing tasks via the bridge.
 */
class EventService {
	private bridge: ElectronBridge;  // The Electron bridge instance for communication with Electron
	private eventEmitter = mitt();   // Event emitter to handle subscriptions

	constructor() {
		// Determine whether to use the mock or the real bridge
		const bridge = A22_ENV_USE_MOCK
			? mockElectronBridge as ElectronBridge
			: window[RIPIT_BRIDGE_NAME] as ElectronBridge;

		if (!bridge) {
			console.error('ElectronBridge not found on window');
			throw new Error('ElectronBridge is missing');
		}

		if (!validateElectronBridge(bridge)) {
			throw new Error('ElectronBridge is missing required handlers');
		}

		this.bridge = bridge;

		// Subscribe to events from the Electron bridge
		bridge.subscribe(this.internalEventHandler);
	}

	/**
	 * Subscribe to events from the bridge.
	 * @param handler The callback function that will be called when an event is received.
	 */
	subscribe(handler: (payload: TaskProc.Event) => void) {
		this.eventEmitter.on('taskEvent', handler);
	}

	/**
	 * Unsubscribe from events.
	 * @param handler The callback function that will no longer be called when an event is received.
	 */
	unsubscribe(handler: (payload: TaskProc.Event) => void) {
		this.eventEmitter.off('taskEvent', handler);
	}

	/**
	 * Internal handler for processing events and emitting them through the EventEmitter.
	 * @param payload The event data received from the bridge.
	 */
	private internalEventHandler = (event: TaskProc.Event) => {
		// console.log('[UI][BridgeService]', { event, this: this })
		this.eventEmitter?.emit('taskEvent', event);
	}

	/**
		 * Get the source by URL.
		 * @param url The URL for finding the source.
		 * @returns A promise with the found source.
		 */
	getSourceByUrl(url: string): Promise<MediaFile.SourceFile | MediaFile.UrlInfo> {
		return this.bridge.getSourceByUrl(url);
	}

	/**
	 * Add a new source to the system.
	 * @param source The source data to add.
	 * @returns A promise with the result of the addition.
	 */
	addSource(source: MediaFile.Data): Promise<boolean> {
		return this.bridge.addSource(source);
	}

	/**
	 * Get a list of all sources.
	 * @returns A promise with an array of source data.
	 */
	getList(): Promise<MediaFile.Data[]> {
		return this.bridge.getList();
	}

	/**
	 * Run a task on the bridge.
	 * @param task The task to execute.
	 * @returns A promise with the result of the task execution.
	 */
	runTask(task: TaskProc.Input): Promise<string> {
		return this.bridge.runTask(task);
	}

	/**
	 * Abort a task by its ID.
	 * @param taskId The ID of the task to abort.
	 * @returns A promise with the result of aborting the task.
	 */
	abortTask(taskId: string): Promise<boolean> {
		return this.bridge.abortTask(taskId);
	}
}

export default EventService;
