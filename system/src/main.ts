import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
// import contextMenu from "electron-context-menu";
import { fileExists } from "./utils/file-checks.js";
import { appInit } from "./init/init.js";
import { serviceContainer } from "./services/service-container.js";
import { TaskProcessor } from "./lib/task-processor/task-processor.js";
import { analyzeMediaInfoTask } from "./tasks/analyze-media-info-task.js";
import { validateIpcInvokeHandlers } from "./utils/brige-checker.js";
import { TaskProc } from "a22-shared";
import { AddMediaFileTask } from "./tasks/add-media-file-task.js";
import { DeleteMediaFilesTask } from "./tasks/delete-media-file-task.js";
import { GetMediaFilesReqTask } from "./tasks/get-media-filed-req-task.js";
import { DownloadMediaFilesTask } from "./tasks/download-media-files-task.js";
import { SequentialTaskProcessor } from "./lib/task-processor/sequential-task-processor.js";
import { UpdateMediaFileTask } from "./tasks/update-media-file-task.js";
import { AppSettingsGetTask } from "./tasks/app-setting-get-task.js";
import { AppSettingsChangeTask } from "./tasks/app-setting-change-task.js";
import { fileURLToPath } from "url";

const RIPIT_INDEX_FILE = "index.html";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('__dirname:', __dirname);

// Called when the Electron app is ready
app.whenReady().then(async () => {
	try {
		// Create the main application window
		const mainWindow = new BrowserWindow({
			width: 800,
			height: 600,
			minWidth: 642,
			minHeight: 300,
			title: 'A22 Media Files Manager',
			webPreferences: {
				// Enable preload script and isolate renderer from the main process
				preload: path.join(__dirname, "preload/preload.js"),
				contextIsolation: true,
				webSecurity: false,
				nodeIntegration: false,
				devTools: true, // DEV
				// sandbox: false // sandbox
				// enableRemoteModule: false,
			},
		});

		console.log("[Loading] mainWindow created");

		// mainWindow.webContents.openDevTools({ mode: "right" });

		// Initialize a task processor to handle background tasks
		const taskProcessor = new TaskProcessor((event) => {
			// Send task events to the renderer
			mainWindow.webContents.send("CID_ON_TASK_PROCESSOR_EVENT", event);
		});

		const taskProcessorSequential = new SequentialTaskProcessor((event) => {
			// Send task events to the renderer
			mainWindow.webContents.send("CID_ON_TASK_PROCESSOR_EVENT", event);
		});

		linkProcessors(taskProcessor, taskProcessorSequential);

		console.log("[Loading]taskProcessor created and linked");

		// Register core application services and expose mainWindow to them
		serviceContainer.registerCoreServices(() => mainWindow);

		// Trigger lazy initialization of consoleService
		await serviceContainer.consoleService;

		// Validate index.html existence to ensure application integrity
		// const root = __dirname?.slice(0, -5);
		const indexFile = path.join(__dirname, 'ui', RIPIT_INDEX_FILE);
		console.log("[Loading] index file name:", indexFile);
		const fileExist = await fileExists(indexFile);
		if (!fileExist) {
			throw new Error(`Application integrity check failed: index file not found at ${indexFile}`);
		}

		console.log("[Loading] index file:", indexFile);
		mainWindow.loadFile(indexFile);

		// Enable right-click context menu with useful options
		// removed until bagfix form electron
		// contextMenu({
		// 	showSaveImageAs: true,
		// 	showCopyImage: true,
		// 	showInspectElement: true,
		// });

		// Initialize custom services
		console.log("[Loading][ytdlpService] run");
		await (await serviceContainer.ytdlpService).handleAll();

		console.log("[Loading][queueService] run");
		const queueService = await serviceContainer.queueService;
		await queueService.init();
		await queueService.handleAll();

		// Validate that all expected IPC handlers are registered
		validateIpcInvokeHandlers();

		// Final app-level initialization logic
		console.log("[Loading] App init");
		try {
			const initRes = await appInit();
		} catch (err) {
			console.error("App init error:", err);
		}
	} catch (err) {
		// Fallback error handler — shows a dialog if app fails to start
		console.error("App starting error:", err);
		dialog.showErrorBox("Ops, something went wrong", (err as Error).message);
	}
});


function linkProcessors(taskProcessor: TaskProcessor, taskProcessorSequential: SequentialTaskProcessor) {
	// Register supported task types
	try {
		taskProcessor.register('TID_ANALYZE-MEDIA-INFO', analyzeMediaInfoTask);
		taskProcessor.register('TID_ADD_MEDIAFILE', AddMediaFileTask);
		taskProcessor.register('TID_DELETE_MEDIAFILES', DeleteMediaFilesTask);
		taskProcessor.register('TID_UPDATE_MEDIAFILE', UpdateMediaFileTask);
		taskProcessor.register('TID_GET_MEDIAFILES_REQ', GetMediaFilesReqTask);
		taskProcessor.register('TID_APP_SETTINGS_GET_REQ', AppSettingsGetTask);
		taskProcessor.register('TID_APP_SETTINGS_CHANGE_DIR_REQ', AppSettingsChangeTask);


		taskProcessorSequential.registerBatchTask('BTID_DOWNLOAD_MEDIAFILES_REQ', DownloadMediaFilesTask);
	} catch (e) {
		console.warn('[MAIN] Warning: It looks like the processora are being linked a second time. Ignored.');
	}

	// Register IPC handler to run a task
	ipcMain.handle("CID_RUN_TASK", async (event, task: TaskProc.Input) => {
		const { type, payload } = task;
		try {
			console.log('[Handle] Run Task', { task });

			if (TaskProc.isBatchTaskType(type)) {
				const taskIds = taskProcessorSequential.enqueue(task);
				return taskIds;
			}

			if (TaskProc.isSingleTaskTypes(type)) {
				const taskId = taskProcessor.run(task);
				return taskId;
			}

			throw new Error('Unknown task type:' + type)
			// const taskId = taskProcessor.run(task);
			// return taskId;
		} catch (err) {
			console.error(`Failed to start task of type "${type}"`, err);
			throw err; // This error will propagate to the renderer
		}
	});

	// Register IPC handler to abort a task
	ipcMain.handle("CID_ABORT_TASK", async (event, taskId: string) => {
		const success = taskProcessor.abort(taskId);
		return { success };
	});
}