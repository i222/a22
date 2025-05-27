// system/src/tasks/app-setting-change-task.ts

import { TaskProc } from "a22-shared";
import { dialog } from "electron";  // Electron dialog for folder selection
import { serviceContainer } from "../services/service-container.js";
import { get } from 'lodash-es';

/**
 * Shows the system folder selection dialog.
 * Returns selected folder path or null if cancelled.
 */
async function showSelectFolderDialog(prev: string): Promise<string | null> {
	// Open folder selection dialog with the previous path as default
	const result = await dialog.showOpenDialog({
		defaultPath: prev,
		properties: ["openDirectory"],
		title: "Select folder",
	});

	// Safely get the first selected folder path or null if none selected
	const filePaths = get(result, 'filePaths[0]', null);

	console.log('[AppSettingsChangeTask]', { result, filePaths });
	return filePaths;
}

export const AppSettingsChangeTask: TaskProc.Handler = async ({ payload, signal, emit }) => {
	try {
		// Extract the field to change from the task payload
		const changeField = (payload as TaskProc.AppSettingsChangeDirReqPayload)?.changeField || null;

		// Validate that changeField is provided and supported
		if (!changeField) {
			throw new Error(`Unsupported changeField: ${changeField}`);
		}

		// Get the app settings service instance from the service container
		const service = await serviceContainer.appSettingsService;
		// Retrieve current app settings from the service
		const currentSettings = service.getConfig();

		// Show folder selection dialog starting from current setting value
		let selected = await showSelectFolderDialog(currentSettings[changeField]);

		// If user cancels or no folder selected, emit current settings as result and exit
		if (!selected) {
			emit({
				type: "result",
				payload: currentSettings,
			});
			return;
		}

		// Create updated settings object by overriding the changed field
		const newSettings: TaskProc.AppSettings = {
			...currentSettings,
			[changeField]: selected,
		};

		console.log('[AppSettingsChangeTask]', { newSettings });

		// Persist the updated settings through the service
		service.setConfig(newSettings);

		// Emit the updated settings as the result of the task
		emit({
			type: "result",
			payload: newSettings,
		});
	} catch (error: any) {
		// Emit error event if any exception occurs
		emit({
			type: "error",
			message: error.message || String(error),
			payload: null,
		});
	}
};
