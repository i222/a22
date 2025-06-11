import { TaskProc } from "a22-shared";
import { serviceContainer } from "../services/service-container.js";

/**
 * Task handler to add a media file to the queue.
 * 
 * @param params - Task execution parameters including:
 *   - payload: the media file data to add
 *   - signal: abort signal for task cancellation - NOT SUPPORTED
 *   - emit: function to emit events like progress or result
 * 
 * This task adds a media file to the queue and emits a result event.
 * If an error occurs, an error event is emitted.
 */
export const AddMediaFileTask: TaskProc.AddMediafileHandler = async ({ payload, signal, emit }) => {
	const { file } = payload;

	try {
		// Get the queue service to add the file
		const queueService = await serviceContainer.queueService;
		const result = await queueService.add(file);

		// Emit a success result event
		emit({
			type: 'result',
			message: 'Media file successfully added',
			payload: { success: result },
		});
	} catch (error) {
		// Emit an error event if something goes wrong
		emit({
			type: 'error',
			message: 'Media file can\'t be added. Error: ' + error,
			payload: null,
		});
	}
};
