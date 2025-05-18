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
			payload: 'No files selected for download.',
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
				payload: `Downloading file ${index + 1}: ${file.source.title} started.`,
			});

			// Wait 2 seconds before starting the download for the file
			await new Promise(resolve => setTimeout(resolve, 2000));

			// Loop through each track for the file and download it sequentially
			for (let trackIndex = 0; trackIndex < file.trackIds.length; trackIndex++) {
				const track = file.trackIds[trackIndex];

				// Emit message that downloading the track has started
				emit({
					type: 'progress',
					payload: `Downloading track ${trackIndex + 1} (${track.formatId}) for file ${file.source.title} started.`,
				});

				// Simulate the download time for the track (3 seconds)
				await new Promise(resolve => setTimeout(resolve, 3000));

				// Emit message that download for the track has finished
				emit({
					type: 'progress',
					payload: `Track ${trackIndex + 1} (${track.formatId}) for file ${file.source.title} download finished.`,
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
				payload: `Merging started for file ${index + 1}: ${file.source.title}`,
			});
			// Wait for the merge process (e.g., 3 seconds)
			await new Promise(resolve => setTimeout(resolve, 3000));
			// Emit the result after successful merge

			emit({
				type: 'progress',
				payload: {
					message: `File ready: ${index + 1}: ${file.source.title}`,
					fileSize: '100MB', // Example size
					filePath: '/path/to/merged/file', // Example path
				},
			});
		}
		emit({
			type: 'result',
			payload: {
				message: 'All files downloaded'
			},
		});

	} catch (error) {
		// Emit error event if something goes wrong
		emit({
			type: 'error',
			payload: error.message || 'Error occurred during download or merging.',
		});
	}
};
