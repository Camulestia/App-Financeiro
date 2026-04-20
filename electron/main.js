import { app, BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.setName("Financas Pessoais");

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const productionIndexPath = path.join(__dirname, "../dist/index.html");
const TABLES = ["expenses", "incomes", "categories", "people", "cards", "fixedExpenses"];
let sqliteDatabase = null;
let sqliteAvailable = false;
let sqlitePath = "";
let sqliteInitializationPromise = null;

function logDatabase(message, details = {}) {
  console.log(`[SQLite] ${message}`, details);
}

async function loadSQLiteDriver() {
  try {
    return await import("node:sqlite");
  } catch {
    return null;
  }
}

function assertTableName(tableName) {
  if (!TABLES.includes(tableName)) throw new Error("Tabela inválida");
}

function createTables() {
  TABLES.forEach((tableName) => {
    sqliteDatabase.exec(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
  });
}

function getRowCounts() {
  if (!sqliteDatabase) return {};
  return Object.fromEntries(
    TABLES.map((tableName) => {
      const row = sqliteDatabase.prepare(`SELECT COUNT(*) AS total FROM ${tableName}`).get();
      return [tableName, row?.total || 0];
    }),
  );
}

async function initializeSQLite() {
  if (sqliteDatabase) return { available: sqliteAvailable, path: sqlitePath, counts: getRowCounts() };
  if (sqliteInitializationPromise) return sqliteInitializationPromise;

  sqliteInitializationPromise = openSQLite();
  const status = await sqliteInitializationPromise;
  if (!status.available) sqliteInitializationPromise = null;
  return status;
}

async function openSQLite() {
  const driver = await loadSQLiteDriver();
  if (!driver?.DatabaseSync) {
    sqliteAvailable = false;
    const reason = "SQLite nativo indisponivel neste runtime";
    logDatabase("falha ao inicializar", { reason });
    return { available: false, reason, path: sqlitePath, counts: {} };
  }

  const databaseDirectory = path.join(app.getPath("userData"), "database");
  fs.mkdirSync(databaseDirectory, { recursive: true });
  sqlitePath = path.join(databaseDirectory, "financas.db");
  const legacySqlitePath = path.join(databaseDirectory, "financas.sqlite");
  if (!fs.existsSync(sqlitePath) && fs.existsSync(legacySqlitePath)) {
    fs.copyFileSync(legacySqlitePath, sqlitePath);
  }
  sqliteDatabase = new driver.DatabaseSync(sqlitePath);
  sqliteAvailable = true;
  sqliteDatabase.exec("PRAGMA journal_mode = WAL");
  sqliteDatabase.exec("PRAGMA synchronous = NORMAL");
  createTables();
  const counts = getRowCounts();
  logDatabase("inicializado", { path: sqlitePath, counts });
  return { available: true, path: sqlitePath, counts };
}

function parseRows(rows) {
  return rows.map((row) => JSON.parse(row.data));
}

function setupDatabaseHandlers() {
  ipcMain.handle("database:initialize", () => initializeSQLite());
  ipcMain.handle("database:getInfo", async () => {
    return initializeSQLite();
  });
  ipcMain.handle("database:countRows", async () => {
    const status = await initializeSQLite();
    return status.available ? getRowCounts() : {};
  });
  ipcMain.handle("database:isAvailable", async () => {
    const status = await initializeSQLite();
    return Boolean(status.available);
  });
  ipcMain.handle("database:getAll", async (_event, tableName) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) throw new Error(status.reason || "SQLite indisponivel");
    const rows = sqliteDatabase.prepare(`SELECT data FROM ${tableName} ORDER BY updatedAt DESC`).all();
    logDatabase("leitura", { tableName, rows: rows.length, path: sqlitePath });
    return parseRows(rows);
  });
  ipcMain.handle("database:save", async (_event, tableName, record) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) throw new Error(status.reason || "SQLite indisponivel");
    const nextRecord = {
      ...record,
      id: record.id || randomUUID(),
      updatedAt: record.updatedAt || new Date().toISOString(),
    };
    sqliteDatabase
      .prepare(`INSERT OR REPLACE INTO ${tableName} (id, data, updatedAt) VALUES (?, ?, ?)`)
      .run(nextRecord.id, JSON.stringify(nextRecord), nextRecord.updatedAt);
    logDatabase("salvou registro", { tableName, id: nextRecord.id, counts: getRowCounts() });
    return nextRecord;
  });
  ipcMain.handle("database:replaceAll", async (_event, tableName, records) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) throw new Error(status.reason || "SQLite indisponivel");
    const items = Array.isArray(records) ? records : [];
    try {
      sqliteDatabase.exec("BEGIN TRANSACTION");
      sqliteDatabase.prepare(`DELETE FROM ${tableName}`).run();
      const insert = sqliteDatabase.prepare(`INSERT OR REPLACE INTO ${tableName} (id, data, updatedAt) VALUES (?, ?, ?)`);
      items.forEach((record) => {
        const nextRecord = {
          ...record,
          id: record.id || randomUUID(),
          updatedAt: record.updatedAt || new Date().toISOString(),
        };
        insert.run(nextRecord.id, JSON.stringify(nextRecord), nextRecord.updatedAt);
      });
      sqliteDatabase.exec("COMMIT");
      logDatabase("substituiu tabela", { tableName, rows: items.length, counts: getRowCounts() });
    } catch (error) {
      sqliteDatabase.exec("ROLLBACK");
      throw error;
    }
    return items;
  });
  ipcMain.handle("database:remove", async (_event, tableName, id) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) throw new Error(status.reason || "SQLite indisponivel");
    sqliteDatabase.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
    logDatabase("removeu registro", { tableName, id, counts: getRowCounts() });
    return true;
  });
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    title: "Financas Pessoais",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    console.error("Falha ao carregar a janela:", { errorCode, errorDescription, validatedURL });
  });

  window.webContents.on("render-process-gone", (_event, details) => {
    console.error("Processo de renderização encerrado:", details);
  });

  if (isDev) {
    window.loadURL("http://localhost:5173");
  } else {
    window.loadFile(productionIndexPath);
  }
}

app.whenReady().then(async () => {
  setupDatabaseHandlers();
  await initializeSQLite();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (sqliteDatabase) {
    sqliteDatabase.close();
    sqliteDatabase = null;
    sqliteAvailable = false;
    sqliteInitializationPromise = null;
  }
});
