// system/src/tasks/download-media-file-task/parse-out.ts

export namespace CLOutParsers {

	export type ParseLineFn<T> = (line: string) => T | null;

	export type StreamState<T> = {
		buffer: string;
		logs: string[];
	}

	export type ProgressData = {
		percent: number;
		speed: string;
		eta: string;
	};

	// Parse yt-dlp progress line like: [download]  42.3% of 50.00MiB at 1.23MiB/s ETA 00:30
	export function parseProgress(line: string): ProgressData | null {
		const progressRegex = /\[download\]\s+(\d+(?:\.\d+)?)%\s+of\s+.*\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i;
		const match = line.match(progressRegex);
		if (!match) return null;
		return {
			percent: parseFloat(match[1]),
			speed: match[2],
			eta: match[3],
		};
	}

	export function handleCombinedStreamData<T = any>(
		chunk: string | Buffer,
		fileId: string,
		emit: (event: any) => void,
		state: StreamState<T>,
		opName = 'Operation',
		parseLine?: ParseLineFn<T>,
	) {
		try {
			const chunkStr = typeof chunk === 'string' ? chunk : chunk.toString('utf8');
			state.buffer += chunkStr;

			let lines = state.buffer.split(/\r?\n/);
			state.buffer = lines.pop() ?? '';

			for (const line of lines) {
				try {
					if (parseLine) {
						const parsed = parseLine(line);
						if (parsed) {
							console.log(`[${opName}][Parsing][Progress]`, parsed);
							emit({
								type: 'progress',
								message: `${opName} in progress...`,
								payload: { fileId, stage: 2, progress: parsed },
							});
						} else if (line.trim() !== '') {
							console.log(`[${opName}][Parsing][line]`, parsed);
							state.logs.push(line);
							// emit({
							// 	type: 'log',
							// 	message: line,
							// 	payload: { fileId, stage: 2 },
							// });
						}
					} else {
						// No parser provided - just collect logs
						if (line.trim() !== '') {
							state.logs.push(line);
							// emit({
							// 	type: 'log',
							// 	message: line,
							// 	payload: { fileId, stage: 2 },
							// });
						}
					}
				} catch (parseErr) {
					// Parsing failed, push line as raw log and continue
					state.logs.push(line);
					console.warn(`[${opName}][Progress Parsing][Error]`, parseErr);
				}
			}
		} catch (err) {
			console.warn(`[${opName}][Progress Parsing][Error]`, err);
		}
	}

	// Types for ffmpeg merge progress

	export type MergeProgress = {
		frame?: number;
		fps?: number;
		bitrate?: string;
		total_size?: number;
		out_time_ms?: number;
		out_time?: string;
		speed?: string;
		progress?: 'continue' | 'end';
	};

	/**
	 * Parses ffmpeg merge progress output lines from the `-progress pipe:1` stream.
	 * 
	 * ffmpeg outputs progress info as key=value pairs, for example:
	 * ```
	 * frame=123
	 * fps=25.0
	 * bitrate=500kbits/s
	 * total_size=1234567
	 * out_time_ms=12345678
	 * out_time=00:00:12.345678
	 * speed=1.00x
	 * progress=continue
	 * ```
	 * 
	 * This parser collects relevant progress data and returns a structured object,
	 * or null if the line doesn't contain progress info.
	 * 
	 * Usage:
	 * Pass this function as `parseLine` callback to `handleCombinedStreamData`
	 * to parse ffmpeg merge progress lines in real time.
	 * 
	 * Typical keys parsed:
	 * - frame: number of frames processed
	 * - fps: current processing speed in frames per second
	 * - bitrate: current bitrate (string)
	 * - total_size: output file size in bytes (number)
	 * - out_time_ms: output duration processed in milliseconds (number)
	 * - out_time: output duration processed as HH:MM:SS.ms string
	 * - speed: processing speed as multiple of real time (e.g. "1.00x")
	 * - progress: "continue" or "end"
	 * 
	 * @param line - single line of ffmpeg progress output ("key=value")
	 * @returns parsed progress object or null if line is not a key=value pair
	 */
	// export function parseMergeProgress(line: string): MergeProgress | null {
	// 	const keyValueRegex = /^(\w+)=(.+)$/;
	// 	const match = line.match(keyValueRegex);
	// 	if (!match) return null;

	// 	const key = match[1];
	// 	const value = match[2];

	// 	switch (key) {
	// 		case 'frame': {
	// 			const parsed = parseInt(value, 10);
	// 			if (isNaN(parsed)) return null;
	// 			return { frame: parsed };
	// 		}
	// 		case 'fps': {
	// 			const parsed = parseFloat(value);
	// 			if (isNaN(parsed)) return null;
	// 			return { fps: parsed };
	// 		}
	// 		case 'bitrate':
	// 			return { bitrate: value };
	// 		case 'total_size': {
	// 			const parsed = parseInt(value, 10);
	// 			if (isNaN(parsed)) return null;
	// 			return { total_size: parsed };
	// 		}
	// 		case 'out_time_ms': {
	// 			const parsed = parseInt(value, 10);
	// 			if (isNaN(parsed)) return null;
	// 			return { out_time_ms: parsed };
	// 		}
	// 		case 'out_time':
	// 			return { out_time: value };
	// 		case 'speed':
	// 			return { speed: value };
	// 		case 'progress':
	// 			if (value === 'continue' || value === 'end') {
	// 				return { progress: value };
	// 			}
	// 			return null;
	// 		default:
	// 			return null;
	// 	}
	// }

	export function createMergeProgressParser() {
		let currentProgress: CLOutParsers.MergeProgress = {};
	
		return function parseMergeProgress(line: string): CLOutParsers.MergeProgress | null {
			const keyValueRegex = /^(\w+)=(.+)$/;
			const match = line.match(keyValueRegex);
			if (!match) return null;
	
			const key = match[1];
			const value = match[2];
	
			switch (key) {
				case 'frame': {
					const parsed = parseInt(value, 10);
					if (isNaN(parsed)) return null;
					currentProgress.frame = parsed;
					break;
				}
				case 'fps': {
					const parsed = parseFloat(value);
					if (isNaN(parsed)) return null;
					currentProgress.fps = parsed;
					break;
				}
				case 'bitrate':
					currentProgress.bitrate = value;
					break;
				case 'total_size': {
					const parsed = parseInt(value, 10);
					if (isNaN(parsed)) return null;
					currentProgress.total_size = parsed;
					break;
				}
				case 'out_time_ms': {
					const parsed = parseInt(value, 10);
					if (isNaN(parsed)) return null;
					currentProgress.out_time_ms = parsed;
					break;
				}
				case 'out_time':
					currentProgress.out_time = value;
					break;
				case 'speed':
					currentProgress.speed = value;
					break;
				case 'progress':
					if (value === 'continue' || value === 'end') {
						currentProgress.progress = value;
						// Возвращаем полный накопленный прогресс и сбрасываем накопитель
						const result = { ...currentProgress };
						currentProgress = {};
						return result;
					}
					return null;
				default:
					return null;
			}
	
			// Для всех ключей, кроме 'progress', не возвращаем ничего (null), чтобы не эмитить промежуточные обновления
			return null;
		};
	}
	
}