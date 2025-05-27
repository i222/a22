import { resolveFFmpegUrl, resolveFFprobeUrl, resolveYtDlpUrl } from "../utils/url-resolvers.js";
import { downloadFile2 } from "../filedown.js";
import { checkAndDownloadBinariesParallel } from "./prepare-bin-files.js";
import { app } from "electron";
import { chmodPostProcessor, unzipPostProcessor } from "../utils/postprocessors.js";
import path from "path";

export const A22_RUNTIME_DIR = app.getPath('userData');//path.join(os.tmpdir(), 'ripit_runtime');
const A22_YT_DLP_BIN = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
export const A22_YT_DLP_RUN = path.join(A22_RUNTIME_DIR, A22_YT_DLP_BIN);

const binFiles = [{
	files: [
		A22_YT_DLP_BIN
	],
	url: resolveYtDlpUrl(),
	dowloader: downloadFile2,
	postProcessor: chmodPostProcessor,
},
{
	files: ['ffmpeg'],
	url: resolveFFmpegUrl(),
	ext: '.zip',
	dowloader: downloadFile2,
	postProcessor: unzipPostProcessor,
},
{
	files: ['ffprobe'],
	url: resolveFFprobeUrl(),
	ext: '.zip',
	dowloader: downloadFile2,
	postProcessor: unzipPostProcessor,
}
	// {
	// 	files: [
	// 		process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg',
	// 		// process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe',
	// 	],
	// 	url: resolveFFmpegUrl(),
	// 	downloadAs: 'ffmpeg.zip'
	// 	dowloader: downloadFile2,
	// 	postProcessor: null,
	// }
];

export async function appInit(): Promise<void> {
	await checkAndDownloadBinariesParallel(binFiles, A22_RUNTIME_DIR, (progress) => {
		console.log(`[${progress.status}]`, progress.params);
	});
	console.log('✅ All binaries checked/downloaded successfully');
}