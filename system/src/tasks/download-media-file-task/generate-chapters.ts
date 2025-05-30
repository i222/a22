// system/src/tasks/download-media-file-task/generate-chapters.ts
import fs from 'fs/promises';
import path from 'path';

/**
 * Generate chapter track metadata file if chapters exist in source metadata.
 * Emits progress before generation.
 * Returns the path to the generated chapter metadata file or null if no chapters.
 * 
 * @param file MediaFile.Data object
 * @param baseDir string - directory where to save chapter track stub file
 * @param emit Emit function to send progress events
 * @returns Promise<string|null> - path to chapter metadata file or null if none
 */
export async function generateChapterTrack(file: any, baseDir: string, emit: Function): Promise<string | null> {
	if (
		file.source.eData &&
		'chapters' in file.source.eData &&
		Array.isArray(file.source.eData.chapters) &&
		file.source.eData.chapters.length > 0
	) {
		emit({
			type: 'progress',
			message: `Generating chapter track for file '${file.source.title}'`,
			payload: { fileId: file.id, stage: 4 },
		});

		const chapters = file.source.eData.chapters;

		// ffmetadata format for chapters: https://trac.ffmpeg.org/wiki/ChapterMetadata
		let metadataContent = ';FFMETADATA1\n';

		chapters.forEach((chapter: any, index: number) => {
			const start = Math.floor((chapter.start_time || 0) * 1000);
			const end = Math.floor((chapter.end_time || 0) * 1000);
			const title = chapter.title ? chapter.title.replace(/\n/g, ' ') : `Chapter ${index + 1}`;

			metadataContent += `[CHAPTER]\nTIMEBASE=1/1000\nSTART=${start}\nEND=${end}\ntitle=${title}\n\n`;
		});

		const fileName = `${file.source.id}-chapters.ffmetadata`;
		const filePath = path.join(baseDir, fileName);

		await fs.writeFile(filePath, metadataContent, 'utf-8');

		emit({
			type: 'progress',
			message: `Chapter track generated: ${fileName}`,
			payload: { fileId: file.id, stage: 4 },
		});

		return filePath;
	}

	// No chapters, return null
	return null;
}
