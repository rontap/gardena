const { app, BrowserWindow, protocol, net, shell } = require('electron')
const { join } = require('node:path')
const { pathToFileURL } = require('node:url')

const ROOT = join(__dirname, '..', 'dist')
const ENTRY = 'gardena://app/index.html'

protocol.registerSchemesAsPrivileged([
  { scheme: 'gardena', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
])

const serve = (req) => {
  const path = decodeURIComponent(new URL(req.url).pathname)
  const file = join(ROOT, path)
  const safe = file === ROOT || file.startsWith(ROOT + require('node:path').sep)
  return net.fetch(pathToFileURL(safe ? file : join(ROOT, 'index.html')).href)
}

const open = () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#ded7c4',
    autoHideMenuBar: true,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  })
  win.once('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  win.loadURL(ENTRY)
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })
  app.whenReady().then(() => {
    protocol.handle('gardena', serve)
    open()
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) open()
    })
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
