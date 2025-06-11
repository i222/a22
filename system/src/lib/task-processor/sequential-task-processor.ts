import { v4 as uuidv4 } from 'uuid';
import { TaskProc } from 'a22-shared';

/**
 * SequentialTaskProcessor class executes tasks sequentially (one after another).
 * This processor manages a queue of tasks, ensuring no task is missed,
 * even if some tasks take a long time to complete.
 */
type TaskWithId = TaskProc.Input & { taskId: string };

export class SequentialTaskProcessor {
	private handlers = new Map<string, TaskProc.Handler>();           // Handlers for individual tasks
	private batchHandlers = new Map<string, TaskProc.Handler>();     // Handlers for batch tasks
	private activeControllers = new Map<string, AbortController>();  // Active task controllers (for cancellation)
	private emitRaw: (event: TaskProc.Event) => void;                // Function to emit task events
	private taskQueue: Array<TaskWithId> = [];                       // Queue of tasks to be processed
	private isProcessing = false;                                    // Flag indicating whether a task is being processed
	private monitoringInterval: NodeJS.Timeout | null = null;

	/**
	 * Constructor to initialize the task processor.
	 * @param emitFn - The function to emit events during task execution.
	 */
	constructor(emitFn: (event: TaskProc.Event) => void) {
		this.emitRaw = emitFn;
	}

	/**
	 * Registers a handler for an individual task type.
	 * @param type - The task type to register.
	 * @param handler - The handler function to process this task.
	 */
	registerTask(type: string, handler: TaskProc.Handler) {
		if (this.handlers.has(type)) {
			throw new Error(`Handler for type "${type}" already registered`);
		}
		this.handlers.set(type, handler);
	}

	/**
	 * Registers a handler for a batch task type.
	 * @param type - The batch task type to register.
	 * @param handler - The handler function to process the batch task.
	 */
	registerBatchTask(type: string, handler: TaskProc.Handler) {
		if (this.batchHandlers.has(type)) {
			throw new Error(`Handler for type "${type}" already registered`);
		}
		this.batchHandlers.set(type, handler);
	}

	/**
	 * Adds a task to the queue. Determines whether it's a batch or individual task 
	 * and calls the appropriate enqueue method.
	 * @param task - The task to add to the queue.
	 * @returns taskId(s) - The unique identifier(s) for the added task(s).
	 */
	enqueue(task: TaskProc.Input): string[] {

		// If the task type is TID_BATCH_TASKS_STATE_PUSH_ON, start monitoring
		if (task.type === 'BTID_BATCH_TASKS_STATE_PUSH_ON') {
			this.startMonitoring(task);  // Start monitoring
			return [];  // No need to add to the queue
		}

		// If the task type is TID_BATCH_TASKS_STATE_PUSH_OFF, stop monitoring
		if (task.type === 'BTID_BATCH_TASKS_STATE_PUSH_OFF') {
			this.stopMonitoring();  // Stop monitoring
			return [];  // No need to add to the queue
		}

		const handler = this.batchHandlers.get(task?.type) || this.handlers.get(task?.type);

		if (!handler) {
			throw new Error(`No handler registered for type "${task?.type}"`);
		}

		// If the task is a batch task, call the batch enqueue method
		if (this.batchHandlers.has(task?.type)) {
			return this.enqueueBatch(task);
		} else {
			// If the task is an individual task, call the individual enqueue method
			return [this.enqueueTask(task)];
		}
	}

	/**
	 * Adds an individual task to the queue.
	 * @param task - The task to add to the queue.
	 * @returns taskId - The unique identifier for the added task.
	 */
	private enqueueTask(task: TaskProc.Input): string {
		const handler = this.handlers.get(task?.type);

		if (!handler) {
			throw new Error(`No handler registered for type "${task?.type}"`);
		}

		const taskId = uuidv4();
		const taskWithId: TaskWithId = { ...task, taskId };

		this.taskQueue.push(taskWithId);

		// Start processing the queue if no task is being processed
		if (!this.isProcessing) {
			this.processNext();
		}

		this.emitQueueState();  // Send the current state once

		return taskId;
	}

	/**
	 * Adds a batch task to the queue.
	 * Each entity in the payload will be treated as a separate task.
	 * @param task - The batch task containing a list of entities in the payload.
	 * @returns taskIds - Array of unique identifiers for the added batch tasks.
	 */
	private enqueueBatch(task: TaskProc.Input): string[] {
		const handler = this.batchHandlers.get(task?.type);

		if (!handler) {
			throw new Error(`No handler registered for type "${task?.type}"`);
		}

		const taskIds: string[] = [];
		const entities = task.payload; // Expecting payload to be an array of entities

		if (!Array.isArray(entities)) {
			throw new Error(`Expected payload to be an array of entities.`);
		}

		// For each entity in the array, create a separate task with a unique taskId
		entities.forEach((entity, index) => {
			const taskId = uuidv4();
			const taskWithId: TaskWithId = { ...task, taskId, payload: entity }; // Use the entity as the payload
			taskIds.push(taskId);

			this.taskQueue.push(taskWithId);
		});

		// Start processing the queue if no task is being processed
		if (!this.isProcessing) {
			this.processNext();
		}

		this.emitQueueState();  // Send the current state once
		return taskIds;
	}

	private currentTask: TaskWithId = null;

	/**
	 * Processes the next task in the queue.
	 * If a task is already being processed, it waits for completion before starting the next one.
	 */
	private async processNext() {
		this.currentTask = null;
		if (this.isProcessing || this.taskQueue.length === 0) {
			this.emitQueueState();  // Emit the current state of the queue when starting the task processing
			return;
		}

		this.currentTask = this.taskQueue.shift()!;
		this.emitQueueState();  // Emit the current state of the queue when starting the task processing
		const { type, payload, taskId } = this.currentTask;
		const handler = this.handlers.get(type) || this.batchHandlers.get(type);

		if (!handler) {
			throw new Error(`No handler registered for type "${type}"`);
		}

		const controller = new AbortController();
		this.activeControllers.set(taskId, controller);

		// Emit function to send events (progress, result, error, etc.)
		const emit: TaskProc.EmitFn = (event) => {
			this.emitRaw({ ...event, taskId });
		};

		this.isProcessing = true;

		try {
			await handler({ payload, signal: controller.signal, emit });
		} catch (err) {
			const isAborted = controller.signal.aborted;
			// Emit error or cancellation event based on the error state
			emit({ type: isAborted ? 'cancelled' : 'error', payload: isAborted ? null : (err.message || String(err)) });
		} finally {
			this.activeControllers.delete(taskId);
			this.isProcessing = false;
			this.processNext();  // Process the next task in the queue
		}
	}

	/**
	 * Stops the execution of a task with a given taskId.
	 * If the task is in the queue, it will be removed. 
	 * If the task is being processed, it will be aborted.
	 * @param taskId - The taskId of the task to stop.
	 */
	abort(taskId: string) {
		const ctrl = this.activeControllers.get(taskId);
		if (ctrl) {
			ctrl.abort();
			this.activeControllers.delete(taskId);
		} else {
			// Remove the task from the queue if it's not currently processing
			this.taskQueue = this.taskQueue.filter(task => task.taskId !== taskId);
		}
		this.emitQueueState();  // Emit the current state of the queue when taskQueue updated
	}

	/**
	 * Starts monitoring the queue state by emitting updates every 2 seconds.
	 * If monitoring is already running, it does nothing.
	 */
	private startMonitoring(task: TaskProc.Input) {
		const { pushInterval } = task.payload;  // Get the pushInterval from the task payload
		if (pushInterval === 0) {
			this.emitQueueState();  // Send the current state once
			return;  // No need to start a periodic timer
		}

		// If there's already a monitoring interval, we don't start a new one
		// if (this.monitoringInterval) return;

		this.stopMonitoring();

		// Set an interval that sends the queue state every 2 seconds or pushInterval ms
		this.monitoringInterval = setInterval(() => {
			this.emitQueueState();  // Send the current queue state every pushInterval milliseconds
		}, pushInterval > 100 ? pushInterval : 2000);
	}
	/**
	 * Stops the monitoring of the queue state.
	 * If no monitoring is running, it does nothing.
	 */
	private stopMonitoring() {
		// If there's no active monitoring interval, do nothing
		if (!this.monitoringInterval) return;

		// Clear the interval and stop emitting updates
		clearInterval(this.monitoringInterval);
		this.monitoringInterval = null;  // Reset the interval reference
	}

	/**
 * Emits the current state of the task queue through the emit function.
 * This is called every 2 seconds while monitoring is active.
 */
	private emitQueueState() {
		// Collect the current state of the queue
		const tasks = [];

		if (this.currentTask) {
			const current = structuredClone(this.currentTask);
			current['status'] = 'in progress';
			tasks.push(current)
		}
		this.taskQueue
			.forEach(task => {
				const t = structuredClone(task);
				t['status'] = 'pending';
				tasks.push(structuredClone(t))
			});

		const queueState = {
			tasks
		};

		// Emit the queue state to listeners (broadcast)
		this.emitRaw({
			type: 'SEQ-PROCESSOR-TASKS-LIST',
			taskId: 'BROADCAST',  // Special taskId for broadcast messages
			payload: queueState,
		});
	}

}
