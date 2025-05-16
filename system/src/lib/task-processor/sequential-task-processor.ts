import { v4 as uuidv4 } from 'uuid';
import { TaskProc } from 'a22-shared';

/**
 * SequentialTaskProcessor class, which executes tasks sequentially (one after another).
 * This processor will manage a queue of tasks and ensure no task is missed,
 * even if some tasks take a long time to complete.
 */

// New type for a task with taskId
type TaskWithId = TaskProc.Input & { taskId: string };

export class SequentialTaskProcessor {
    private handlers = new Map<string, TaskProc.Handler>();
    private activeControllers = new Map<string, AbortController>();
    private emitRaw: (event: TaskProc.Event) => void;
    private taskQueue: Array<TaskWithId> = [];  // Queue to hold tasks with taskId
    private isProcessing = false;  // Flag to check if a task is being processed

    constructor(emitFn: (event: TaskProc.Event) => void) {
        this.emitRaw = emitFn;
    }

    /**
     * Registers a handler for a specific task type.
     * @param type - The task type.
     * @param handler - The handler for the task.
     */
    register(type: string, handler: TaskProc.Handler) {
        if (this.handlers.has(type)) {
            throw new Error(`Handler for type "${type}" already registered`);
        }
        this.handlers.set(type, handler);
    }

    /**
     * Adds a task to the queue.
     * @param task - The task to be added to the queue.
     * @returns taskId - Unique identifier for the task.
     */
    enqueue(task: TaskProc.Input): string {
        console.log(`Queue size before adding task: ${this.taskQueue.length}`);
        const taskId = uuidv4();  // Generate unique task ID
        const taskWithId: TaskWithId = { ...task, taskId };  // Add taskId to the task object

        this.taskQueue.push(taskWithId);

        console.log(`Queue size after adding task: ${this.taskQueue.length}`);

        if (!this.isProcessing) {
            this.processNext();  // Start processing if no task is being processed
        }

        return taskId;
    }

    /**
     * Processes the next task in the queue sequentially.
     * If a task is running, it waits for the task to finish before starting the next one.
     */
    private async processNext() {
        if (this.isProcessing || this.taskQueue.length === 0) {
            return;  // If already processing or no tasks in queue, exit
        }

        const currentTask = this.taskQueue.shift()!;
        const { type, payload, taskId } = currentTask;
        const handler = this.handlers.get(type);

        if (!handler) {
            throw new Error(`No handler registered for type "${type}"`);
        }

        const controller = new AbortController();
        this.activeControllers.set(taskId, controller);

        // Wrapped emit function that includes taskId in the event
        const emit: TaskProc.EmitFn = (event) => {
            this.emitRaw({ ...event, taskId });
        };

        this.isProcessing = true;  // Mark that a task is being processed

        try {
            await handler({ payload, signal: controller.signal, emit });
        } catch (err) {
            const isAborted = controller.signal.aborted;
            emit({ type: isAborted ? 'cancelled' : 'error', payload: isAborted ? null : (err.message || String(err)) });
        } finally {
            // After task completion (success or failure), process the next one
            this.activeControllers.delete(taskId);
            this.isProcessing = false;
            this.processNext();  // Process the next task in the queue
        }
    }

    /**
     * Aborts a task with a given taskId.
     * If the task is still in the queue, it will be removed.
     * If the task is currently running, it will be aborted.
     * @param taskId - The taskId to abort.
     */
    abort(taskId: string) {
        const ctrl = this.activeControllers.get(taskId);
        if (ctrl) {
            // If the task is running, abort it
            ctrl.abort();
            this.activeControllers.delete(taskId);
            console.log(`Task with ID ${taskId} was aborted and removed from active controllers.`);
        } else {
            // If the task is not running, remove it from the queue
            this.taskQueue = this.taskQueue.filter(task => task.taskId !== taskId);
            console.log(`Task with ID ${taskId} was removed from the queue.`);
        }
    }
}
