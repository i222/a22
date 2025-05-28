// m-build.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Root directory paths
const ROOT_DIR = path.resolve(__dirname);
// Sourses
const LIB_SHARED_DIR = path.join(ROOT_DIR, 'shared');
const SYSTEM_DIR = path.join(ROOT_DIR, 'system');
const UI_REACT_DIR = path.join(ROOT_DIR, 'ui-react');
const UI_VUE_DIR = path.join(ROOT_DIR, 'ui-vue');
const SYSTEM_STATIC_DIR = path.join(SYSTEM_DIR, 'static');

const FINAL_DIST_DIR = path.join(SYSTEM_DIR, 'dist');
const UI_DIST_ROOT_DIR = path.join(FINAL_DIST_DIR, 'ui');
const UI_DIST_REACT_DIR = path.join(UI_DIST_ROOT_DIR, 'react');
const UI_DIST_VUE_DIR = path.join(UI_DIST_ROOT_DIR, 'vue');


/**
 * Execute a terminal command within a specific directory.
 * 
 * @param {string} command - The command to run (e.g., `yarn install`).
 * @param {string} cwd - The working directory where the command will be executed.
 */
function runCommand(command, cwd = ROOT_DIR) {
	console.log(`> Running: ${command} (in ${cwd})`);
	try {
		execSync(command, { stdio: 'inherit', cwd });
	} catch (error) {
		console.error(`Error while running command: ${command}`);
		process.exit(1);
	}
}

/**
 * Recursively copy a directory and its contents.
 * 
 * @param {string} src - Source directory path.
 * @param {string} dest - Destination directory path.
 */
function copyDirectory(src, dest) {
	console.log(`> Copying from ${src} to ${dest}`);

	if (!fs.existsSync(dest)) {
		fs.mkdirSync(dest, { recursive: true });
		console.log(`> Destination directory (${dest}) created.`);
	}

	fs.readdirSync(src).forEach((file) => {
		const srcPath = path.join(src, file);
		const destPath = path.join(dest, file);

		if (fs.statSync(srcPath).isDirectory()) {
			copyDirectory(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	});

	console.log(`> Copy completed successfully from ${src} to ${dest}`);
}

/**
 * Main build process.
 * 
 * Steps:
 * 1. Build the `system` part (Electron app) into /system/dist and copy to /dist/system.
 * 2. Build `ui-react` locally.
 * 3. Build `ui-vue` locally.
 * 4. Copy the appropriate UI (`react` by default) to the final distribution directory.
 * 5. Build the Electron app for a specific platform (macOS by default).
 */
async function main() {
	console.log('--- Starting Build Process ---');

	console.log('\n[!] Building `shared lib`...');
	runCommand('yarn build', LIB_SHARED_DIR);  // Build the Electron part

	// 1. Build `system` and copy to final /dist/system
	console.log('\n[!] Building `system`...');
	console.log('\n   Clearing ' + FINAL_DIST_DIR);
	fs.rmSync(FINAL_DIST_DIR, { recursive: true, force: true });
	runCommand('yarn build', SYSTEM_DIR);  // Build the Electron part
	
	// 2. Build `ui-react`
	console.log('\n[!] Building `ui-react`...');
	fs.rmSync(path.join(UI_REACT_DIR, 'dist'), { recursive: true, force: true });
	runCommand('yarn build:prod', UI_REACT_DIR);  // Build React UI

	// 3. Build `ui-vue`
	console.log('\n[!] Building `ui-vue`...');
	fs.rmSync(path.join(UI_VUE_DIR, 'dist'), { recursive: true, force: true });
	runCommand('yarn build:prod', UI_VUE_DIR);  // Build Vue UI

	// Copying files

	console.log(`\n[!] Copying static files to the final distribution folder...`);
	copyDirectory(SYSTEM_STATIC_DIR, UI_DIST_ROOT_DIR);

	console.log(`\n[!] Copying ui-vue files to the final distribution folder...`);
	copyDirectory(path.join(UI_VUE_DIR, 'dist'), UI_DIST_VUE_DIR);

	console.log(`\n[!] Copying ui-react files to the final distribution folder...`);
	copyDirectory(path.join(UI_REACT_DIR, 'dist'), UI_DIST_REACT_DIR);	

	// 5. Build the Electron app for a specific platform
	const platform = process.argv[2] || 'mac'; // Default: macOS
	const platformCommand = `yarn release:${platform}`; // Command for platform-specific build

	console.log(`\n[!] Building Electron app for platform: ${platform}...`);
	runCommand(platformCommand, SYSTEM_DIR);

	console.log('--- Build Process Completed Successfully! ---');
}

// Execute the main process
main();