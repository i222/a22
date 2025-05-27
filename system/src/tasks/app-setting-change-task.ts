// system/src/tasks/app-setting-change-task.ts

import { TaskProc } from "a22-shared";
import path from "path";
import os from "os";
import { dialog } from "electron";  // Electron dialog for folder selection

/**
 * Shows the system folder selection dialog.
 * Returns selected folder path or null if cancelled.
 */
async function showSelectFolderDialog(prev: string): Promise<string | null> {
	const result = await dialog.showOpenDialog({
		defaultPath: prev,
		properties: ["openDirectory"],
		title: "Select folder",
	});

	// if (result.canceled || isNil(result.filePaths) || result.filePaths.length === 0) {
	// 	return null;
	// }

	console.log('[AppSettingsChangeTask]', { result })
	return result.filePaths[0];
}

/**
 * Abstract function to save app settings.
 * Should be implemented elsewhere to persist settings.
 */
async function saveAppSettings(settings: TaskProc.AppSettings): Promise<void> {
	// Implement saving logic externally
	// throw new Error("saveAppSettings not implemented");
}

async function loadAppSettings(): Promise<TaskProc.AppSettings> {
	// Implement saving logic externally
	// throw new Error("saveAppSettings not implemented");
	return { baseDownloadDir: 'Download' };
}

/**
 * Returns the default downloads directory for the current user.
 */
function getDefaultDownloadDir(): string {
	return path.join(os.homedir(), "Downloads");
}

export const AppSettingsChangeTask: TaskProc.Handler = async ({ payload, signal, emit }) => {
	try {
		const changeField = (payload as TaskProc.AppSettingsChangeDirReqPayload)?.changeField || null;

		if (!changeField) {
			throw new Error(`Unsupported changeField: ${changeField}`);
		}

		const currentSettings = await loadAppSettings();

		let selected = await showSelectFolderDialog(currentSettings[changeField]);

		// if (!selected) {
		// 	selected = getDefaultDownloadDir();
		// }

		const newSettings: TaskProc.AppSettings = {
			...currentSettings,
			[changeField]: selected ? selected : getDefaultDownloadDir(),
		};

		console.log('[AppSettingsChangeTask]', { newSettings })

		await saveAppSettings(newSettings);

		emit({
			type: "result",
			payload: newSettings,
		});
	} catch (error: any) {
		emit({
			type: "error",
			message: error.message || String(error),
			payload: null,
		});
	}
};
