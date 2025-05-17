// lib a22-shared
import { MediaFile } from "./media-file";

export namespace TaskProc {

	// Define available task types
	const taskTypes = [
		'analyze-media-info',
		'TID_ANALYZE-MEDIA-INFO',
		'TID_ADD_MEDIAFILE',
		'TID_DELETE_MEDIAFILES',
		'TID_UPDATE_MEDIAFILE',
		'TID_GET_MEDIAFILES_REQ',
		'TID_DOWNLOAD_MEDIAFILES_REQ',
	] as const;

	// The TaskType type now corresponds to the literal types of taskTypes
	export type TaskType = typeof taskTypes[number];

	// Helper function to check if a string is a valid TaskType
	function isTaskType(value: string): value is TaskType {
		return taskTypes.includes(value as TaskType);
	}

	// Generic payload type
	export type Payload = any;

	export type EventResp = {
		taskId: string;
		type: 'progress' | 'result' | 'error' | 'cancelled';
		payload: any;
	}

	export type EventBroadcastType = 'MEDIAFILES_LIST';

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
	 * TID_DOWNLOAD_MEDIAFILES_REQ
	 * Payload type for downloading multiple media files
	 */
	export type DownloadMediafilesReqPayload = {
		downloadFiles: Array<MediaFile.Data>;  // Array of media files to download
	}
	export type DownloadMediafilesReqHandler = (params: TaskProc.Params<DownloadMediafilesReqPayload>) => Promise<void>;

	/**
	 * TID_GET_MEDIAFILES_REQ
	 * Payload type for downloading multiple media files
	 */
	export type GetMediafilesReqPayload = null; // Filter?
	export type GetMediafilesReqHandler = (params: TaskProc.Params<GetMediafilesReqPayload>) => Promise<void>;

}
