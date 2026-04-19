import { defaultCategories } from "../utils/defaultCategories";
import {
  deleteSQLiteRecord,
  getSQLiteRecords,
  initializeSQLite,
  isSQLiteAvailable,
  replaceSQLiteRecords,
  saveSQLiteRecord,
} from "./sqliteService";
import * as storageService from "./storageService";

const STORES = ["expenses", "incomes", "categories", "people", "cards", "fixedExpenses"];
const SQLITE_STORES = ["people", "cards", "incomes", "fixedExpenses", "expenses"];
const STORE_GETTERS = {
  expenses: storageService.getExpenses,
  incomes: storageService.getIncomes,
  categories: storageService.getCategories,
  people: storageService.getPeople,
  cards: storageService.getCards,
  fixedExpenses: storageService.getFixedExpenses,
};
const SETTINGS = [
  { key: "selectedMonth", localStorageKey: "financas:mesSelecionado" },
  { key: "theme", localStorageKey: "financas:tema" },
];

let providerPromise = null;
const sqliteSeedPromises = {};

function createRecord(item) {
  return {
    ...item,
    id: item.id || crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
}

async function getProvider() {
  if (!providerPromise) {
    providerPromise = initializeSQLite()
      .then((status) => (status.available ? "sqlite" : "legacy"))
      .catch(() => "legacy");
  }
  return providerPromise;
}

async function shouldUseSQLite() {
  const provider = await getProvider();
  if (provider !== "sqlite") return false;
  return isSQLiteAvailable();
}

async function shouldUseSQLiteStore(storeName) {
  return SQLITE_STORES.includes(storeName) && (await shouldUseSQLite());
}

async function seedSQLiteStoreFromLegacyIfNeeded(storeName) {
  if (!(await shouldUseSQLiteStore(storeName))) return;
  if (!sqliteSeedPromises[storeName]) {
    sqliteSeedPromises[storeName] = (async () => {
      const sqliteItems = await getSQLiteRecords(storeName);
      if (sqliteItems.length) return;

      const legacyItems = await STORE_GETTERS[storeName]();
      if (legacyItems.length) await replaceSQLiteRecords(storeName, legacyItems);
    })().catch(() => null);
  }
  await sqliteSeedPromises[storeName];
}

async function mirrorLegacy(operation) {
  try {
    await operation();
  } catch {
    // O storage antigo fica como compatibilidade; falhas nele não devem bloquear o SQLite.
  }
}

async function replaceLegacyStore(storeName, items) {
  const data = {};
  for (const store of STORES) {
    data[store] = store === storeName ? items : await STORE_GETTERS[store]();
  }
  await storageService.importAllData({ dados: data });
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
  if (await shouldUseSQLiteStore(storeName)) {
    await seedSQLiteStoreFromLegacyIfNeeded(storeName);
    return getSQLiteRecords(storeName);
  }
  return STORE_GETTERS[storeName]();
}

async function setAll(storeName, items) {
  if (await shouldUseSQLiteStore(storeName)) {
    await replaceSQLiteRecords(storeName, items);
    await mirrorLegacy(() => replaceLegacyStore(storeName, items));
    return items;
  }
  await replaceLegacyStore(storeName, items);
  return items;
}

async function saveItem(storeName, item, legacySave) {
  const record = createRecord(item);

  if (await shouldUseSQLiteStore(storeName)) {
    await seedSQLiteStoreFromLegacyIfNeeded(storeName);
    await saveSQLiteRecord(storeName, record);
    await mirrorLegacy(() => legacySave(record));
    return record;
  }
  return legacySave(record);
}

async function deleteItem(storeName, id) {
  if (await shouldUseSQLiteStore(storeName)) {
    await seedSQLiteStoreFromLegacyIfNeeded(storeName);
    await deleteSQLiteRecord(storeName, id);
    await mirrorLegacy(() => storageService.removeRecord(storeName, id));
    return true;
  }
  return storageService.removeRecord(storeName, id);
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

export const saveExpense = (expense) => saveItem("expenses", expense, storageService.saveExpense);
export const updateExpense = saveExpense;
export const deleteExpense = (id) => deleteItem("expenses", id);
export const saveIncome = (income) => saveItem("incomes", income, storageService.saveIncome);
export const saveCard = (card) => saveItem("cards", card, storageService.saveCard);
export const saveCategory = (category) => saveItem("categories", category, storageService.saveCategory);
export const saveFixedExpense = (fixedExpense) =>
  saveItem("fixedExpenses", fixedExpense, storageService.saveFixedExpense);
export const updateFixedExpense = saveFixedExpense;
export const deleteFixedExpense = (id) => deleteItem("fixedExpenses", id);

export async function saveExpenses(expenses) {
  if (await shouldUseSQLiteStore("expenses")) {
    await seedSQLiteStoreFromLegacyIfNeeded("expenses");
    const records = expenses.map(createRecord);
    const current = await getSQLiteRecords("expenses");
    await replaceSQLiteRecords("expenses", [...current, ...records]);
    await mirrorLegacy(() => storageService.saveExpenses(records));
    return records;
  }

  const saved = [];
  for (const expense of expenses) saved.push(await saveExpense(expense));
  return saved;
}

export async function savePerson(person) {
  if (!person.isDefault) return saveItem("people", person, storageService.savePerson);

  const people = await getPeople();
  const saved = createRecord({ ...person, isDefault: true });
  const updated = people
    .filter((current) => current.id !== saved.id)
    .map((current) => ({ ...current, isDefault: false }));
  const nextPeople = [...updated, saved];

  if (await shouldUseSQLiteStore("people")) {
    await seedSQLiteStoreFromLegacyIfNeeded("people");
    await replaceSQLiteRecords("people", nextPeople);
    await mirrorLegacy(() => replaceLegacyStore("people", nextPeople));
    return saved;
  }

  return storageService.savePerson(saved);
}

export async function setDefaultPerson(personId) {
  const updated = (await getPeople()).map((person) => ({
    ...person,
    isDefault: person.id === personId,
    updatedAt: new Date().toISOString(),
  }));

  if (await shouldUseSQLiteStore("people")) {
    await seedSQLiteStoreFromLegacyIfNeeded("people");
    await replaceSQLiteRecords("people", updated);
    await mirrorLegacy(() => replaceLegacyStore("people", updated));
    return updated;
  }

  return storageService.setDefaultPerson(personId);
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
    origem: (await shouldUseSQLite()) ? "sqlite" : "storage",
    dados: data,
    configuracoes: getAppSettings(),
  };
}

export async function importAllData(fileData) {
  const { data, settings } = normalizeBackupPayload(fileData);

  if (await shouldUseSQLite()) {
    for (const store of SQLITE_STORES) {
      await replaceSQLiteRecords(store, data[store]);
    }
    await storageService.importAllData({ dados: data });
    restoreAppSettings(settings);
    return true;
  }

  await storageService.importAllData({ dados: data });
  restoreAppSettings(settings);
  return true;
}
