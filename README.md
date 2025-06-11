# Multi-UI Electron Demo Application
## UI for yt-dlp tool

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

[build instructions in system unit](system/readme.md)

---
## Project Status and Upcoming Release Plans

### Current Status

#### React UI

- Retrieving media file information and adding files to the list  
- Displaying a list with media file details and configuration (local file name, selected tracks — more info coming)  
- Sequential downloading of one or more files (downloading tracks and main files, then merging via ffmpeg)  
- Task manager with queue status and task count indicator on the button (more info to be added)  
- Progress events, error notifications, and results indication in the task monitor panel (may be combined with the task manager)  

#### Vue UI

- Currently outdated and non-functional  
- Needs further development and fixes  

---

### Platform Status

#### macOS

- React UI features fully protected and manually verified  
- Build stable and ready for release  

#### Windows

- Application build completed  
- Most features work except file downloading (currently under testing)  
- Download process needs stabilization  

#### Linux
- Future plans

---

### Upcoming Plans

- Update and fix Vue UI for full functionality  
- Improve task manager with detailed status and notifications  
- Stabilize download process on Windows  
- Automate build and release pipelines for macOS and Windows  
- Expand media file info and configuration options  
- Enhance UI selector and routing mechanisms  
