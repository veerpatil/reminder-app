const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("boltOverlay", {
  onShowReminder: (callback) => {
    ipcRenderer.on("show-reminder", (_, data) => callback(data));
  },
  dismiss: () => ipcRenderer.send("overlay:dismiss"),
});
