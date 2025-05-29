import fs from 'fs/promises'
import path from 'path';
// Clear all of a22-shared local modules 

async function clearLocalDirs(basePath) {
	try {
		const rootDir = ".."; // path.resolve(__dirname);
		const dir = path.join(rootDir, basePath, 'node_modules', 'a22-shared');
		const lock = path.join(rootDir, basePath, 'yarn.lock');
		console.log(`Deleting: ${dir}`);
		await fs.rm(dir, { recursive: true, force: true });
		console.log(`Deleting: ${lock}`);
		await fs.unlink(lock);
	} catch (error) {
		console.log(`Deleting error: ${error}`);
	}
}

async function main() {
	await clearLocalDirs('system');
	await clearLocalDirs('ui-react');
	await clearLocalDirs('ui-vue');
}

await main();
