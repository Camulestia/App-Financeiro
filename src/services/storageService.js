import { defaultCategories } from "../utils/defaultCategories";

const DB_NAME = "financas-pessoais-db";
const DB_VERSION = 1;
const STORES = ["expenses", "incomes", "categories", "people", "cards", "fixedExpenses", "pendingImports"];

function openDatabase() {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB indisponível"));

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: "id" });
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbAll(storeName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readonly");
    const request = transaction.objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(storeName, item) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).put(item);
    transaction.oncomplete = () => resolve(item);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function idbSetAll(storeName, items) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    store.clear();
    items.forEach((item) => store.put(item));
    transaction.oncomplete = () => resolve(items);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function idbDelete(storeName, id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    transaction.objectStore(storeName).delete(id);
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = () => reject(transaction.error);
  });
}

const localKey = (storeName) => `financas:${storeName}`;

function localAll(storeName) {
  const raw = localStorage.getItem(localKey(storeName));
  return raw ? JSON.parse(raw) : [];
}

function localSetAll(storeName, items) {
  localStorage.setItem(localKey(storeName), JSON.stringify(items));
  return items;
}

function localPut(storeName, item) {
  const items = localAll(storeName).filter((current) => current.id !== item.id);
  items.push(item);
  return localSetAll(storeName, items);
}

function localDelete(storeName, id) {
  const items = localAll(storeName).filter((item) => item.id !== id);
  localSetAll(storeName, items);
  return true;
}

async function getAll(storeName) {
  try {
    return await idbAll(storeName);
  } catch {
    return localAll(storeName);
  }
}

async function saveItem(storeName, item) {
  const record = { ...item, id: item.id || crypto.randomUUID(), updatedAt: new Date().toISOString() };
  try {
    await idbPut(storeName, record);
  } catch {
    localPut(storeName, record);
  }
  return record;
}

async function setAll(storeName, items) {
  try {
    return await idbSetAll(storeName, items);
  } catch {
    return localSetAll(storeName, items);
  }
}

async function deleteItem(storeName, id) {
  try {
    return await idbDelete(storeName, id);
  } catch {
    return localDelete(storeName, id);
  }
}

export const getExpenses = () => getAll("expenses");
export const saveExpense = (expense) => saveItem("expenses", expense);
export const saveExpenses = async (expenses) => {
  const saved = [];
  for (const expense of expenses) {
    saved.push(await saveExpense(expense));
  }
  return saved;
};
export const getIncomes = () => getAll("incomes");
export const saveIncome = (income) => saveItem("incomes", income);

export async function getCategories() {
  const categories = await getAll("categories");
  if (categories.length) return categories;
  await setAll("categories", defaultCategories);
  return defaultCategories;
}

export const saveCategory = (category) => saveItem("categories", category);
export const getPeople = () => getAll("people");
export const savePerson = (person) => saveItem("people", person);
export const getCards = () => getAll("cards");
export const saveCard = (card) => saveItem("cards", card);
export const getFixedExpenses = () => getAll("fixedExpenses");
export const saveFixedExpense = (fixedExpense) => saveItem("fixedExpenses", fixedExpense);
export const getPendingImports = () => getAll("pendingImports");
export const savePendingImport = (item) => saveItem("pendingImports", item);
export const removeRecord = (storeName, id) => deleteItem(storeName, id);

export async function replaceExpenseGroup(installmentGroupId, newExpenses) {
  const current = await getExpenses();
  const keep = current.filter((expense) => expense.installmentGroupId !== installmentGroupId);
  await setAll("expenses", keep);
  return saveExpenses(newExpenses);
}

export async function removeExpenseGroup(installmentGroupId) {
  const current = await getExpenses();
  const keep = current.filter((expense) => expense.installmentGroupId !== installmentGroupId);
  await setAll("expenses", keep);
  return true;
}

export async function exportAllData() {
  const data = {};
  for (const store of STORES) data[store] = await getAll(store);
  return { versao: 1, exportadoEm: new Date().toISOString(), dados: data };
}

export async function importAllData(fileData) {
  const payload = fileData?.dados ? fileData.dados : fileData;
  for (const store of STORES) {
    await setAll(store, Array.isArray(payload?.[store]) ? payload[store] : []);
  }
  return true;
}
