import { createWriteStream } from 'fs';
import { Readable } from 'stream';

export const downloadFile3 = async (url: string, outputPath: string): Promise<void> => {

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);

	try {
		const response = await fetch(url);

		if (!response.ok || !response.body) {
			throw new Error(`Failed to fetch ${url}. Status: ${response.status}`);
		}

		// Web-stream to Node-stream
		const nodeStream = Readable.fromWeb(response.body as any);

		const fileStream = createWriteStream(outputPath);

		await new Promise<void>((resolve, reject) => {
			nodeStream.pipe(fileStream);
			nodeStream.on('error', reject);
			fileStream.on('finish', resolve);
			fileStream.on('error', reject);
		});
	} catch (err) {
		if ((err as any).name === 'AbortError') {
			throw new Error(`Request timed out after 5000ms`);
		}
		throw err;
	} finally {
		clearTimeout(timeout); // Clean up the timeout
	}
};


export const downloadFile2 = async (
  url: string,
  outputPath: string,
  signal?: AbortSignal
): Promise<void> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  // support an abortion from outside too
  signal?.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch ${url}. Status: ${response.status}`);
    }

    const nodeStream = Readable.fromWeb(response.body as any);
    const fileStream = createWriteStream(outputPath);

    await new Promise<void>((resolve, reject) => {
      nodeStream.pipe(fileStream);
      nodeStream.on('error', reject);
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (err) {
    if ((err as any).name === 'AbortError') {
      throw new Error(`Request aborted or timed out`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};
