// system/src/tasks/get-app-setting-task.ts

import { TaskProc } from "a22-shared";
// import { serviceContainer } from "../services/service-container";

export const AppSettingsGetTask: TaskProc.Handler = async ({ payload, signal, emit }) => {

	try {
		// Get from storage
		const appSettings: TaskProc.AppSettings = {
			baseDownloadDir: '/Download'
		}

		// Emit a success result event
		emit({
			type: 'result',
			payload: appSettings,
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
