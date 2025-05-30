// system/src/tasks/download-media-file-task/download-track.ts
import { MediaFile, TaskProc } from "a22-shared";
import { getFilePathWithMarker } from "./utils.js";
import fs from 'fs/promises';
import path from 'path';
import { getFileSizeSync } from "../../utils/file-checks.js";
import { filesize } from "filesize";
import { spawnWithAbort } from "../../lib/task-processor/spawn-with-abort.js";
import { A22_YT_DLP_RUN } from "../../init/init.js";
import { CLOutParsers } from "./parse-out.js";

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

	try {
		await fs.access(finalPath);
		emit({
			type: 'progress',
			message: `Track ${track.formatId} already downloaded: ${path.basename(finalPath)}`,
			payload: { fileId, stage: 2 },
		});
		return;
	} catch { }

	emit({
		type: 'progress',
		message: `Downloading track ${track.formatId}`,
		payload: { fileId, stage: 2 },
	});

	// State to hold buffer and logs during streaming output processing
	const streamState: CLOutParsers.StreamState<CLOutParsers.ProgressData> = { buffer: '', logs: [] };


	try {
		const result = await spawnWithAbort(A22_YT_DLP_RUN, [
			file.source.webpageUrl,
			'-f', track.formatId,
			'-o', tempPath,
			'--no-warnings',
			'--no-call-home',
			'--newline'
		], {
			signal,
			// Use spawnWithAbort with stdout/stderr callbacks to track progress
			onStdoutData: (chunk) => CLOutParsers.handleCombinedStreamData(chunk, fileId, emit, streamState, 'Downloading track', CLOutParsers.parseProgress),
			onStderrData: (chunk) => CLOutParsers.handleCombinedStreamData(chunk, fileId, emit, streamState, 'Downloading track', CLOutParsers.parseProgress),
		});

		const logs = streamState.logs;
		console.log('[Download track][done]', { logs })

		if (result.doneCode !== 'completed') {
			throw new Error(`yt-dlp exited with code: ${result.doneCode}`);
		}

		const fileSize = getFileSizeSync(tempPath);
		if (fileSize <= 0) {
			throw new Error('Downloaded track not found');
		}

		await fs.rename(tempPath, finalPath);

		const fileSizeFormatted = filesize(fileSize);
		emit({
			type: 'progress',
			message: `Track ${track.formatId} downloaded successfully (${fileSizeFormatted})`,
			payload: { fileId, stage: 3, fileSize: fileSizeFormatted },
		});

	} catch (error: any) {
		try { await fs.unlink(tempPath); } catch { }

		if (error.message === 'Aborted before process started' || error.message === 'Download aborted') {
			throw new Error('Download track aborted');
		}

		throw error;
	}
}