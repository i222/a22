// system/src/tasks/download-media-file-task/parse-out.ts

import { get } from "lodash-es";

export namespace CLOutParsers {
	// export type ParseLineFn<T> = (line: string) => T | null;
	export type ParseLineFn<T> = (line: string, store?: any) => T | { skip: true };
	export type FormatProgressFn<T> = (data: T) => string | null;


	export type StreamState<T> = {
		buffer: string;
		logs: string[];
	};

	export type ProgressData = {
		percent: number;
		speed: string;
		eta: string;
	};

	// Parse yt-dlp progress line like: [download]  42.3% of 50.00MiB at 1.23MiB/s ETA 00:30
	export function parseProgress(line: string, store): ProgressData | null {
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
		opName = "Operation",
		parseLine?: ParseLineFn<T>,
		formatProgress?: FormatProgressFn<T>
	) {
		try {
			const chunkStr = typeof chunk === "string" ? chunk : chunk.toString("utf8");
			state.buffer += chunkStr;

			let lines = state.buffer.split(/\r?\n/);
			state.buffer = lines.pop() ?? "";

			const store = {};

			for (const line of lines) {
				try {
					if (parseLine) {
						const parsed = parseLine(line, store);
						if (get(parsed, 'skip', false)) {
							continue;
						}
						if (parsed) {
							const message = formatProgress
								? formatProgress(parsed as T)
								: `${opName} is starting.. Please wait`
								;
							console.log(`[${opName}][Parsing][progress]`, parsed, message);
							emit({
								type: "progress",
								message,
								payload: { fileId, stage: 2, progress: parsed },
							});
						} else if (line.trim() !== "") {
							console.log(`[${opName}][Parsing][line]`, line);
							state.logs.push(line);
						}
					} else {
						// No parser provided - just collect logs
						if (line.trim() !== "") {
							console.log(`[${opName}][line]`, line);
							state.logs.push(line);
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

	
	export type ProgressDataFFmpeg = {
		frame?: number;
		fps?: number;
		bitrate?: string;
		total_size?: number;
		out_time_ms?: number;
		out_time?: string;
		speed?: string;
		progress?: string;
	};

	
	export const parseFfmpegProgressLine: ParseLineFn<ProgressDataFFmpeg> = (line, store = {}) => {
		// Регулярка для поиска key=value пар (ключ — непробельные символы, значение — до пробела или конца)
		console.log('[!]', line, store);

		const regex = /(\S+?)=([\S]+)/g;

		let foundAny = false;
		let match;

		while ((match = regex.exec(line)) !== null) {
			foundAny = true;
			const key = match[1];
			let valueRaw = match[2];

			let value: any = valueRaw;
			if (['frame', 'fps', 'total_size', 'out_time_ms'].includes(key)) {
				const num = Number(valueRaw);
				if (!isNaN(num)) value = num;
			}

			store[key] = value;
		}

		if (!foundAny) {
			// В строке не нашли параметров - это не прогресс, игнорируем
			return null;
		}

		if ('progress' in store) {
			const result = { ...store };
			// Progress parsing loop done
			for (const k in store) delete store[k];
			return result;
		}

		// keep collecting progress
		return { skip: true };
	};

}
