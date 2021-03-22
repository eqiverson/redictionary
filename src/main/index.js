import {app, BrowserWindow, Menu, globalShortcut, Tray, nativeImage, clipboard} from 'electron'
import {readdir, readdirSync, lstatSync, existsSync} from 'fs';
import mdict from "mdict";
import path from "path"
import clipboardListener from "clipboard-event"
import clipboardy from "clipboardy"
import fsCache from 'babel-loader/lib/fs-cache';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if(process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`
const mdicts = []
let fromDict = {}

let iconPath = path.join(__dirname, "icon.ico")
let tray;
let visible = true, hotkey, hotkeyStr = 'CommandOrControl+Alt+C';

function main() {
  /**
   * Initial window options
   */
  tray = new Tray(nativeImage.createFromPath(iconPath))
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Show', click() {
        mainWindow.show()
      }
    },
    {
      label: 'Quit', click() {
        app.isQuiting = true
        app.quit()
      }
    }
  ]))
  tray.setToolTip("redictionary")
  mainWindow = new BrowserWindow({
    height: 600,
    useContentSize: true,
    width: 500,
    icon: iconPath
  })

  mainWindow.loadURL(winURL)

  regEsc()
  function regEsc() {
    globalShortcut.register('Escape', () => {
      console.log("esc")
      mainWindow.hide()
    })
  }

  mainWindow.on('closed', () => {
    visible = false
    mainWindow = null
  })
  mainWindow.on('minimize', function (event) {
    visible = false
    event.preventDefault()
    globalShortcut.unregister("Escape")
    mainWindow.hide()
  })
  mainWindow.on("blur", () => {
    visible = false
    mainWindow.hide()
  })
  mainWindow.on('show', function () {
    tray.setHighlightMode('always')
    visible = true
    regEsc()
  })

  globalShortcut.register(hotkeyStr, r => {
    console.log(r)
    if(visible)
      mainWindow.hide()
    else
      mainWindow.show()
  })
  clipboardListener.startListening()
  function regHotkey() { // actually clipboard
    hotkey = true
    clipboardListener.on('change', clip => {
      clip = clipboardy.readSync()
      console.log('Clipboard changed');
      // am i going to query dict
      if(clip.length <= 25 && clip.length >= 1) {
        clip = clip.trim()
        console.log(clip)
        if(clip.match(/[`!@#$%^&*()\-_\{\}=+\|]/)) {
          console.log("ignored for uncommon punctuations")
          return // Not common punctuation
        }
        if(clip.match(/^([A-Za-z]{2,20}\s*){1,2}$/) || clip.length <= 5) {
          clip = clip.replace(/[.,:"'']/g, " ")
          while(true) {
            let newClip = clip.replace("。", "").replace("，", "").replace("《", "").replace("》", "")
            if(newClip == clip)
              break
            else
              clip = newClip
          }
          if(!clip)
            return
          mainWindow.show()
          console.log("begin query " + clip)
          mainWindow.webContents.send("begin", clip)
        }
      }
    });
  }
  regHotkey()
  mainWindow.on("hide", () => {
    visible = false
    globalShortcut.unregister("Escape")
  })
  const menu = Menu.buildFromTemplate([
    {
      label: "Page",
      submenu: [
        {
          label: "Main",
          click() {
            mainWindow.webContents.send("nav", "main")
          }
        },
        {
          label: "Settings",
          click() {
            mainWindow.webContents.send("nav", "settings")
          }
        }
      ]
    }
  ])
  mainWindow.setMenu(menu)
  mainWindow.webContents.on("ipc-message", (e, args) => {
    console.log(mdicts)
    if(args[0] == "lookup") {
      let words = new Set(), i = 0
      fromDict = {}
      for(; i < mdicts.length; i++) {
        let mdict = mdicts[i]
        mdict.search({phrase: args[1], max: 8}).then(w => {
          i--
          w.forEach(val => {
            let k = val.toString()
            words.add(k)
            if(!fromDict[k]) fromDict[k] = []
            fromDict[k].push(mdict.name)
          })
          if(i == 0) {
            mainWindow.webContents.send("lookupResult", Array.from(words))
          }
        })
      }

    } else if(args[0] == "word") {
      let defs = {}, i = 0
      for(; i < mdicts.length; i++) {
        let mdict = mdicts[i]
        console.log(mdict)
        mdict.lookup(args[1]).then(d => {
          i--
          defs[mdict.name] = d
          console.log(d)
          if(i == 0) {
            mainWindow.webContents.send("words", defs)
          }
        }).catch(r => {
          i--
          console.log("No result from " + mdict.name)
        })
      }
    } else if(args[0] == "setHotkey") {
      if(args[1])
        regHotkey()
      else {
        clipboardListener.stopListening()
        hotkey = false
      }
      console.log("hotkey " + hotkey)
    } else if(args[0] == "getHotkey") {
      console.log(hotkey)
      mainWindow.webContents.send("hotkey", hotkey)
    }
  })
  mainWindow.webContents.once("dom-ready", () => {
    mainWindow.webContents.send("dictList", "reset")
    readdirSync(__static).forEach(p => {
      if(p.endsWith("mdx"))
        mdict.dictionary(path.join(__static, p)).then(dict => {
          dict.name = p.substr(0, p.length - 4)
          mdicts.push(dict)
          mainWindow.webContents.send("dictList", "add", p)
          console.log(p)
        })
    })
  })
}

app.on('ready', main)


app.on('window-all-closed', () => {
  if(process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if(mainWindow === null) {
    main()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
