// system/src/tasks/update_media_file_task.ts

import { TaskProc } from "a22-shared";
import { serviceContainer } from "../services/service-container";

/**
 * Task handler to update a media file in the queue.
 * 
 * @param params - Task execution parameters including:
 *   - payload: contains the updated file data
 *   - signal: abort signal for task cancellation
 *   - emit: function to emit events like progress or result
 * 
 * This task updates a media file in the queue with the new information provided.
 * A result event is emitted if the file is updated successfully, or an error event if something goes wrong.
 */
export const UpdateMediaFileTask: TaskProc.UpdateMediafileHandler = async ({ payload, signal, emit }) => {
  const { updatedFile } = payload;

  try {
    // Get the queue service to update the file
    const queueService = await serviceContainer.queueService;

    // Update the file in the queue
    const result = await queueService.update(updatedFile);

    // Emit a success result event
    emit({
      type: 'result',
      message: 'File updated',
      payload: { updated: result },
    });
  } catch (error) {
    // Emit an error event if something goes wrong
    emit({
      type: 'error',
      message: error,
      payload: null,
    });
  }
};
