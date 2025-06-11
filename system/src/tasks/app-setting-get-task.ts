// system/src/tasks/get-app-setting-task.ts

import { TaskProc } from "a22-shared";
import { serviceContainer } from "../services/service-container.js";

export const AppSettingsGetTask: TaskProc.Handler = async ({ payload, signal, emit }) => {

	try {
		const service = await serviceContainer.appSettingsService;
		const storedSettings = service.getConfig();

		// Emit a success result event
		emit({
			type: 'result',
			payload: storedSettings,
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
