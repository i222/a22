// system/src/tasks/download-media-files-task.ts
import { TaskProc } from "a22-shared";
// import { serviceContainer } from "../services/service-container";

/**
 * Task handler to simulate media files downloading and merging.
 * 
 * @param params - Task execution parameters including:
 *   - payload: contains the array of media files to download
 *   - signal: abort signal for task cancellation
 *   - emit: function to emit events like progress or result
 */
export const DownloadMediaFilesTask: TaskProc.DownloadMediafilesReqHandler = async ({ payload, signal, emit }) => {
	const { downloadFiles } = payload;
	const totalFiles = downloadFiles.length;

	if (totalFiles === 0) {
		emit({
			type: 'error',
			message: 'Error: No files selected for download',
			payload: null,
		});
		return;
	}

	try {
		// Simulate download for each file
		for (let index = 0; index < totalFiles; index++) {
			const file = downloadFiles[index];

			// Emit message that the file download is starting
			emit({
				type: 'progress',
				message: `Downloading file ${index + 1} started, '${file.source.title}'`,
				payload: {
					fileId: file.id,
					stage: 1
				},
			});

			// Wait 2 seconds before starting the download for the file
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Loop through each track for the file and download it sequentially
			for (let trackIndex = 0; trackIndex < file.trackIds.length; trackIndex++) {
				const track = file.trackIds[trackIndex];

				// Emit message that downloading the track has started
				emit({
					type: 'progress',
					// message: `Downloading track ${trackIndex + 1} (${track.formatId}) for file ${file.source.title} started.`,
					message: `Downloading file/track=${index + 1}/${trackIndex + 1}, '${file.source.title}'`,
					payload: {
						fileId: file.id,
						stage: 2
					},
				});

				// Simulate the download time for the track (3 seconds)
				await new Promise(resolve => setTimeout(resolve, 3000));

				// Emit message that download for the track has finished
				emit({
					type: 'progress',
					message: `Downloaded: file/track=${index + 1}/${trackIndex + 1}, '${file.source.title}'`,
					payload: {
						fileId: file.id,
						stage: 3
					},
				});
			}

			// // Emit message that the file download has finished
			// emit({
			// 	type: 'progress',
			// 	payload: `File ${index + 1}: ${file.source.title} download finished.`,
			// });	

			// Simulate file merging process
			emit({
				type: 'progress',
				message: `ffmpeg is merging file=${index + 1}, '${file.source.title}'`,
				payload: {
					fileId: file.id,
					stage: 4
				},
			});
			// Wait for the merge process (e.g., 3 seconds)
			await new Promise(resolve => setTimeout(resolve, 3000));
			// Emit the result after successful merge

			emit({
				type: 'progress',
				message: `File done: ${index + 1}, ${file.source.title}`,
				payload: {
					stage: 5,
					fileId: file.id,
					fileSize: '100MB', // Example size
					filePath: '/path/to/merged/file', // Example path
				},
			});
		}
		emit({
			type: 'result',
			message: `Success: ${totalFiles} media file${totalFiles > 1 ? 's' : ''} downloaded`,
			payload: {
				stage: 6,
			},
		});

	} catch (error) {
		// Emit error event if something goes wrong
		emit({
			type: 'error',
			message: 'Error occurred during download or merging. ' + error.message,
			payload: { error }
		});
	}
};
