
import { BrowserWindow, ipcMain } from "electron";
import { IPCConstantsInvoke, MediaFile } from "a22-shared";
import { getFileInfoFromYtDlp } from "../lib/yt-dlp/yt-dlp.parser";
import { RIPIT_YT_DLP_RUN } from "../init/init";

type Handlers = Array<{ channel: IPCConstantsInvoke, listener: (event: Electron.IpcMainInvokeEvent, ...args: any[]) => (Promise<any>) | (any) }>;

export class YTDLPService {
	constructor(private getWindow: () => BrowserWindow | null) {
	}

	public async handleAll() {
		const handlers: Handlers = [
			{ channel: 'CID_GET_SOURCE_INFO', listener: this.getSourceInfo },
		];

		for (const { channel, listener } of handlers) {
			await ipcMain.handle(channel, listener);
		}
	}

	public getSourceInfo: (_event: Electron.IpcMainInvokeEvent, url: string) => Promise<MediaFile.SourceFile | MediaFile.UrlInfo> =
		async (_event, url) => getFileInfoFromYtDlp(RIPIT_YT_DLP_RUN, url);

}