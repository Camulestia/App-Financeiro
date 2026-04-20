import { createContext, useContext, useEffect, useState } from "react";
import {
  exportAllData,
  getCards,
  getCategories,
  getExpenses,
  getFixedExpenses,
  getIncomes,
  getPeople,
  importAllData,
  removeExpenseGroup,
  removeRecord,
  replaceExpenseGroup,
  saveCard,
  saveExpense,
  saveExpenses,
  saveFixedExpense,
  saveIncome,
  savePerson,
  setDefaultPerson,
} from "../services/dataService";
import { generateInstallmentSchedule, normalizeExpenseForBilling } from "../utils/installmentUtils";

const FinanceContext = createContext(null);

const isDuplicateExpense = (items, candidate) =>
  items.some(
    (item) =>
      item.descricao.trim().toLowerCase() === candidate.descricao.trim().toLowerCase() &&
      Number(item.valor) === Number(candidate.valor) &&
      item.data === candidate.data,
  );

export function FinanceProvider({ children }) {
  const [state, setState] = useState({
    expenses: [],
    incomes: [],
    categories: [],
    people: [],
    cards: [],
    fixedExpenses: [],
  });
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [expenses, incomes, categories, people, cards, fixedExpenses] = await Promise.all([
      getExpenses(),
      getIncomes(),
      getCategories(),
      getPeople(),
      getCards(),
      getFixedExpenses(),
    ]);
    setState({ expenses, incomes, categories, people, cards, fixedExpenses });
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addExpense(expense) {
    const card = state.cards.find((item) => item.id === expense.cartao);
    const normalized = normalizeExpenseForBilling(expense, card ? [card] : []);
    if (isDuplicateExpense(state.expenses, normalized)) throw new Error("Gasto duplicado detectado");
    await saveExpense(normalized);
    await refresh();
  }

  async function updateExpense(expense) {
    const card = state.cards.find((item) => item.id === expense.cartao);
    const expenseForRecalculation = { ...expense };
    delete expenseForRecalculation.billingMonthKey;
    await saveExpense(normalizeExpenseForBilling(expenseForRecalculation, card ? [card] : []));
    await refresh();
  }

  async function addInstallmentGroup(form) {
    const card = state.cards.find((item) => item.id === form.cartao);
    const schedule = generateInstallmentSchedule(form, card);
    await saveExpenses(schedule);
    await refresh();
  }

  async function updateInstallmentGroup(installmentGroupId, form) {
    const group = state.expenses
      .filter((expense) => expense.installmentGroupId === installmentGroupId)
      .sort((a, b) => a.installmentIndex - b.installmentIndex);
    const card = state.cards.find((item) => item.id === form.cartao);
    const schedule = generateInstallmentSchedule(
      {
        ...form,
        installmentGroupId,
        existingIds: group.map((expense) => expense.id),
      },
      card,
    );
    await replaceExpenseGroup(installmentGroupId, schedule);
    await refresh();
  }

  const value = {
      ...state,
      loading,
      refresh,
      addExpense,
      updateExpense,
      addInstallmentGroup,
      updateInstallmentGroup,
      addIncome: async (income) => {
        await saveIncome(income);
        await refresh();
      },
      addPerson: async (person) => {
        await savePerson({ ...person, isDefault: Boolean(person.isDefault) });
        await refresh();
      },
      setDefaultPerson: async (personId) => {
        await setDefaultPerson(personId);
        await refresh();
      },
      addCard: async (card) => {
        await saveCard(card);
        await refresh();
      },
      addFixedExpense: async (fixedExpense) => {
        await saveFixedExpense(fixedExpense);
        await refresh();
      },
      removeExpense: async (id) => {
        await removeRecord("expenses", id);
        await refresh();
      },
      removeInstallmentGroup: async (installmentGroupId) => {
        await removeExpenseGroup(installmentGroupId);
        await refresh();
      },
      removeIncome: async (id) => {
        await removeRecord("incomes", id);
        await refresh();
      },
      removePerson: async (id) => {
        await removeRecord("people", id);
        await refresh();
      },
      removeCard: async (id) => {
        await removeRecord("cards", id);
        await refresh();
      },
      removeFixedExpense: async (id) => {
        await removeRecord("fixedExpenses", id);
        await refresh();
      },
      exportAllData,
      restoreData: async (payload) => {
        await importAllData(payload);
        await refresh();
      },
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance deve ser usado dentro de FinanceProvider");
  return context;
}
