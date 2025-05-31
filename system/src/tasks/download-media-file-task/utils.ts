// system/src/tasks/download-media-file-task/utils.ts
import { MediaFile } from "a22-shared";
import path from 'path';

/**
 * Returns full file path with a marker ('+' or 'o') in the filename,
 * based on the provided file and track info.
 * 
 * @param file - MediaFile.Data object, expects file.source.id
 * @param track - MediaFile.Track object, expects formatId and optional ext
 * @param pendingDir - Directory path where files are stored
 * @param marker - Marker character ('+' for completed, 'o' for temporary)
 * @returns Full path string with filename containing the marker
 */
export function getFilePathWithMarker(
	file: MediaFile.Data,
	track: MediaFile.Track,
	pendingDir: string,
	marker: '+' | 'o',
): string {
	const baseName = `${file.source.id}-${track.formatId}`;
	const fileName = `${baseName}-[${marker}]${track.ext ? '.' + track.ext : ''}`;
	return path.join(pendingDir, fileName);
}
