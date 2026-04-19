const hasDesktopDatabase = () => typeof window !== "undefined" && Boolean(window.desktopApp?.database);

export async function isSQLiteAvailable() {
  if (!hasDesktopDatabase()) return false;
  return window.desktopApp.database.isAvailable();
}

export async function initializeSQLite() {
  if (!hasDesktopDatabase()) return { available: false, reason: "Ambiente web" };
  return window.desktopApp.database.initialize();
}

export async function getSQLiteRecords(tableName) {
  if (!hasDesktopDatabase()) return [];
  return window.desktopApp.database.getAll(tableName);
}

export async function saveSQLiteRecord(tableName, record) {
  if (!hasDesktopDatabase()) return null;
  return window.desktopApp.database.save(tableName, record);
}

export async function replaceSQLiteRecords(tableName, records) {
  if (!hasDesktopDatabase()) return [];
  return window.desktopApp.database.replaceAll(tableName, records);
}

export async function deleteSQLiteRecord(tableName, id) {
  if (!hasDesktopDatabase()) return false;
  return window.desktopApp.database.remove(tableName, id);
}
