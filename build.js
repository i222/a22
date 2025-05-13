const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Root directory paths
const ROOT_DIR = path.resolve(__dirname);
const LIB_SHARED_DIR = path.join(ROOT_DIR, 'shared');
const SYSTEM_DIR = path.join(ROOT_DIR, 'system');
const UI_REACT_DIR = path.join(ROOT_DIR, 'ui-react');
const UI_VUE_DIR = path.join(ROOT_DIR, 'ui-vue');
const FINAL_DIST_DIR = path.join(SYSTEM_DIR, 'dist');

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
// function copyDirectory(src, dest) {
//   console.log(`> Copying from ${src} to ${dest}`);

//   // Remove the destination directory if it already exists
//   // fs.rmSync(dest, { recursive: true, force: true });

//   // Create the destination directory
//   fs.mkdirSync(dest, { recursive: true });

//   // Copy all files and subdirectories
//   fs.readdirSync(src).forEach((file) => {
//     const srcPath = path.join(src, file);
//     const destPath = path.join(dest, file);

//     if (fs.statSync(srcPath).isDirectory()) {
//       // Copy subdirectory recursively
//       copyDirectory(srcPath, destPath);
//     } else {
//       // Copy individual file
//       fs.copyFileSync(srcPath, destPath);
//     }
//   });
// }

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
	// console.log('\n   Clearing ' + FINAL_DIST_DIR);
	// runCommand('yarn install', SYSTEM_DIR); // Install dependencies
	// fs.rmSync(FINAL_DIST_DIR, { recursive: true, force: true });
	runCommand('yarn build', LIB_SHARED_DIR);  // Build the Electron part

	// 1. Build `system` and copy to final /dist/system
	console.log('\n[!] Building `system`...');
	console.log('\n   Clearing ' + FINAL_DIST_DIR);
	// runCommand('yarn install', SYSTEM_DIR); // Install dependencies
	fs.rmSync(FINAL_DIST_DIR, { recursive: true, force: true });
	runCommand('yarn build:prod', SYSTEM_DIR);  // Build the Electron part
	// copyDirectory(path.join(SYSTEM_DIR, 'dist'), path.join(FINAL_DIST_DIR, 'system')); // Copy to final dist

	// 2. Build `ui-react`
	console.log('\n[!] Building `ui-react`...');
	fs.rmSync(path.join(UI_REACT_DIR, 'dist'), { recursive: true, force: true });
	// runCommand('yarn install', UI_REACT_DIR); // Install dependencies
	runCommand('yarn build:prod', UI_REACT_DIR);  // Build React UI

	// 3. Build `ui-vue`
	console.log('\n[!] Building `ui-vue`...');
	fs.rmSync(path.join(UI_VUE_DIR, 'dist'), { recursive: true, force: true });
	// runCommand('yarn install', UI_VUE_DIR); // Install dependencies
	runCommand('yarn build:prod', UI_VUE_DIR);  // Build Vue UI

	// 4. Copy the chosen UI (`react` or `vue`) to final distribution
	const chosenUI = process.argv[2] || 'react'; // Default: React
	const buildSource = chosenUI === 'vue'
		? path.join(UI_VUE_DIR, 'dist') // Path to Vue build output
		: path.join(UI_REACT_DIR, 'dist'); // Path to React build output
	const buildDest = path.join(FINAL_DIST_DIR, 'ui');

	console.log(`\n[!] Copying [${chosenUI}] build to the final distribution folder...`);
	copyDirectory(buildSource, buildDest);

	// 5. Build the Electron app for a specific platform
	const platform = process.argv[3] || 'mac'; // Default: macOS
	const platformCommand = `yarn release:${platform}`; // Command for platform-specific build
	console.log(`\n[!] Building Electron app for platform: ${platform}...`);
	runCommand(platformCommand, SYSTEM_DIR);

	console.log('--- Build Process Completed Successfully! ---');
}

// Execute the main process
main();

// test