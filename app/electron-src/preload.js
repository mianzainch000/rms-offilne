const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("licenseAPI", {
  getComputerId: () => ipcRenderer.invoke("license:get-computer-id"),
  activate: (key) => ipcRenderer.invoke("license:activate", key),
});

contextBridge.exposeInMainWorld("deactivateAPI", {
  getComputerId: () => ipcRenderer.invoke("license:get-computer-id"),
  deactivate: (code) => ipcRenderer.invoke("license:deactivate", code),
});
