export function getMonthKey(dateValue) {
  if (!dateValue) return new Date().toISOString().slice(0, 7);
  return String(dateValue).slice(0, 7);
}

export function addMonthsToMonthKey(monthKey, amount) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + amount, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonthsToDate(dateValue, amount) {
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const date = new Date(year, month - 1 + amount, day || 1);
  return date.toISOString().slice(0, 10);
}

export function getMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getBillingMonthFromCardClosing(purchaseDate, closingDay) {
  const baseMonth = getMonthKey(purchaseDate);
  const day = Number(String(purchaseDate).slice(8, 10));
  const closing = Number(closingDay || 31);
  return day > closing ? addMonthsToMonthKey(baseMonth, 1) : baseMonth;
}

function roundCurrency(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function getExpenseBillingMonth(expense, cards = []) {
  if (expense.billingMonthKey) return expense.billingMonthKey;
  const card = cards.find((item) => item.id === expense.cartao);
  if (card) return getBillingMonthFromCardClosing(expense.purchaseDate || expense.data, card.fechamento);
  return getMonthKey(expense.data);
}

export function normalizeExpenseForBilling(expense, cards = []) {
  const purchaseDate = expense.purchaseDate || expense.data;
  return {
    ...expense,
    isInstallment: Boolean(expense.isInstallment),
    purchaseDate,
    billingMonthKey: expense.billingMonthKey || getExpenseBillingMonth({ ...expense, purchaseDate }, cards),
  };
}

export function generateInstallmentSchedule(form, card) {
  const installmentCount = Number(form.installmentCount || form.quantidadeParcelas || 0);
  const startDate = form.startDate || form.dataInicial;
  const totalAmount =
    form.installmentMode === "installmentAmount"
      ? roundCurrency(Number(form.installmentAmount || 0) * installmentCount)
      : roundCurrency(form.totalAmount);
  const installmentAmount =
    form.installmentMode === "installmentAmount"
      ? roundCurrency(form.installmentAmount)
      : roundCurrency(totalAmount / installmentCount);
  const firstBillingMonth = card
    ? getBillingMonthFromCardClosing(startDate, card.fechamento)
    : getMonthKey(startDate);
  const installmentGroupId = form.installmentGroupId || crypto.randomUUID();

  return Array.from({ length: installmentCount }, (_, index) => {
    const installmentIndex = index + 1;
    const billingMonthKey = addMonthsToMonthKey(firstBillingMonth, index);
    return {
      id: form.existingIds?.[index] || crypto.randomUUID(),
      descricao: `${form.descricao.trim()} (${installmentIndex}/${installmentCount})`,
      descricaoBase: form.descricao.trim(),
      valor: installmentAmount,
      data: addMonthsToDate(startDate, index),
      categoria: form.categoria,
      pessoa: form.pessoa || "",
      cartao: form.cartao || "",
      isInstallment: true,
      installmentGroupId,
      installmentIndex,
      installmentCount,
      installmentAmount,
      totalAmount,
      startDate,
      billingMonthKey,
      purchaseDate: startDate,
    };
  });
}

export function getUpcomingInstallments(expenses, cards = [], fromMonthKey = getMonthKey(new Date().toISOString())) {
  return expenses
    .map((expense) => normalizeExpenseForBilling(expense, cards))
    .filter((expense) => expense.isInstallment && expense.billingMonthKey > fromMonthKey)
    .sort((a, b) => a.billingMonthKey.localeCompare(b.billingMonthKey) || a.installmentIndex - b.installmentIndex);
}

export function getCardInvoiceSummaries(expenses, cards = [], monthKey) {
  return cards
    .map((card) => {
      const entries = expenses
        .map((expense) => normalizeExpenseForBilling(expense, cards))
        .filter((expense) => expense.cartao === card.id && expense.billingMonthKey === monthKey);
      return {
        card,
        entries,
        total: entries.reduce((sum, item) => sum + Number(item.valor || 0), 0),
        entryCount: entries.length,
        installmentCount: entries.filter((item) => item.isInstallment).length,
      };
    })
    .filter((summary) => summary.entryCount > 0);
}

export function getMonthlySummary(expenses, incomes, cards = [], filters = {}) {
  const normalizedExpenses = expenses.map((expense) => normalizeExpenseForBilling(expense, cards));
  const allMonths = new Set([
    ...normalizedExpenses.map((expense) => expense.billingMonthKey),
    ...incomes.map((income) => getMonthKey(income.data)),
  ]);

  return [...allMonths]
    .sort()
    .map((monthKey) => {
      const monthExpenses = normalizedExpenses.filter((expense) => expense.billingMonthKey === monthKey);
      const monthIncomes = incomes.filter((income) => getMonthKey(income.data) === monthKey);
      const filteredExpenses = monthExpenses.filter((expense) => {
        if (filters.pessoa && expense.pessoa !== filters.pessoa) return false;
        if (filters.categoria && expense.categoria !== filters.categoria) return false;
        if (filters.cartao && expense.cartao !== filters.cartao) return false;
        return true;
      });
      const filteredIncomes = filters.pessoa || filters.categoria || filters.cartao ? [] : monthIncomes;
      const totalReceitas = filteredIncomes.reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const totalReembolsos = filteredIncomes
        .filter((item) => item.tipo === "Reembolso")
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const totalGastos = filteredExpenses.reduce((sum, item) => sum + Number(item.valor || 0), 0);
      const totalParcelados = filteredExpenses
        .filter((item) => item.isInstallment)
        .reduce((sum, item) => sum + Number(item.valor || 0), 0);

      return {
        monthKey,
        label: getMonthLabel(monthKey),
        incomes: filteredIncomes,
        expenses: filteredExpenses,
        totalReceitas,
        totalGastos,
        totalReembolsos,
        totalParcelados,
        saldo: totalReceitas - totalGastos,
        invoices: getCardInvoiceSummaries(filteredExpenses, cards, monthKey),
      };
    });
}
