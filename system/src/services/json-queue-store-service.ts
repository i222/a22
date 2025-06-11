/**
 * system/src/services/json-queue-store-service.ts
 * 
 * JSON file-based implementation of QueueStore with in-memory cache,
 * validation on load, and safe, serialized writing to disk.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { AbstractQueueStore } from '../lib/services/abstract-queue-store.js';
import { MediaFile, TaskProc } from 'a22-shared';
import { SafeFileWriter } from '../lib/io/safe-file-writer.js';
import { MediaFileValidation } from '../utils/validation/media-data.validator.js';
import { FileRotationUtil } from '../utils/file-rotation.js';
import { IPCConstantsInvoke } from 'a22-shared';

export class JsonQueueStore extends AbstractQueueStore {
	private readonly filePath: string;
	private readonly writer: SafeFileWriter;
	private memoryQueue: MediaFile.Data[] = [];
	private invalidEntries: Array<MediaFileValidation.InvalidRecord> = [];
	private readonly rotationUtil: FileRotationUtil;

	constructor(private getWindow: () => BrowserWindow | null) {
		super();
		const userDataPath = app.getPath('userData');
		this.filePath = path.join(userDataPath, 'queue.json');
		this.writer = new SafeFileWriter(this.filePath);
		this.rotationUtil = new FileRotationUtil(path.dirname(this.filePath));
	}

	async init(): Promise<void> {
		try {
			// Ensure the file exists or is created if missing
			await this.checkOrInitStoreFile();

			// Load and validate data from the store
			const { validQueue, invalidEntries } = await this.loadStore();

			// If data is loaded successfully, set the in-memory queue and invalid entries
			this.memoryQueue = validQueue;
			this.invalidEntries = invalidEntries;

			// If the queue is valid and contains data, perform backup and cleanup
			if (this.memoryQueue.length > 0 && this.invalidEntries.length === 0) {
				await this.rotationUtil.rotateAndBackup();
			}
		} catch (err) {
			// In case of an error, log the error and clear the queue and invalid entries
			console.error('[Queue] Failed to load and validate the queue', err);

			// Set the memory queue and invalid entries to empty arrays on error
			this.memoryQueue = [];
			this.invalidEntries = [];
		}
	}

	private async loadStore(): Promise<{ validQueue: MediaFile.Data[], invalidEntries: Array<MediaFileValidation.InvalidRecord> }> {
		let validQueue: MediaFile.Data[] = [];
		let invalidEntries: Array<MediaFileValidation.InvalidRecord> = [];

		try {
			console.log('[QueueService][loadStore]');
			const raw = await this.writer.read();
			const parsed = JSON.parse(raw);

			if (!Array.isArray(parsed)) {
				invalidEntries.push({ index: -1, error: 'Root is not array', record: parsed });
				return { validQueue, invalidEntries };
			}

			if (parsed.length === 0) {
				console.warn('[Queue] Loaded empty queue from disk');
			}

			// Use validateAndCloneMediaFiles
			console.log('[QueueService][loadStore] loaded length=', parsed?.length);
			const { valid, invalid } = MediaFileValidation.validatedClone(parsed);

			validQueue = valid;
			invalidEntries = invalid;
		} catch (err) {
			// In case of any error (except file not found), throw it
			throw err;
		}

		console.log('[QueueService][loadStore] INVALID COUNT:' + invalidEntries?.length || 'none');
		return { validQueue, invalidEntries };
	}

	async add(file: MediaFile.Data): Promise<boolean> {
		console.log('[QueueService][Add] data = ', file);
		const exists = this.memoryQueue.some(item => item.id === file.id);
		if (!exists) {
			this.memoryQueue.push(file);
			await this.writer.scheduleWrite(this.memoryQueue);
			return true;
		}
		return false;
	}

	/**
	 * Updates a file in the queue.
	 * This method will search for a file by ID and update its data with the provided new file.
	 * If the file doesn't exist in the queue, it will return false.
	 * 
	 * @param file - The file to update with new data.
	 * @returns A promise that resolves to true if the update was successful, false if the file was not found.
	 */
	async update(file: MediaFile.Data): Promise<boolean> {
		const index = this.memoryQueue.findIndex(item => item.id === file.id);
		if (index !== -1) {
			// Update the file in memory
			this.memoryQueue[index] = file;

			// Write the updated queue back to disk
			await this.writer.scheduleWrite(this.memoryQueue);
			console.log('[QueueService][Update] File updated:', file.id);
			return true;
		}

		// If file was not found, return false
		console.log('[QueueService][Update] File not found for update:', file.id);
		return false;
	}

	async removeFiles(ids: string[]): Promise<void> {
		this.memoryQueue = this.memoryQueue.filter(item => !ids.includes(item.id));
		await this.writer.scheduleWrite(this.memoryQueue);
	}

	async getList(): Promise<MediaFile.Data[]> {
		console.log('[Queue][Getlist] ', this.memoryQueue);
		return structuredClone(this.memoryQueue);
	}

	async requestList(): Promise<void> {
		const event: TaskProc.EventBroadcast = {
			taskId: 'BROADCAST',
			type: 'MEDIAFILES_LIST',
			payload: await this.getList()
		}

		console.log('[Queue][Request List] resp', event);
		try {
		this.broadcast(event);
		} catch (e) {
			console.log('[Queue][Request List] ERROR ', e);
		}
		// return structuredClone(this.memoryQueue);
	}

	private broadcast(event: TaskProc.EventBroadcast) {
		this.getWindow().webContents.send("CID_ON_TASK_PROCESSOR_EVENT", event)
	}

	getInvalidEntries() {
		return this.invalidEntries;
	}

	// Method to check if the file exists, and create it with [] if it doesn't
	private async checkOrInitStoreFile(): Promise<void> {
		try {
			// Try reading the file to check if it exists
			await this.writer.read();
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
				// If the file doesn't exist, create it with an empty array []
				console.log('[Queue] No queue file found, creating a new one with an empty array');
				await this.writer.scheduleWrite('[]'); // Write empty array to the file
			} else {
				// If there is another error, rethrow it
				throw err;
			}
		}
	}

	public async handleAll() {
		const handlers: Handlers = [
			{ channel: 'CID_GET_LIST', listener: this.getListHandler },
			{ channel: 'CID_ADD_SOURCE', listener: this.addListener },
			// { channel: 'CID_UPDATE_FILE', listener: this.updateListener },
			// { channel: 'CID_DELETE_FILE', listener: this.deleteListener },
		];

		// Async add handlers
		for (const { channel, listener } of handlers) {
			await ipcMain.handle(channel, listener);
		}
	}

	public getListHandler: (_event: Electron.IpcMainInvokeEvent) => Promise<Array<MediaFile.Data>> =
		async (_event) => this.getList();

	public addListener: (_event: Electron.IpcMainInvokeEvent, data: MediaFile.Data) => Promise<boolean> =
		async (_event, data) => this.add(data);

	public deleteListener: (_event: Electron.IpcMainInvokeEvent, data: Array<string>) => Promise<void> =
		async (_event, data) => this.removeFiles(data);

	public updateListener: (_event: Electron.IpcMainInvokeEvent, data: MediaFile.Data) => Promise<boolean> =
		async (_event, data) => this.update(data);
}

type Handlers = Array<{ channel: IPCConstantsInvoke, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any>) | (any) }>;
