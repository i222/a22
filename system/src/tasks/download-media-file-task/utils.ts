// system/src/tasks/download-media-file-task/utils.ts
import { MediaFile } from "a22-shared";
import path from "path";
import { CLOutParsers } from "./parse-out.js";
import { isNumber, isObject, isString } from "lodash-es";

/**
 * Returns full file path with a marker ('+' or '*') in the filename,
 * based on the provided file and track info.
 *
 * @param file - MediaFile.Data object, expects file.source.id
 * @param track - MediaFile.Track object, expects formatId and optional ext
 * @param pendingDir - Directory path where files are stored
 * @param marker - Marker character ('+' for completed, '*' for temporary)
 * @returns Full path string with filename containing the marker
 */
export function getFilePathWithMarker(
	file: MediaFile.Data,
	track: MediaFile.Track,
	pendingDir: string,
	marker: "+" | "*"
): string {
	const baseName = `${file.source.id}-${track.formatId}`;
	const fileName = `${baseName}-[${marker}]${track.ext ? "." + track.ext : ""}`;
	return path.join(pendingDir, fileName);
}

export const FormatProgressFn = (data: CLOutParsers.ProgressData) => {
	if (!isObject(data) || !isNumber(data.percent)) {
		return "Downloading track in progress..";
	}
	const info = [
		Math.trunc(data.percent || 0).toString().padStart(5, " ") + '%',
		data.speed.padStart(12, " ") || "",
		data.eta.padStart(8, " ") || ""
	]
		.filter(e => isString(e) && e.length > 0)
		.join(", ")
		;
	return `Downloading track, ${info}`;
};
