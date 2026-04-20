import { app, BrowserWindow, ipcMain } from "electron";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const productionIndexPath = path.join(__dirname, "../dist/index.html");
const TABLES = ["expenses", "incomes", "categories", "people", "cards", "fixedExpenses"];
let sqliteDatabase = null;
let sqliteAvailable = false;

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

async function initializeSQLite() {
  if (sqliteDatabase) return { available: sqliteAvailable };

  const driver = await loadSQLiteDriver();
  if (!driver?.DatabaseSync) {
    sqliteAvailable = false;
    return { available: false, reason: "SQLite nativo indisponível neste runtime" };
  }

  const databaseDirectory = path.join(app.getPath("userData"), "database");
  fs.mkdirSync(databaseDirectory, { recursive: true });
  sqliteDatabase = new driver.DatabaseSync(path.join(databaseDirectory, "financas.sqlite"));
  sqliteAvailable = true;
  createTables();
  return { available: true };
}

function parseRows(rows) {
  return rows.map((row) => JSON.parse(row.data));
}

function setupDatabaseHandlers() {
  ipcMain.handle("database:initialize", () => initializeSQLite());
  ipcMain.handle("database:isAvailable", async () => {
    const status = await initializeSQLite();
    return Boolean(status.available);
  });
  ipcMain.handle("database:getAll", async (_event, tableName) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) return [];
    const rows = sqliteDatabase.prepare(`SELECT data FROM ${tableName} ORDER BY updatedAt DESC`).all();
    return parseRows(rows);
  });
  ipcMain.handle("database:save", async (_event, tableName, record) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) return null;
    const nextRecord = {
      ...record,
      id: record.id || randomUUID(),
      updatedAt: record.updatedAt || new Date().toISOString(),
    };
    sqliteDatabase
      .prepare(`INSERT OR REPLACE INTO ${tableName} (id, data, updatedAt) VALUES (?, ?, ?)`)
      .run(nextRecord.id, JSON.stringify(nextRecord), nextRecord.updatedAt);
    return nextRecord;
  });
  ipcMain.handle("database:replaceAll", async (_event, tableName, records) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) return [];
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
    } catch (error) {
      sqliteDatabase.exec("ROLLBACK");
      throw error;
    }
    return items;
  });
  ipcMain.handle("database:remove", async (_event, tableName, id) => {
    assertTableName(tableName);
    const status = await initializeSQLite();
    if (!status.available) return false;
    sqliteDatabase.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(id);
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
      preload: path.join(__dirname, "preload.js"),
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

app.whenReady().then(() => {
  setupDatabaseHandlers();
  initializeSQLite();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
