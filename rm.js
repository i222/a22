const fs = require('fs').promises;
const path = require('path');
// Clear a22-shared lib for update

async function clearLocalDirs(basePath) {
	try {
		const rootDir = path.resolve(__dirname);
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
	const opt = process.argv[2];

	switch (opt) {
		case '0':
			await clearLocalDirs('system');
			return;
		case '1':
			await clearLocalDirs('ui-react');
			return;
		case '2':
			await clearLocalDirs('ui-vue');
			return;
		case 'all':
			await clearLocalDirs('system');
			await clearLocalDirs('ui-react');
			await clearLocalDirs('ui-vue');
			return;
		default:
			console.log(`\n Invalid option ${opt}, use 0-2 or \'all\'`);
	}

}

main();
