// lib a22-shared
import { MediaFile } from "./media-file";

export namespace TaskProc {

	// Define available single task types
	const singleTaskTypes = [
		'TID_ANALYZE-MEDIA-INFO',
		'TID_ADD_MEDIAFILE',
		'TID_DELETE_MEDIAFILES',
		'TID_UPDATE_MEDIAFILE',
		'TID_GET_MEDIAFILES_REQ',
	] as const;

	// The SingleTaskType type corresponds to the literal types of singleTaskTypes
	export type SingleTaskType = typeof singleTaskTypes[number];

	// Helper function to check if a string is a valid SingleTaskType
	export function isSingleTaskTypes(value: string): value is SingleTaskType {
		return singleTaskTypes.includes(value as SingleTaskType);
	}

	// Define available batch task types
	const batchTaskTypes = [
		'BTID_DOWNLOAD_MEDIAFILES_REQ',
		'BTID_BATCH_TASKS_STATE_PUSH_ON',
		'BTID_BATCH_TASKS_STATE_PUSH_OFF',
	] as const;

	// The BatchTaskType type corresponds to the literal types of batchTaskTypes
	export type BatchTaskType = typeof batchTaskTypes[number];

	// Helper function to check if a string is a valid BatchTaskType
	export function isBatchTaskType(value: string): value is BatchTaskType {
		return batchTaskTypes.includes(value as BatchTaskType);
	}

	// A union type that includes both SingleTaskType and BatchTaskType
	export type TaskType = SingleTaskType | BatchTaskType;

	// Generic payload type
	export type Payload = any;


	export type EventResp = {
		taskId: string;
		type: 'progress' | 'result' | 'error' | 'cancelled';
		message?: string;
		payload: any;
	}

	export type EventBroadcastType = 'MEDIAFILES_LIST' | 'SEQ-PROCESSOR-TASKS-LIST';

	export type EventBroadcast = {
		taskId: 'BROADCAST';
		type: EventBroadcastType;
		payload: any;
	}

	export type EventType = any;

	// Event emitted by tasks with type, taskId, and payload
	export type Event = EventResp | EventBroadcast;

	// Task execution parameters including the payload, signal, and emit function
	export type Params<T = Payload> = {
		payload: T;
		signal: AbortSignal;
		emit: EmitFn;
	}

	// A handler function for tasks
	export type Handler = (params: Params) => Promise<void>;

	// Registered task interface
	export interface RegisteredTask {
		type: TaskType;
		handler: Handler;
		cancellable?: boolean;
	}

	// Emit function used to emit events (progress, result, error, etc.)
	export type EmitFn = {
		(event: Omit<EventResp, 'taskId'>): void;
	}

	export type EmitBroadcastFn = {
		(event: Omit<EventBroadcast, 'taskId'>): void;
	}

	// Input for invoking tasks, contains type and payload
	export type Input = {
		type: TaskType;
		payload: any
	};

	/**
	 * TID_ANALYZE-MEDIA-INFO
	 * Payload type for analyzing media info task
	 */
	export type AnalyzeMediaPayload = {
		url: string;
	}
	export type AnalyzeMediaHandler = (params: TaskProc.Params<AnalyzeMediaPayload>) => Promise<void>;

	/**
	 * TID_ADD_MEDIAFILE
	 * Payload type for adding a media file task
	 */
	export type AddMediafilePayload = {
		file: MediaFile.Data;
	}
	export type AddMediafileHandler = (params: TaskProc.Params<AddMediafilePayload>) => Promise<void>;

	/**
	 * TID_DELETE_MEDIAFILES
	 * Payload type for deleting multiple media files
	 */
	export type DeleteMediafilesPayload = {
		deleteFileIds: Array<string>;  // Array of file IDs to delete
	}
	export type DeleteMediafilesHandler = (params: TaskProc.Params<DeleteMediafilesPayload>) => Promise<void>;

	/**
	 * TID_UPDATE_MEDIAFILE
	 * Payload type for updating a media file
	 */
	export type UpdateMediafilePayload = {
		updatedFile: MediaFile.Data;  // Updated media file data
	}
	export type UpdateMediafileHandler = (params: TaskProc.Params<UpdateMediafilePayload>) => Promise<void>;

	/**
	 * BTID_DOWNLOAD_MEDIAFILES_REQ
	 * Payload type for downloading multiple media files
	 */
	// batch task payload
	export type DownloadMediafilesReqPayload = Array<MediaFile.Data>;  // Array of media files to download
	// single task payload
	export type DownloadMediafileReqPayload = MediaFile.Data;  // Media files to download

	export type DownloadMediafileReqHandlerSingle = (params: TaskProc.Params<DownloadMediafileReqPayload>) => Promise<void>;

	/**
	 * TID_GET_MEDIAFILES_REQ
	 * Payload type for downloading multiple media files
	 */
	export type GetMediafilesReqPayload = null; // Filter?
	export type GetMediafilesReqHandler = (params: TaskProc.Params<GetMediafilesReqPayload>) => Promise<void>;

	/**
	 * 'BTID_BATCH_TASKS_STATE_PUSH_ON',
	 * 'BTID_BATCH_TASKS_STATE_PUSH_OFF',
	 *  
	 */
	export type TasksStatePushReqPayload = {
		pushInterval: number;
	};  // Media files to download
}
