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

	// Use 'df' command to get free space on Unix-like systems
	// This is a simple implementation, for cross-platform use consider external libs
	const diskInfo = execSync(`df -k "${targetPath}"`).toString();
	const lines = diskInfo.trim().split('\n');
	if (lines.length < 2) {
		throw new Error('Failed to get disk space information');
	}
	const parts = lines[1].split(/\s+/);
	const freeKbytes = parseInt(parts[3], 10);
	const freeBytes = freeKbytes * 1024;

	if (freeBytes < requiredBytes) {
		throw new Error(`Not enough disk space. Required: ${(requiredBytes / 1e9).toFixed(2)} GB, Available: ${(freeBytes / 1e9).toFixed(2)} GB`);
	}

	if (freeBytes > ABSOLUTE_LIMIT_BYTES) {
		// Cap freeBytes at absolute limit if more
		if (requiredBytes > ABSOLUTE_LIMIT_BYTES) {
			throw new Error(`Required disk space exceeds absolute limit of 30GB`);
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
	const pendingDir = path.join(baseDownloadDir, 'pending');
	await fs.mkdir(pendingDir, { recursive: true });

	// Calculate required disk space and check free space
	const requiredSpace = calculateRequiredSpace(file);
	await checkFreeSpace(baseDownloadDir, requiredSpace);

	return pendingDir;
}

/**
 * Generate chapter track metadata file if chapters exist in source metadata.
 * Emits progress before generation.
 * Returns the path to the generated chapter metadata file or null if no chapters.
 * 
 * @param file MediaFile.Data object
 * @param baseDir string - directory where to save chapter track stub file
 * @param emit Emit function to send progress events
 * @returns Promise<string|null> - path to chapter metadata file or null if none
 */
async function generateChapterTrack(file: any, baseDir: string, emit: Function): Promise<string | null> {
	if (
		file.source.eData &&
		'chapters' in file.source.eData &&
		Array.isArray(file.source.eData.chapters) &&
		file.source.eData.chapters.length > 0
	) {
		emit({
			type: 'progress',
			message: `Generating chapter track for file '${file.source.title}'`,
			payload: { fileId: file.id, stage: 4 },
		});

		const chapters = file.source.eData.chapters;

		// ffmetadata format for chapters: https://trac.ffmpeg.org/wiki/ChapterMetadata
		let metadataContent = ';FFMETADATA1\n';

		chapters.forEach((chapter: any, index: number) => {
			const start = Math.floor((chapter.start_time || 0) * 1000);
			const end = Math.floor((chapter.end_time || 0) * 1000);
			const title = chapter.title ? chapter.title.replace(/\n/g, ' ') : `Chapter ${index + 1}`;

			metadataContent += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${start}\nEND=${end}\ntitle=${title}\n\n`;
		});

		const fileName = `${file.source.id}-chapters.ffmetadata`;
		const filePath = path.join(baseDir, fileName);

		await fs.writeFile(filePath, metadataContent, 'utf-8');

		emit({
			type: 'progress',
			message: `Chapter track generated: ${fileName}`,
			payload: { fileId: file.id, stage: 4 },
		});

		return filePath;
	}

	// No chapters, return null
	return null;
}

/**
 * Downloads a single media track using yt-dlp.
 * 
 * Checks if track is already downloaded (final file exists).
 * Downloads to temporary file '[*]' then renames to '[+]'.
 * Emits progress events before, during, and after download.
 * Supports cancellation via AbortSignal.
 * 
 * @param fileId - Media file identifier (for progress events)
 * @param file - Media file object containing webpageUrl
 * @param track - Track info object containing formatId, ext
 * @param pendingDir - Directory path where tracks are saved during download
 * @param emit - Function to emit progress events
 * @param signal - AbortSignal to support cancellation
 * 
 * @throws Throws if the process is aborted or download fails
 */
export async function downloadTrack(
	fileId: string,
	file: MediaFile.Data,
	track: MediaFile.Track,
	pendingDir: string,
	emit: (event: any) => void,
	signal: AbortSignal,
): Promise<void> {
	const finalPath = getFilePathWithMarker(file, track, pendingDir, '+');
	const tempPath = getFilePathWithMarker(file, track, pendingDir, '*');

	// Check if already downloaded
	try {
		await fs.access(finalPath);
		emit({
			type: 'progress',
			message: `Track ${track.formatId} already downloaded: ${path.basename(finalPath)}`,
			payload: { fileId, stage: 2 },
		});
		return; // skip download
	} catch {
		// Not downloaded yet, continue
	}

	emit({
		type: 'progress',
		message: `Downloading track ${track.formatId}`,
		payload: { fileId, stage: 2 },
	});

	try {
		// yt-dlp args
		const args = [
			file.source.webpageUrl,
			'-f', track.formatId,
			'-o', tempPath,
			'--no-progress',
			'--no-warnings',
			'--no-call-home',
		];

		const result = await spawnWithAbort(A22_YT_DLP_RUN, args, { signal });

		if (result.doneCode !== 'completed') {
			throw new Error(`yt-dlp exited with code: ${result.doneCode}`);
		}

		const fileSize = getFileSizeSync(tempPath);
		if (fileSize <= 0) {
			throw new Error('Downloaded track not found');
		}

		// Rename temp to final
		await fs.rename(tempPath, finalPath);
		const fileSizeFormatted = filesize(fileSize);
		emit({
			type: 'progress',
			message: `Track ${track.formatId} downloaded successfully (${fileSizeFormatted})`,
			payload: { fileId, stage: 3, fileSize: fileSizeFormatted },
		});

	} catch (error: any) {
		// Cleanup temp file if exists
		try { await fs.unlink(tempPath); } catch { }

		if (error.message === 'Aborted before process started' || error.message === 'Download aborted') {
			throw new Error('Download track aborted');
		}

		throw error;
	}
}

/**
 * Merge all downloaded media tracks using ffmpeg and optionally add chapter metadata.
 * Also embeds custom metadata (file ID, media ID, extractor) into the output file.
 *
 * - Collects all tracks with [+] suffix from the pending directory
 * - Constructs ffmpeg command with `-map` for each input
 * - Adds chapters if chapter metadata file is provided
 * - Embeds metadata: file.id, source.id, extractor
 * - Saves merged result to baseDownloadDir/{source.id}-final.mp4
 * - Logs output and validates result
 *
 * @param file Media file descriptor
 * @param pendingDir Directory where downloaded [+] tracks are stored
 * @param chapterFilePath Path to ffmetadata chapters file, or null
 * @param baseDownloadDir Final output directory
 * @param emit Progress emitter function
 * @returns Promise<string> - path to final merged file
 */

export async function mergeTracks(
	file: MediaFile.Data,
	pendingDir: string,
	chapterFilePath: string | null, // chapters file
	baseDownloadDir: string,
	emit: (event: any) => void,
	signal?: AbortSignal,
	outputFormat: 'mp4' | 'mkv' = 'mp4', // REWORK -> to .Data, default mp4
): Promise<string> {
	const { id: fileId, source } = file;
	const inputFiles: string[] = [];

	// emit({
	// 	type: 'progress',
	// 	message: `Collecting downloaded tracks for merging`,
	// 	payload: { fileId, stage: 5 },
	// });

	// Step 1: Use getFilePathWithMarker to find [+] files for each track
	// for (const track of file.trackIds) {
	// 	const finalPath = getFilePathWithMarker(file, track, pendingDir, '+');
	// 	try {
	// 		await fs.access(finalPath);
	// 		inputFiles.push(finalPath);
	// 	} catch {
	// 		throw new Error('Downloaded track not found, file:' + finalPath);
	// 	}
	// }
	file.trackIds
		.forEach(track => {
			const finalPath = getFilePathWithMarker(file, track, pendingDir, '+');
			const fileSize = getFileSizeSync(finalPath);
			if (fileSize <= 0) {
				throw new Error('Downloaded track not found');
			}
			inputFiles.push(finalPath);
			console.log(`[mergeTracks] track ${track.formatId} prepared, size=${filesize(fileSize)}`);
		});

	if (inputFiles.length === 0) {
		throw new Error(`No track are found for merging`);
	}

	// Step 2: Construct ffmpeg command
	const ext = outputFormat === 'mkv' ? '.mkv' : '.mp4';
	const finalFilePath = path.join(baseDownloadDir, file.fileName) + ext;

	console.log('[mergeTracks] target file: ', { finalFilePath });
	const args: string[] = [];

	// Push input files first
	inputFiles.forEach(file => {
		args.push('-i', file);
	});

	// If chapters file exists, push it as last input
	if (chapterFilePath) {
		args.push('-i', chapterFilePath);
	}

	// If chapters present, map metadata from the last input (chapters)
	if (chapterFilePath) {
		// The chapters input index is inputFiles.length (0-based)
		args.push('-map_metadata', `${inputFiles.length}`);
	}

	// Map all first streams of input files (except chapters)
	for (let i = 0; i < inputFiles.length; i++) {
		args.push('-map', `${i}:0`);
	}

	// Metadata tags
	args.push(
		'-metadata', `file_id=${file.id}`,
		'-metadata', `media_id=${source.id}`,
		'-metadata', `extractor=${source.extractor}`,
	);

	args.push('-c', 'copy', '-y', finalFilePath);

	emit({
		type: 'progress',
		message: `Running ffmpeg to merge tracks`,
		payload: { fileId, stage: 5 },
	});

	console.log('[mergeTracks] ffmpeg args:', args);

	// Step 3: Run ffmpeg using spawnWithAbort, pass signal if provided
	// const result = await spawnWithAbort(path.join(A22_RUNTIME_DIR, 'ffmpeg'), args, { signal });

	// // Логируем вывод ffmpeg
	// console.log('[mergeTracks] ffmpeg stdout:', result.stdout ?? '');
	// console.log('[mergeTracks] ffmpeg stderr:', result.stderr ?? '');

	// if (result.doneCode !== 'completed') {
	// 	throw new Error(`ffmpeg failed with exit code ${result.doneCode}`);
	// }
	const ffmpegResult = await execFileWithAbort({
		file: path.join(A22_RUNTIME_DIR, 'ffmpeg'),
		args,
		signal,
	});

	console.log('[mergeTracks] ffmpeg [OUT]', { ffmpegResult });

	if (ffmpegResult.code !== 0) {
		throw new Error(`ffmpeg failed with exit code ${ffmpegResult.code}`);
	}

	// Step 4: Validate final file
	const finFileSize = getFileSizeSync(finalFilePath);
	// const stats = await fs.stat(finalFilePath);
	// if (!stats.isFile() || stats.size === 0) {
	// 	throw new Error(`Final file not created or empty: ${finalFilePath}`);
	// }
	if (finFileSize <= 0) {
		throw new Error(`Final file not created or empty: ${finalFilePath}`);
	}

	console.log(`[mergeTracks] file dowloaded, size=${filesize(finFileSize)}`);

	// Step 5: Request ffprobe info on final file and log output
	try {
		const ffprobeArgs = [
			'-v', 'quiet',
			'-print_format', 'json',
			'-show_format',
			'-show_streams',
			finalFilePath,
		];

		const ffprobeResult = await execFileWithAbort({
			file: path.join(A22_RUNTIME_DIR, 'ffprobe'),
			args: ffprobeArgs,
			signal,
		});
		console.log('[mergeTracks] ffprobe output:', ffprobeResult.stdout);
	} catch (err) {
		console.warn('[mergeTracks] ffprobe failed:', err);
	}

	// // Emit final success result
	// emit({
	// 	type: 'result',
	// 	message: `File '${file.source.title}' downloaded and merged successfully`,
	// 	payload: {
	// 		fileId: file.id,
	// 		stage: 6,
	// 		fileSize: filesize(stats.size),
	// 		filePath: finalFilePath,
	// 	},
	// });

	return finalFilePath;
}


/**
 * Returns full file path with a marker ('+' or '*') in the filename,
 * based on the provided file and track info.
 * 
 * @param file - MediaFile.Data object, expects file.source.id
 * @param track - MediaFile.Track object, expects formatId and optional ext
 * @param pendingDir - Directory path where files are stored
 * @param marker - Marker character ('+' for completed, '*' for temporary)
 * @returns Full path string with filename containing the marker
 */
export function getFilePathWithMarker(
	file: MediaFile.Data,
	track: MediaFile.Track,
	pendingDir: string,
	marker: '+' | '*',
): string {
	const baseName = `${file.source.id}-${track.formatId}`;
	const fileName = `${baseName}-[${marker}]${track.ext ? '.' + track.ext : ''}`;
	return path.join(pendingDir, fileName);
}
