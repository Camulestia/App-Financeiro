const hasDesktopDatabase = () => typeof window !== "undefined" && Boolean(window.desktopApp?.database);
const isElectronRuntime = () =>
  typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("electron");

function ensureDesktopDatabase() {
  if (hasDesktopDatabase()) return true;
  if (isElectronRuntime()) throw new Error("Ponte SQLite indisponivel no Electron");
  return false;
}

export async function isSQLiteAvailable() {
  if (!ensureDesktopDatabase()) return false;
  return window.desktopApp.database.isAvailable();
}

export async function initializeSQLite() {
  if (!ensureDesktopDatabase()) return { available: false, reason: "Ambiente web" };
  return window.desktopApp.database.initialize();
}

export async function getSQLiteInfo() {
  if (!ensureDesktopDatabase()) return { available: false, reason: "Ambiente web", path: "", counts: {} };
  return window.desktopApp.database.getInfo();
}

export function hasSQLiteBridge() {
  return hasDesktopDatabase();
}

export function isElectronApp() {
  return isElectronRuntime();
}

export async function countSQLiteRows() {
  if (!ensureDesktopDatabase()) return {};
  return window.desktopApp.database.countRows();
}

export async function getSQLiteRecords(tableName) {
  if (!ensureDesktopDatabase()) return [];
  return window.desktopApp.database.getAll(tableName);
}

export async function saveSQLiteRecord(tableName, record) {
  if (!ensureDesktopDatabase()) return null;
  return window.desktopApp.database.save(tableName, record);
}

export async function replaceSQLiteRecords(tableName, records) {
  if (!ensureDesktopDatabase()) return [];
  return window.desktopApp.database.replaceAll(tableName, records);
}

export async function deleteSQLiteRecord(tableName, id) {
  if (!ensureDesktopDatabase()) return false;
  return window.desktopApp.database.remove(tableName, id);
}
