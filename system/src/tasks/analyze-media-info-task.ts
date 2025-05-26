// src/main/tasks/analyze-media-info-task.ts

/**
 * Task: Analyze media URL using yt-dlp
 *
 * This task is designed to run within the Electron TaskProcessor system.
 * It:
 * - Detects whether the provided URL is a video, playlist, or other media type
 * - Uses `--flat-playlist` for fast detection without downloading video metadata
 * - If it's a single video, fetches full metadata
 * - Emits progress updates and final result through the emit function
 * - Supports cancellation via AbortSignal
 *
 * Usage: taskProcessor.register('analyze-media', analyzeMediaInfoTask)
 */

import { MediaFile, TaskProc } from 'a22-shared';
import { RIPIT_YT_DLP_RUN } from '../init/init.js';
import { execFileWithAbort } from '../lib/task-processor/run-with-abort.js';
import { SourceFileSchema } from '../utils/validation/media-schemas.zod.js';
import { YDBMappers } from '../lib/yt-dlp/mappers.js';

/**
 * Expected payload shape for this task
 */
type AnalyzeMediaPayload = {
	url: string;
}

/**
 * Extracts lightweight information about a media URL (playlist or single video)
 * using yt-dlp with `--flat-playlist` and `--dump-single-json` for fast detection.
 *
 * @param url - The media URL to check.
 * @returns A `MediaFile.UrlInfo` object with type, count, and optional metadata.
 */
export async function getPlaylistInfo(url: string, signal: AbortSignal): Promise<MediaFile.UrlInfo> {
	// try {
	const playlistResult = await execFileWithAbort({
		file: RIPIT_YT_DLP_RUN,
		args: ['--dump-single-json', '--flat-playlist', '--skip-download', url],
		signal,
	});

	// console.log('[getPlaylistInfo]', { playlistResult });
	if (playlistResult.aborted) {
		return null;
	}
	if (playlistResult?.code !== 0) {
		throw new Error(playlistResult?.stderr);
	}
	// console.log('[getPlaylistInfo][2]', { playlistResult });
	const data = JSON.parse(playlistResult?.stdout);
	const info: MediaFile.UrlInfo = YDBMappers.mapToUrlInfo(data);

	return info;
	// } catch (e) {
	// 	console.log('[getPlaylistInfo][ERROR]', e);
	// }
}
/**
 * TaskHandler implementation to analyze media info via yt-dlp.
 * Emits progress and result events back to the renderer process.
 */


type _AnalyzeMediaHandler = (params: {
	payload: AnalyzeMediaPayload;
	signal: AbortSignal;
	emit: TaskProc.EmitFn
}
) => Promise<void>;

// type AnalyzeMediaHandler = (params: TaskProc.Params & { payload: AnalyzeMediaPayload }) => Promise<void>;

type AnalyzeMediaHandler = (params: TaskProc.Params<AnalyzeMediaPayload>) => Promise<void>;


export const analyzeMediaInfoTask: AnalyzeMediaHandler = async ({ payload, signal, emit }) => {
	const { url } = payload; //as AnalyzeMediaPayload;

	// console.log('[TSK][analyzeMediaInfo][start]', { url })

	try {
		// Emit initial progress
		emit({
			type: 'progress',
			message: 'Step 1/2. Detecting media type',
			payload: 'Step 1/2. Detecting media type'
		});

		// console.log('[TSK][analyzeMediaInfo][step 1]')

		// Step 1: Quickly determine if it's a playlist or a video
		// const playlistResult = await execFileWithAbort({
		// 	file: RIPIT_YT_DLP_RUN,
		// 	args: ['--dump-single-json', '--flat-playlist', url],
		// 	signal,
		// });

		// const playlistInfo = await getPlaylistInfo(url, signal);
		// if (signal.aborted) {
		// 	emit({ type: 'cancelled', payload: null });
		// 	return;
		// }

		// console.log('[TSK][analyzeMediaInfo][step 1][res]', { playlistInfo })

		// Emit parsed detection info
		// emit({ type: 'progress', payload: playlistInfo });

		// If the URL is not a single video (e.g. a playlist), emit and stop

		// if (playlistInfo.type !== 'video') {
		// 	// emit({ type: 'result', payload: playlistInfo });
		// 	emit({
		// 		type: 'error', payload: {
		// 			type: 'error',
		// 			count: 0,
		// 			error: 'Video expected',
		// 		}
		// 	});
		// 	return;
		// }

		// Emit progress for metadata fetching step
		// emit({ type: 'progress', payload: `Step 2/2. Fetching full metadata for: ${playlistInfo.title ? playlistInfo.title : 'no title'}` });

		// Step 2: Get detailed metadata for a single video
		const detailResult = await execFileWithAbort({
			file: RIPIT_YT_DLP_RUN,
			args: ['--dump-single-json', '--flat-playlist', '--skip-download', url],
			signal,
		});

		if (signal.aborted) {
			emit({ type: 'cancelled', payload: null });
			return;
		}

		const rowSource = JSON.parse(detailResult.stdout);
		console.log('[TSK][analyzeMediaInfo][loaded][raw]', { rowSource })

		// REVIEW audio?
		if (rowSource?._type !== 'video') {
			emit({
				type: 'error',
				message: `Video expected, but ${rowSource?._type || 'no media file'} is detected`,
				payload: null,
				// {
				// 	type: 'error',
				// 	count: 0,
				// 	error: `Video expected, but ${rowSource?._type || 'no media file'} is detected`,
				// }
			});
			return;
		}

		// Map the response to internal SourceFile type
		const sourceFile: MediaFile.SourceFile = YDBMappers.mapToSourceFile(rowSource);
		console.log("[TSK][analyzeMediaInfo] Source parsed",);

		// Validate the final SourceFile using Zod schema
		const validation = SourceFileSchema.safeParse(sourceFile);

		if (!validation.success) {
			const errors = validation.error.issues
				.map((i) => `${i.path.join('.')}: ${i.message}`)
				.join('; ');
			throw new Error(`Validation failed: ${errors}`);
		}

		// Emit the validated result
		emit({
			type: 'result',
			message: 'Media file information successfully loaded',
			payload: validation.data
		});

	} catch (err: any) {

		console.log('[TSK][analyzeMediaInfo][ERROR]', { err, aborted: signal.aborted })

		if (signal.aborted) {
			emit({ 
				type: 'cancelled', 
				message: 'cancelled',
				payload: null 
			});
			return;
		}

		// Emit structured error in case of failure
		emit({
			type: 'error',
			message: 'Load media file info error:' + err.message,
			payload: null,
		});
	}
};
