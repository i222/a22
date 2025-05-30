// system/src/tasks/download-media-file-task/merge-tracks.ts
import { MediaFile, TaskProc } from "a22-shared";
import { getFilePathWithMarker } from "./utils.js";
import path from 'path';
import { getFileSizeSync } from "../../utils/file-checks.js";
import { filesize } from "filesize";
import { A22_RUNTIME_DIR } from "../../init/init.js";
import { execFileWithAbort } from "../../lib/task-processor/run-with-abort.js";
import { CLOutParsers } from "./parse-out.js";
import { spawnWithAbort } from "../../lib/task-processor/spawn-with-abort.js";

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

	// progress
	args.push('-progress', 'pipe:1');

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

	const streamState: CLOutParsers.StreamState<CLOutParsers.MergeProgress> = {
		buffer: '',
		logs: [],
	};
	const parseMergeProgress = CLOutParsers.createMergeProgressParser();

	const ffmpegResult = await spawnWithAbort(
		path.join(A22_RUNTIME_DIR, 'ffmpeg'),
		args,
		{
			signal,
			onStdoutData: (chunk) => {
				CLOutParsers.handleCombinedStreamData(
					chunk,
					fileId,
					emit,
					streamState,
					'Merging tracks',
					parseMergeProgress
				);
			},
			onStderrData: (chunk) => {
				CLOutParsers.handleCombinedStreamData(
					chunk,
					fileId,
					emit,
					streamState,
					'Merging tracks',
					parseMergeProgress
				);
			},
		}
	);

	console.log('[mergeTracks] ffmpeg [done]', { logs: streamState.logs });

	const logs = streamState.logs;
	console.log('[Download track][done]', { logs })

	if (ffmpegResult.doneCode !== 'completed') {
		throw new Error(`ffmpeg failed with exit code: ${ffmpegResult.doneCode}`);
	}

	// Step 4: Validate final file
	const finFileSize = getFileSizeSync(finalFilePath);
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
		try {
			const parsed = JSON.parse(ffprobeResult.stdout);
			console.log('[mergeTracks] ffprobe output:', parsed);
		} catch (e) {
			console.log('[mergeTracks] ffprobe failed', e);
		}
	} catch (err) {
		console.warn('[mergeTracks] ffprobe failed:', err);
	}

	return finalFilePath;
}