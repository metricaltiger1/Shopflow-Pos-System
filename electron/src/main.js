const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');
const { execSync } = require('child_process');

let mainWindow;
let backendProcess;
let isDev = process.env.NODE_ENV === 'development';
let backendReady = false;

function log(message, source = 'MAIN') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${source}] ${message}`);
}

function initializeDatabase(backendPath) {
  try {
    log('Checking database...');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(backendPath, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Check if database file exists
    const dbPath = path.join(dataDir, 'app.sqlite');
    const dbExists = fs.existsSync(dbPath);

    if (!dbExists) {
      log('Database file not found in packaged app! This should not happen.', 'ERROR');
      // In production, the database should have been pre-built during packaging
      // Create empty file as fallback - backend will handle schema creation
      fs.closeSync(fs.openSync(dbPath, 'w'));
      log('Created empty database file as fallback');
      return true;
    } else {
      log('Database file exists and is ready');
      return true;
    }
  } catch (error) {
    log(`Database check failed: ${error.message}`, 'ERROR');
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../icons/icon.png'),
    show: false,
    fullscreen: true,
    maximized: true,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log('Window is now visible');
    
    if (!backendReady) {
      mainWindow.webContents.executeJavaScript(`
        window.backendReady = false;
        console.log('Backend not ready yet - delaying API requests');
      `);
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`Failed to load: ${errorCode} - ${errorDescription} - ${validatedURL}`, 'ERROR');
    
    if (validatedURL.includes('index.html')) {
      const fixedUrl = validatedURL.replace(/\/index\.html.*$/, '/index.html');
      log(`Redirecting to: ${fixedUrl}`);
      mainWindow.loadURL(fixedUrl);
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(process.resourcesPath, 'app.asar', 'frontend', 'dist', 'index.html');
    
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath).catch(err => {
        log(`Failed to load file: ${err.message}`, 'ERROR');
        showLoadError(`Failed to load application: ${err.message}`);
      });
    } else {
      showLoadError(`Frontend file not found at: ${indexPath}`);
    }
  }

  setupWindowControls();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function setupWindowControls() {
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}

function showLoadError(message) {
  if (mainWindow) {
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <head>
          <title>Loading Error</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 40px; 
              background: #f5f5f5; 
              color: #333; 
            }
            .container { 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            }
            h1 { color: #e74c3c; }
            pre { 
              background: #f8f9fa; 
              padding: 10px; 
              border-radius: 4px; 
              overflow: auto; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Application Loading Error</h1>
            <p>${message}</p>
            <p>Please check the console for more details and try rebuilding the application.</p>
            <h3>Debug Information:</h3>
            <pre>${new Date().toISOString()}
Node.js: ${process.versions.node}
Electron: ${process.versions.electron}
Chrome: ${process.versions.chrome}
Platform: ${process.platform} ${process.arch}
Resources Path: ${process.resourcesPath}</pre>
          </div>
        </body>
      </html>
    `);
  }
}

function startBackend() {
  if (isDev) {
    log('Using development backend server');
    backendReady = true;
    return;
  }

  const backendPath = path.join(process.resourcesPath, 'backend');
  log(`Starting backend from: ${backendPath}`);

  // Check database (it should already be pre-built)
  if (!initializeDatabase(backendPath)) {
    log('Database check failed, backend may not start properly', 'ERROR');
  }

  const dbPath = path.join(backendPath, 'data', 'app.sqlite');
  const env = {
    ...process.env,
    PORT: '3001',
    NODE_ENV: 'production',
    ELECTRON: 'true',
    DATABASE_URL: `file:${dbPath}?connection_limit=1`
  };

  try {
    backendProcess = fork(path.join(backendPath, 'dist', 'index.js'), [], {
      cwd: backendPath,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe', 'ipc']
    });

    backendProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      log(`BACKEND: ${message}`, 'BACKEND');
      
      if (message.includes('Server listening') || message.includes('listening at')) {
        backendReady = true;
        log('Backend is now ready!');
        
        if (mainWindow) {
          mainWindow.webContents.executeJavaScript(`
            window.backendReady = true;
            console.log('Backend is now ready - API requests can proceed');
            if (window.onBackendReady) {
              window.onBackendReady();
            }
          `);
        }
      }
    });

    backendProcess.stderr.on('data', (data) => {
      log(`BACKEND ERROR: ${data.toString().trim()}`, 'BACKEND-ERROR');
    });

    backendProcess.on('close', (code) => {
      log(`Backend process exited with code ${code}`);
      backendReady = false;
    });

  } catch (error) {
    log(`Failed to start backend: ${error.message}`, 'ERROR');
  }
}

// App event handlers
app.whenReady().then(() => {
  log('App is ready, starting backend and creating window...');
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// IPC handlers
ipcMain.handle('get-backend-url', () => {
  return isDev ? 'http://localhost:3001' : 'http://localhost:3001';
});

ipcMain.handle('get-is-electron', () => {
  return true;
});

ipcMain.handle('is-backend-ready', () => {
  return backendReady;
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'ERROR');
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
});