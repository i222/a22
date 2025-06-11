// system/src/tasks/download-media-files-task.ts
import { MediaFile, TaskProc } from "a22-shared";
import fs from 'fs/promises';
import path from 'path';
import { serviceContainer } from "../services/service-container.js";
import os from 'os';
import { execSync } from 'child_process';
import { spawnWithAbort } from "../lib/task-processor/spawn-with-abort.js";
import { filesize } from "filesize";
import { A22_RUNTIME_DIR, A22_YT_DLP_RUN } from "../init/init.js";
import { execFileWithAbort, execWithAbort } from "../lib/task-processor/run-with-abort.js";
import { getFileSizeSync } from "../utils/file-checks.js";
import checkDiskSpace from 'check-disk-space'
import { downloadTrack } from "./download-media-file-task/download-track.js";
import { mergeTracks } from "./download-media-file-task/merge-tracks.js";
import { generateChapterTrack } from "./download-media-file-task/generate-chapters.js";

const A22_PENDING_DIR_NAME = 'pending';

/**
 * [#34]
 * Task handler to download media file tracks sequentially,
 * save them to disk, generate chapter track if needed, 
 * and merge tracks into a final file with ffmpeg (stubs).
 * 
 * - Checks if track file is already downloaded by filename.
 * - Downloads tracks with progress events.
 * - Uses appConfig baseDownloadDir for saving files.
 * - After all tracks downloaded, generates chapter track (stub).
 * - Merges tracks into final file (stub).
 * 
 * @param params.payload - MediaFile.Data object to download
 * @param params.signal - Abort signal for cancellation
 * @param params.emit - Function to emit progress and result events
 */
export const DownloadMediaFilesTask: TaskProc.DownloadMediafileReqHandlerSingle = async ({ payload, signal, emit }) => {
	try {
		const file = payload;
		console.log('[DownloadMediaFilesTask] started', { file });
		if (!file) {
			throw new Error('Expected media file');
		}

		// Get base directory for downloads from app settings service
		const appConfig = await serviceContainer.appSettingsService;
		const baseDownloadDir: string = await appConfig.getParam('baseDownloadDir');
		if (!baseDownloadDir) {
			throw new Error('Base download directory is not configured');
		}

		// Prepare download environment and get pending directory
		const pendingDir = await prepareDownload(baseDownloadDir, file);

		emit({
			type: 'progress',
			message: `Starting download tracks for file '${file.source.title}'`,
			payload: { fileId: file.id, stage: 1 },
		});

		// Download tracks one by one
		for (let i = 0; i < file.trackIds.length; i++) {
			const track = file.trackIds[i];
			await downloadTrack(file.id, file, track, pendingDir, emit, signal);
		}

		// Generate chapter track if needed
		const chapterFilePath = await generateChapterTrack(file, pendingDir, emit);

		console.log('[DownloadMediaFilesTask] chapterFilePath=' + chapterFilePath);

		// Now chapterFilePath is either the path to chapter metadata file or null if no chapters
		// You can store/use chapterFilePath later for merging with ffmpeg


		const finalPath = await mergeTracks(file, pendingDir, chapterFilePath, baseDownloadDir, emit, signal, 'mkv');

		// Emit final success result
		emit({
			type: 'result',
			message: `File '${file.source.title}' downloaded and merged successfully`,
			payload: {
				fileId: file.id,
				stage: 6,
				fileSize: filesize((await fs.stat(finalPath)).size),
				filePath: finalPath,
			},
		});

	} catch (error) {
		emit({
			type: 'error',
			message: 'Download error. ' + error.message,
			payload: { error }
		});
	}
};

/**
 * Calculate the approximate required disk space for downloading all tracks,
 * using a factor of 3x for safety buffer.
 * 
 * @param file MediaFile.Data object with track info
 * @returns number of bytes required approximately
 */
function calculateRequiredSpace(file: any): number {
	// Sum of sizes or estimated sizes of all tracks (stub: assume 100MB per track)
	const estimatedPerTrack = 100 * 1024 * 1024; // 100MB
	const totalEstimated = file.trackIds.length * estimatedPerTrack;
	// Use 3x buffer
	return totalEstimated * 3;
}

/**
 * Check if there is enough free disk space on the volume containing targetPath.
 * Throws an error if space is insufficient.
 * 
 * Also enforces an absolute limit of 30 GB for safety.
 * 
 * @param targetPath Path to check disk space on
 * @param requiredBytes Bytes required for download
 */
async function checkFreeSpace(targetPath: string, requiredBytes: number) {
	const ABSOLUTE_LIMIT_BYTES = 30 * 1024 * 1024 * 1024; // 30GB

	const diskSpace = await (checkDiskSpace as any)(targetPath);
	console.log(`[Download] Free/Total space: ${filesize(diskSpace.free)}/${filesize(diskSpace.size)}`);

	if (diskSpace.free < requiredBytes) {
		throw new Error(`Not enough disk space. Required: ${filesize(requiredBytes)}, Available: ${diskSpace.free}`);
	}

	if (diskSpace.free > ABSOLUTE_LIMIT_BYTES) {
		// Cap freeBytes at absolute limit if more
		if (requiredBytes > ABSOLUTE_LIMIT_BYTES) {
			throw new Error(`Required disk space exceeds absolute limit of ${filesize(requiredBytes)}`);
		}
	}

	// If checks passed, enough space is available
}

/**
 * Prepare download environment:
 * - Ensure base and pending directories exist
 * - Check disk space is sufficient (with buffer and absolute limit)
 * 
 * @param baseDownloadDir Base directory path for downloads
 * @param file MediaFile.Data object
 * @throws Error if disk space is insufficient
 * @returns path to 'pending' directory
 */
async function prepareDownload(baseDownloadDir: string, file: any): Promise<string> {
	// Ensure base directory exists
	await fs.mkdir(baseDownloadDir, { recursive: true });

	// Create 'pending' subdirectory for downloads
	const pendingDir = path.join(baseDownloadDir, A22_PENDING_DIR_NAME);
	await fs.mkdir(pendingDir, { recursive: true });

	// Calculate required disk space and check free space
	const requiredSpace = calculateRequiredSpace(file);
	await checkFreeSpace(baseDownloadDir, requiredSpace);

	return pendingDir;
}