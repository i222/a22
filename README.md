# Multi-UI Electron Demo Application

This is a test project demonstrating a **multi-platform Electron application** with multiple frontend UI implementations. The purpose is to explore how different frameworks (React and Vue) can be integrated into a single Electron-based desktop application.

## Features

- 🔌 Electron shell with preload support
- 🧩 Multiple frontend UIs (React and Vue)
- 🗂 UI selector screen embedded in the app
- 🌐 Independent routing and asset management per UI
- 📦 Shared library (`a22-shared`) for logic reuse
- 📁 Build system organized by target and UI

---

## 🚀 Build Instructions

You can build the application in **two modes**:

### 1. Single-UI Build (Manual, s-build)

This script automates the build process for a **multi-UI Electron application**, allowing you to choose between different UI frameworks (`React` or `Vue`) and build targets (`mac`, `win`, `linux`).

The script ensures:
- Shared library is built first
- System (Electron shell) is built cleanly
- Both UI builds are prepared
- Only the selected UI is copied into the final distribution
- Electron app is packaged for the selected platform

---

### 🛠 How to Use

Run the script using Node.js. You can optionally pass UI and platform as arguments.

```bash
# Usage:
node s-build.js [ui] [platform]

# Examples:

# Build with default settings (React UI, macOS)
node s-build.js

# Build with Vue UI for Windows
node s-build.js vue win

# Build with React UI for Linux
node s-build.js react linux
```

---

### 🧱 What Happens Internally

1. **Build shared logic** (in `shared/`)
2. **Clean and build** Electron `system/`
3. **Clean and build** both `ui-react/` and `ui-vue/`
4. **Copy chosen UI** (`react` or `vue`) into `system/dist/ui`
5. **Trigger platform-specific Electron builder**

---

### 🗂 Output Structure

After the build, the final distributable app will be inside the Electron builder’s output directory `system/release-builds`.

The selected UI will be embedded under:

```text
system/dist/ui/index.html
```
## 📦 Multi-UI Build Script (`m-build.js`)

The **Multi-UI Build** script (`m-build.js`) is designed for a multi-UI project where both **React** and **Vue** UIs are supported. This script facilitates building and packaging the Electron app with both UIs available, letting you choose at runtime which UI to use.

The script:

1. Builds the shared library (`shared/`).
2. Builds the system part (`system/`) and places it in `/system/dist/`.
3. Builds both **React** and **Vue** UIs.
4. Copies both UIs into the final distribution folder (`dist/`).
5. Packages the Electron app for the selected platform (macOS by default).

### ✅ Usage

Run the script from the project root:

```bash
# Build for the default platform (macOS) with both UIs (React and Vue)
node m-build.js

# To specify a platform (e.g., Windows)
node m-build.js win

# To specify another platform (e.g., Linux)
node m-build.js linux
```

By default:
- UIs: Both **React** and **Vue** are copied to `dist/ui-react/` and `dist/ui-vue/`.
- Platform: **macOS** is the default platform.

### 🏗 Output

After running the script, the following folders will be populated:

- `system/dist/ui-react/` – Contains the built React UI.
- `system/dist/ui-vue/` – Contains the built Vue UI.
- `system/dist/` – Contains the system-related static files.

Finally, the Electron app is packaged for the selected platform under the `system/release/{platform}/` directory.

---

### ⚙️ How it works:

1. **Build the shared library**: `yarn build` is executed in the `shared/` directory.
2. **Build system (Electron)**: The Electron app is built with `yarn build:prod` in the `system/` directory.
3. **Build UIs**:
   - **React** UI is built from `ui-react/`.
   - **Vue** UI is built from `ui-vue/`.
4. **Copy UIs and Static Files**: Both UIs are copied into the `dist/` directory. Static files from the `system/static/` folder are also copied.
5. **Build the Electron app for a platform**: The script uses `yarn release:{platform}` to build the Electron app for the specified platform (e.g., `mac`, `win`, `linux`).

---

### 🔧 Customization

- To specify a different platform, use the second argument: `node m-build.js <platform>`.
- The script automatically handles building and copying both React and Vue UIs. If you want to build only one UI, modify the script or use the `s-build.js` script (Selective Build).
