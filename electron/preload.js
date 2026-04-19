import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("desktopApp", {
  plataforma: process.platform,
});
