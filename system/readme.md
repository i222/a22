# A22 system unit
## Application Build and Run Instructions
_If you are running the application for the first time, please complete the [Preparation](#preparation) step before building and running._

This is an Electron application with two user interface modes:

- **Single UI** — React only (unit `/ui-react`)  
- **Multi UI** — React + Vue (units `/ui-react` and `/ui-vue`)

---

## Main Commands for Users

### Build and run the app with React UI (Single UI)

```bash
yarn go:s
```

Builds the React UI and launches the application.

---

### Build and run the app with React and Vue UIs (Multi UI)

```bash
yarn go:m
```

Builds both React and Vue UIs and launches the application.

---

### Run the app without rebuilding (if no changes were made)

```bash
yarn go
```

Launches the application without rebuilding.

---

### Run on Windows (without output filtering)

```bash
yarn go:win
```

Runs the app on Windows without rebuilding. This is used because the `grep` command (used in `go`) is not available on Windows.

---

### Create installation package (release)

- For macOS:

```bash
yarn release:mac
```

- For Windows:

```bash
yarn release:win
```

---

## Helper Commands and Concepts

### What does the `make` command do? (used inside `go:s` and `go:m`)

The script `make.js` builds the required UI and copies the resulting files into the Electron app folder.

- In `go:s` mode — builds React UI only.  
- In `go:m` mode — builds both React and Vue UIs.

You don’t need to run `make` manually — it runs automatically inside `go:s` and `go:m`.

---

### Install dependencies and compile system unit

```bash
yarn build
```

### Make project (compile all of units, copy all to final folder)

Single UI mode
```bash
yarn make
```

Multy UI mode
```bash
yarn make m
```


## Preparation

To build and run the application from scratch, please follow these steps:

1. **Install Git**  
   If you don’t have Git installed, download and install it from:  
   https://git-scm.com/downloads

2. **Install Node.js and Yarn**  
   The project requires Node.js (version 14 or higher recommended) and Yarn package manager.

   - Download Node.js from: https://nodejs.org/  
   - After installing Node.js, install Yarn globally:  
     
     ```bash
     npm install -g yarn
     ```

3. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

4. **Build and run the application**  
   Run one of the commands described below to build and start the app.

