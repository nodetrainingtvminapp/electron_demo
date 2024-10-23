const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const sharp = require('sharp');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle image processing
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
  });
  return result.filePaths[0];
});

ipcMain.handle('process-image', async (event, { inputPath, operation }) => {
  const outputDir = path.join(app.getPath('pictures'), 'processed-images');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = path.basename(inputPath);
  const outputPath = path.join(outputDir, `processed_${filename}`);

  let pipeline = sharp(inputPath);

  // Apply selected operation
  switch (operation) {
    case 'grayscale':
      pipeline = pipeline.grayscale();
      break;
    case 'resize':
      pipeline = pipeline.resize(300, 300, { fit: 'contain' });
      break;
    case 'blur':
      pipeline = pipeline.blur(5);
      break;
  }

  await pipeline.toFile(outputPath);
  return outputPath;
});