export {
  addMonthsToDate,
  addMonthsToMonthKey,
  generateInstallmentSchedule,
  getBillingMonthFromCardClosing,
  getCardInvoiceSummaries,
  getExpenseBillingMonth,
  getFixedExpensesForMonth,
  getMonthKey,
  getMonthLabel,
  getMonthlySummary,
  getUpcomingInstallments,
  normalizeExpenseForBilling,
} from "../utils/installmentUtils";

import { getExpenseBillingMonth, getFixedExpensesForMonth, getMonthKey } from "../utils/installmentUtils";

function getExpensesWithFixedForMonth(expenses = [], fixedExpenses = [], cards = [], monthKey) {
  const monthExpenses = expenses.filter((expense) => getExpenseBillingMonth(expense, cards) === monthKey);
  const existingFixedIds = new Set(
    monthExpenses
      .filter((expense) => expense.isFixed || expense.fixedExpenseId)
      .map((expense) => expense.fixedExpenseId || expense.id),
  );
  const fixedEntries = getFixedExpensesForMonth(fixedExpenses, monthKey, cards).filter(
    (expense) => !existingFixedIds.has(expense.fixedExpenseId),
  );
  return [...monthExpenses, ...fixedEntries];
}

export function getPersonMonthlySummary(personId, monthKey, expenses = [], incomes = [], cards = [], fixedExpenses = []) {
  const personExpenses = getExpensesWithFixedForMonth(expenses, fixedExpenses, cards, monthKey).filter(
    (expense) => expense.pessoa === personId && getExpenseBillingMonth(expense, cards) === monthKey,
  );
  const personReimbursements = incomes.filter(
    (income) => income.pessoa === personId && income.tipo === "Reembolso" && getMonthKey(income.data) === monthKey,
  );
  const totalExpenses = personExpenses.reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
  const totalReimbursements = personReimbursements.reduce((sum, income) => sum + Number(income.valor || 0), 0);
  const totalInstallments = personExpenses
    .filter((expense) => expense.isInstallment)
    .reduce((sum, expense) => sum + Number(expense.valor || 0), 0);

  return {
    personId,
    expenses: personExpenses,
    reimbursements: personReimbursements,
    totalExpenses,
    totalReimbursements,
    totalInstallments,
    balance: totalReimbursements - totalExpenses,
  };
}

export function getPeopleMonthlySummary(monthKey, people = [], expenses = [], incomes = [], cards = [], fixedExpenses = []) {
  return people.map((person) => ({
    person,
    ...getPersonMonthlySummary(person.id, monthKey, expenses, incomes, cards, fixedExpenses),
  }));
}

export function getCardMonthlyInvoiceSummary(monthKey, expenses = [], cards = [], fixedExpenses = []) {
  const monthExpenses = getExpensesWithFixedForMonth(expenses, fixedExpenses, cards, monthKey);
  return cards
    .map((card) => {
      const entries = monthExpenses.filter(
        (expense) => expense.cartao === card.id && getExpenseBillingMonth(expense, cards) === monthKey,
      );
      const total = entries.reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
      const installmentCount = entries.filter((expense) => expense.isInstallment).length;

      return {
        card,
        entries,
        total,
        entryCount: entries.length,
        installmentCount,
      };
    })
    .filter((summary) => summary.entryCount > 0);
}

export function getCardsMonthlyOverview(monthKey, expenses = [], cards = [], fixedExpenses = []) {
  const invoices = getCardMonthlyInvoiceSummary(monthKey, expenses, cards, fixedExpenses);
  return {
    invoices,
    totalAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    cardsWithEntries: invoices.length,
    totalInstallments: invoices.reduce((sum, invoice) => sum + invoice.installmentCount, 0),
  };
}

export function getCardMonthlyEntries(cardId, monthKey, expenses = [], cards = [], fixedExpenses = []) {
  return getExpensesWithFixedForMonth(expenses, fixedExpenses, cards, monthKey)
    .filter((expense) => expense.cartao === cardId && getExpenseBillingMonth(expense, cards) === monthKey)
    .sort((a, b) => String(a.purchaseDate || a.data).localeCompare(String(b.purchaseDate || b.data)));
}

export function getCardMonthlySummary(cardId, monthKey, expenses = [], cards = [], fixedExpenses = []) {
  const card = cards.find((item) => item.id === cardId);
  const entries = getCardMonthlyEntries(cardId, monthKey, expenses, cards, fixedExpenses);
  const total = entries.reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
  const installmentCount = entries.filter((expense) => expense.isInstallment).length;

  return {
    card,
    entries,
    total,
    entryCount: entries.length,
    installmentCount,
  };
}
