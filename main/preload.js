const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("bolt", {
  listReminders: () => ipcRenderer.invoke("reminders:list"),
  addReminder: (payload) => ipcRenderer.invoke("reminders:add", payload),
  removeReminder: (id) => ipcRenderer.invoke("reminders:remove", id),
  toggleReminder: (id, enabled) =>
    ipcRenderer.invoke("reminders:toggle", id, enabled),
  testReminder: (message) => ipcRenderer.invoke("reminders:test", { message }),
});
