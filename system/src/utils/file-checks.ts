import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fsp from 'fs/promises';
import { statSync } from 'fs';

const execFileAsync = promisify(execFile);

/**
 * Synchronously returns the size of the file at the given path in bytes.
 *
 * @param {string} path - The path to the file.
 * @returns {number} The file size in bytes, or -1 if the file does not exist, is not a file, or an error occurs.
 */
export function getFileSizeSync(path: string): number {
  try {
    const stats = statSync(path);
    // Check if the path is a file
    if (stats.isFile()) {
      return stats.size;
    }
    // The path exists but is not a file
    return -1;
  } catch {
    // Error occurred (file does not exist or no access)
    return -1;
  }
}



export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs a given executable with a version argument and returns its version string.
 * @param path - Full path to the executable file.
 * @param verArg - Version argument (e.g., '--version' or '-v').
 * @returns The version string if successful, or null if an error occurs.
 */
async function getFileVersion(path: string, verArg: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(path, [verArg]);
    return stdout.trim();
  } catch (error) {
    console.error(`Failed to get version from ${path}:`, error);
    return null;
  }
}
