// system/src/tasks/get-media-filed-req-task.ts

import { TaskProc } from "a22-shared";
import { serviceContainer } from "../services/service-container";

export const GetMediaFilesReqTask: TaskProc.AddMediafileHandler = async ({ payload, signal, emit }) => {
	// const { file } = payload;

	try {
		// Get the queue service to add the file
		const queueService = await serviceContainer.queueService;
		// const result = await queueService.add(file);
		await queueService.requestList();

		// Emit a success result event
		// emit({
		// 	type: 'result',
		// 	payload: { success: 'requested' },
		// });
	} catch (error) {
		// Emit an error event if something goes wrong
		emit({
			type: 'error',
			payload: error,
		});
	}
};
