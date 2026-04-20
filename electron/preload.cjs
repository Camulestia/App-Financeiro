const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  plataforma: process.platform,
  database: {
    initialize: () => ipcRenderer.invoke("database:initialize"),
    getInfo: () => ipcRenderer.invoke("database:getInfo"),
    countRows: () => ipcRenderer.invoke("database:countRows"),
    isAvailable: () => ipcRenderer.invoke("database:isAvailable"),
    getAll: (tableName) => ipcRenderer.invoke("database:getAll", tableName),
    save: (tableName, record) => ipcRenderer.invoke("database:save", tableName, record),
    replaceAll: (tableName, records) => ipcRenderer.invoke("database:replaceAll", tableName, records),
    remove: (tableName, id) => ipcRenderer.invoke("database:remove", tableName, id),
  },
});
