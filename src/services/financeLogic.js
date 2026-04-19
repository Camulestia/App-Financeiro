export {
  addMonthsToDate,
  addMonthsToMonthKey,
  generateInstallmentSchedule,
  getBillingMonthFromCardClosing,
  getCardInvoiceSummaries,
  getExpenseBillingMonth,
  getMonthKey,
  getMonthLabel,
  getMonthlySummary,
  getUpcomingInstallments,
  normalizeExpenseForBilling,
} from "../utils/installmentUtils";

import { getExpenseBillingMonth, getMonthKey } from "../utils/installmentUtils";

export function getPersonMonthlySummary(personId, monthKey, expenses = [], incomes = [], cards = []) {
  const personExpenses = expenses.filter(
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

export function getPeopleMonthlySummary(monthKey, people = [], expenses = [], incomes = [], cards = []) {
  return people.map((person) => ({
    person,
    ...getPersonMonthlySummary(person.id, monthKey, expenses, incomes, cards),
  }));
}

export function getCardMonthlyInvoiceSummary(monthKey, expenses = [], cards = []) {
  return cards
    .map((card) => {
      const entries = expenses.filter(
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

export function getCardsMonthlyOverview(monthKey, expenses = [], cards = []) {
  const invoices = getCardMonthlyInvoiceSummary(monthKey, expenses, cards);
  return {
    invoices,
    totalAmount: invoices.reduce((sum, invoice) => sum + invoice.total, 0),
    cardsWithEntries: invoices.length,
    totalInstallments: invoices.reduce((sum, invoice) => sum + invoice.installmentCount, 0),
  };
}

export function getCardMonthlyEntries(cardId, monthKey, expenses = [], cards = []) {
  return expenses
    .filter((expense) => expense.cartao === cardId && getExpenseBillingMonth(expense, cards) === monthKey)
    .sort((a, b) => String(a.purchaseDate || a.data).localeCompare(String(b.purchaseDate || b.data)));
}

export function getCardMonthlySummary(cardId, monthKey, expenses = [], cards = []) {
  const card = cards.find((item) => item.id === cardId);
  const entries = getCardMonthlyEntries(cardId, monthKey, expenses, cards);
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
