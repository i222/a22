import { spawn, SpawnOptions, ChildProcessWithoutNullStreams } from 'child_process';

const gracefulKillSignal: NodeJS.Signals = 'SIGTERM';

export interface SpawnWithAbortOptions extends SpawnOptions {
	signal?: AbortSignal;
	forceKillDelayMs?: number; // Time to wait before forcibly killing process
	/**
	 * Callback for streaming stdout data chunks as they arrive.
	 */
	onStdoutData?: (chunk: Buffer | string) => void;
	/**
	 * Callback for streaming stderr data chunks as they arrive.
	 */
	onStderrData?: (chunk: Buffer | string) => void;
}

export interface SpawnResult {
	/**
	 * - 'completed' — exited normally with code 0
	 * - 'failed' — exited with error (non-zero code)
	 * - 'aborted' — aborted by AbortSignal
	 * - 'terminated' — forcibly killed (SIGKILL after timeout)
	 */
	doneCode: 'completed' | 'failed' | 'aborted' | 'terminated';
}

/**
 * Spawns a child process with AbortSignal support and streaming output callbacks.
 * 
 * Differences from execWithAbort/execFileWithAbort:
 * - Uses spawn to provide streaming stdout and stderr data.
 * - Does not buffer output internally; forwards data via callbacks.
 * - Suitable for long-running processes or when real-time output parsing is needed.
 * - Supports graceful abort with SIGTERM and fallback SIGKILL after timeout.
 * 
 * Use this when you need to process output line-by-line or chunk-by-chunk in real time,
 * for example to track progress of external utilities like yt-dlp.
 * 
 * @param command - executable command
 * @param args - command arguments
 * @param options - spawn options + abort signal + output callbacks
 * @returns Promise resolving with final process status (doneCode)
 */
export function spawnWithAbort(
	command: string,
	args: ReadonlyArray<string>,
	options: SpawnWithAbortOptions = {}
): Promise<SpawnResult> {
	const {
		signal,
		forceKillDelayMs = 5000,
		onStdoutData,
		onStderrData,
		...spawnOpts
	} = options;

	if (signal?.aborted) {
		return Promise.resolve({ doneCode: 'aborted' });
	}

	const child = spawn(command, args, {
		stdio: 'pipe',
		shell: false,
		...spawnOpts,
	}) as ChildProcessWithoutNullStreams;

	let killed = false;
	let forceKilled = false;
	let forceKillTimeout: NodeJS.Timeout | undefined;

	// Subscribe to stdout and stderr data events
	if (onStdoutData && child.stdout) {
		child.stdout.on('data', onStdoutData);
	}
	if (onStderrData && child.stderr) {
		child.stderr.on('data', onStderrData);
	}

	// Setup abort logic
	if (signal) {
		const onAbort = () => {
			if (child.killed || killed) return;
			killed = true;

			child.kill(gracefulKillSignal);

			forceKillTimeout = setTimeout(() => {
				if (!child.killed) {
					forceKilled = true;
					child.kill('SIGKILL');
				}
			}, forceKillDelayMs);
		};

		if (signal.aborted) {
			onAbort();
		} else {
			signal.addEventListener('abort', onAbort);
			child.once('exit', () => {
				signal.removeEventListener('abort', onAbort);
				if (forceKillTimeout) clearTimeout(forceKillTimeout);
			});
		}
	}

	return new Promise<SpawnResult>((resolve, reject) => {
		child.once('error', reject);
		child.once('exit', (code) => {
			if (signal?.aborted) {
				resolve({ doneCode: forceKilled ? 'terminated' : 'aborted' });
			} else if (code === 0) {
				resolve({ doneCode: 'completed' });
			} else {
				resolve({ doneCode: 'failed' });
			}
		});
	});
}
