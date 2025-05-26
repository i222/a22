// system/src/lib/services/queue-store-service.ts
import { MediaFile } from "a22-shared";

/** Abstract store interface for queue data */
export abstract class AbstractQueueStore {
	abstract add(file: MediaFile.Data): Promise<boolean>;
	abstract update(file: MediaFile.Data): Promise<boolean>;
	abstract removeFiles(ids: string[]): Promise<void>
	abstract requestList(): void
	abstract getList(): Promise<MediaFile.Data[]>;
	abstract handleAll(): Promise<void>;
	abstract init(): Promise<void>;
}