import { ElectronBridge, TaskProc, MediaFile } from 'a22-shared';
import { v4 as uuidv4 } from 'uuid';
import { mockedSource } from './mockSource';
import { mockYouTube } from './mockYoutube';
import { mockList } from './mockList';

type TaskHandler = (event: TaskProc.Event) => void;

export class MockTaskProcessor {
	private listeners: TaskHandler[] = [];
	private activeTasks: Map<string, ReturnType<typeof setTimeout>[]> = new Map();

	public runTask = async (task: TaskProc.Input): Promise<string> => {
		const taskId = uuidv4();
		console.log(`[MockTaskProcessor] Starting task: ${taskId}`, task);

		if (task.type === 'TID_GET_MEDIAFILES_REQ') {
			this.emit({
				taskId: 'BROADCAST',
				type: 'MEDIAFILES_LIST',
				payload: mockList,
			} as TaskProc.EventBroadcast);

			return taskId;
		}

		const timeouts: ReturnType<typeof setTimeout>[] = [];

		// Step 1: Progress after 2s
		timeouts.push(setTimeout(() => {
			this.emit({
				taskId,
				type: 'progress',
				payload: 'Step 1/2. Detecting media type',
			});
		}, 2000));

		// Step 2: Progress after 4s
		timeouts.push(setTimeout(() => {
			this.emit({
				taskId,
				type: 'progress',
				payload: `Step 2/2. Fetching full metadata for: ${mockedSource.title || 'no title'}`,
			});
		}, 4000));

		// Step 3: Result after 9s
		timeouts.push(setTimeout(() => {
			this.emit({
				taskId,
				type: 'result',
				payload: mockYouTube //mockedSource,
			});
			this.clearTask(taskId);
		}, 9000));

		this.activeTasks.set(taskId, timeouts);

		return taskId;
	};

	public abortTask = async (taskId: string): Promise<boolean> => {
		console.log(`[MockTaskProcessor] Aborting task: ${taskId}`);
		const timeouts = this.activeTasks.get(taskId);
		if (timeouts) {
			timeouts.forEach(clearTimeout);
			this.emit({ taskId, type: 'cancelled', payload: null });
			this.activeTasks.delete(taskId);
		}
		return true;
	};

	public onEvent = (handler: TaskHandler) => {
		this.listeners.push(handler);
	};

	private emit = (event: TaskProc.Event) => {
		console.log(`[MockTaskProcessor] Emit`, event);
		this.listeners.forEach((listener) => listener(event));
	};

	private clearTask = (taskId: string) => {
		const timers = this.activeTasks.get(taskId);
		if (timers) {
			timers.forEach(clearTimeout);
			this.activeTasks.delete(taskId);
		}
	};
}
