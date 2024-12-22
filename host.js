const { app, BrowserWindow, ipcMain, ipcRenderer } = require('electron')
const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const fs = require('fs')

const obs_settings = {
	ip: 'ws://172.19.176.1',
	port: '4455'
}

async function start_recording(obs) {
	await obs.call('StartRecord')
}

async function stop_recording(obs) {
	await obs.call('StopRecord')
}

const createWindow = async () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,

		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false
		}
	})

	const obs = new OBSWebSocket();
	const { obsWebSocketVersion, negotiatedRpcVersion } = 
    	await obs.connect(`${obs_settings.ip}:${obs_settings.port}`);
	console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)

	let recording_range = JSON.parse(fs.readFileSync('data/playback_new.json'))
	let start = recording_range.startFrame
	let end = recording_range.endFrame
	let duration = (end - start) + (3 * 60)

	loaded = new Promise(resolve => ipcMain.on('[LOADED]', resolve))

	await win.loadFile('ddr.html')
	await loaded;
	
	win.webContents.send('[START]')

	await new Promise(resolve => ipcMain.on('[0]', resolve))
	await start_recording(obs)

	await new Promise(resolve => ipcMain.on('[STOP]', resolve))
	
	await stop_recording(obs)

	await obs.disconnect()

	win.close()
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})