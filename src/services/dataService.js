import { defaultCategories } from "../utils/defaultCategories";
import {
  deleteSQLiteRecord,
  getSQLiteRecords,
  initializeSQLite,
  isSQLiteAvailable,
  replaceSQLiteRecords,
  saveSQLiteRecord,
} from "./sqliteService";

const STORES = ["expenses", "incomes", "categories", "people", "cards", "fixedExpenses"];
const SETTINGS = [
  { key: "selectedMonth", localStorageKey: "financas:mesSelecionado" },
  { key: "theme", localStorageKey: "financas:tema" },
];
const memoryData = Object.fromEntries(STORES.map((store) => [store, []]));

let sqliteReadyPromise = null;

function createRecord(item) {
  return {
    ...item,
    id: item.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
}

async function shouldUseSQLite() {
  if (!sqliteReadyPromise) {
    sqliteReadyPromise = initializeSQLite()
      .then((status) => Boolean(status.available))
      .catch(() => false);
  }
  return (await sqliteReadyPromise) && (await isSQLiteAvailable());
}


function getAppSettings() {
  if (typeof localStorage === "undefined") return {};
  return SETTINGS.reduce((settings, item) => {
    const value = localStorage.getItem(item.localStorageKey);
    return value ? { ...settings, [item.key]: value } : settings;
  }, {});
}

function restoreAppSettings(settings = {}) {
  if (typeof localStorage === "undefined" || !settings || typeof settings !== "object") return;
  SETTINGS.forEach((item) => {
    if (typeof settings[item.key] === "string") localStorage.setItem(item.localStorageKey, settings[item.key]);
  });
}

function normalizeBackupPayload(fileData) {
  if (!fileData || typeof fileData !== "object") throw new Error("Arquivo inválido");
  const payload = fileData.dados && typeof fileData.dados === "object" ? fileData.dados : fileData;
  const hasKnownStore = STORES.some((store) => Array.isArray(payload?.[store]));
  if (!hasKnownStore) throw new Error("Arquivo inválido");

  const normalized = {};
  for (const store of STORES) {
    if (payload?.[store] === undefined) normalized[store] = [];
    else if (Array.isArray(payload[store])) normalized[store] = payload[store];
    else throw new Error("Arquivo inválido");
  }

  return {
    data: normalized,
    settings: fileData.configuracoes || fileData.settings || payload.configuracoes || payload.settings || {},
  };
}

async function getAll(storeName) {
  if (await shouldUseSQLite()) return getSQLiteRecords(storeName);
  return memoryData[storeName] || [];
}

async function setAll(storeName, items) {
  if (await shouldUseSQLite()) return replaceSQLiteRecords(storeName, items);
  memoryData[storeName] = items;
  return items;
}

async function saveItem(storeName, item) {
  const record = createRecord(item);
  if (await shouldUseSQLite()) return saveSQLiteRecord(storeName, record);
  const items = memoryData[storeName].filter((current) => current.id !== record.id);
  memoryData[storeName] = [...items, record];
  return record;
}

async function deleteItem(storeName, id) {
  if (await shouldUseSQLite()) return deleteSQLiteRecord(storeName, id);
  memoryData[storeName] = memoryData[storeName].filter((item) => item.id !== id);
  return true;
}

export const getExpenses = () => getAll("expenses");
export const getIncomes = () => getAll("incomes");
export const getPeople = () => getAll("people");
export const getCards = () => getAll("cards");
export const getFixedExpenses = () => getAll("fixedExpenses");

export async function getCategories() {
  const categories = await getAll("categories");
  if (categories.length) return categories;
  await setAll("categories", defaultCategories);
  return defaultCategories;
}

export const saveExpense = (expense) => saveItem("expenses", expense);
export const updateExpense = saveExpense;
export const deleteExpense = (id) => deleteItem("expenses", id);
export const saveIncome = (income) => saveItem("incomes", income);
export const saveCard = (card) => saveItem("cards", card);
export const saveCategory = (category) => saveItem("categories", category);
export const saveFixedExpense = (fixedExpense) => saveItem("fixedExpenses", fixedExpense);
export const updateFixedExpense = saveFixedExpense;
export const deleteFixedExpense = (id) => deleteItem("fixedExpenses", id);

export async function saveExpenses(expenses) {
  const records = expenses.map(createRecord);
  const current = await getExpenses();
  await setAll("expenses", [...current, ...records]);
  return records;
}

export async function savePerson(person) {
  if (!person.isDefault) return saveItem("people", person);

  const people = await getPeople();
  const saved = createRecord({ ...person, isDefault: true });
  const updated = people
    .filter((current) => current.id !== saved.id)
    .map((current) => ({ ...current, isDefault: false }));
  const nextPeople = [...updated, saved];

  await setAll("people", nextPeople);
  return saved;
}

export async function setDefaultPerson(personId) {
  const updated = (await getPeople()).map((person) => ({
    ...person,
    isDefault: person.id === personId,
    updatedAt: new Date().toISOString(),
  }));

  await setAll("people", updated);
  return updated;
}

export async function getPersonById(personId) {
  const people = await getPeople();
  return people.find((person) => person.id === personId) || null;
}

export const removeRecord = (storeName, id) => deleteItem(storeName, id);

export const deleteIncome = (id) => deleteItem("incomes", id);
export const getReimbursements = async () => {
  const incomes = await getIncomes();
  return incomes.filter((income) => income.tipo === "Reembolso");
};
export const saveReimbursement = (reimbursement) =>
  saveIncome({ ...reimbursement, tipo: "Reembolso" });
export const deleteReimbursement = deleteIncome;

export async function replaceExpenseGroup(installmentGroupId, newExpenses) {
  const current = await getExpenses();
  const keep = current.filter((expense) => expense.installmentGroupId !== installmentGroupId);
  const nextExpenses = [...keep, ...newExpenses.map(createRecord)];
  await setAll("expenses", nextExpenses);
  return nextExpenses.filter((expense) => expense.installmentGroupId === installmentGroupId);
}

export async function removeExpenseGroup(installmentGroupId) {
  const keep = (await getExpenses()).filter((expense) => expense.installmentGroupId !== installmentGroupId);
  await setAll("expenses", keep);
  return true;
}

export async function exportAllData() {
  const data = {};
  for (const store of STORES) data[store] = await getAll(store);
  return {
    versao: 2,
    exportadoEm: new Date().toISOString(),
    origem: (await shouldUseSQLite()) ? "sqlite" : "memoria",
    dados: data,
    configuracoes: getAppSettings(),
  };
}

export async function importAllData(fileData) {
  const { data, settings } = normalizeBackupPayload(fileData);

  for (const store of STORES) await setAll(store, data[store]);
  restoreAppSettings(settings);
  return true;
}
