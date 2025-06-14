// system/src/tasks/delete-media-file-task.ts
import { TaskProc } from "a22-shared";
import { serviceContainer } from "../services/service-container.js";

/**
 * Task handler to delete media files from the queue.
 * 
 * @param params - Task execution parameters including:
 *   - payload: contains the array of file IDs to delete
 *   - signal: abort signal for task cancellation NOT SUPPORTED
 *   - emit: function to emit events like progress or result
 * 
 * This task removes files with specified IDs from the queue.
 * A result event is emitted if the files are deleted successfully, or an error event if something goes wrong.
 */
export const DeleteMediaFilesTask: TaskProc.DeleteMediafilesHandler = async ({ payload, signal, emit }) => {
	const { deleteFileIds } = payload;

	try {
		// Get the queue service to remove the files
		const count = deleteFileIds?.length;
		const queueService = await serviceContainer.queueService;
		await queueService.removeFiles(deleteFileIds);


		// Emit a success result event
		emit({
			type: 'result',
			message: `Success: ${count} media file${count > 1 ? 's' : ''} deleted`,
			payload: { deleted: deleteFileIds },
		});

		// send updated list to UI
		await queueService.requestList();

	} catch (error) {
		// Emit an error event if something goes wrong
		emit({
			type: 'error',
			message: 'Media files deleting error:' + error.message,
			payload: error,
		});
	}
};
