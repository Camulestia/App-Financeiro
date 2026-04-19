import { useMemo, useState } from "react";
import CardInvoiceSummary from "../components/CardInvoiceSummary";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getMonthKey, getMonthlySummary } from "../utils/installmentUtils";

export default function MonthsPage() {
  const { expenses, incomes, categories, people, cards, fixedExpenses } = useFinance();
  const [filters, setFilters] = useState({ ano: "", pessoa: "", categoria: "", cartao: "" });
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey(new Date().toISOString()));
  const summaries = useMemo(
    () =>
      getMonthlySummary(expenses, incomes, cards, fixedExpenses, {
        monthKey: selectedMonth,
        pessoa: filters.pessoa,
        categoria: filters.categoria,
        cartao: filters.cartao,
      }).filter((summary) => !filters.ano || summary.monthKey.startsWith(filters.ano)),
    [expenses, incomes, cards, fixedExpenses, filters, selectedMonth],
  );
  const selected = summaries.find((summary) => summary.monthKey === selectedMonth) || summaries[summaries.length - 1];
  const years = [
    ...new Set([
      ...expenses.map((item) => getMonthKey(item.billingMonthKey || item.data).slice(0, 4)),
      ...incomes.map((item) => getMonthKey(item.data).slice(0, 4)),
    ]),
  ].sort();

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Filtros</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <FormField label="Ano">
            <select className="input" value={filters.ano} onChange={(e) => setFilters({ ...filters, ano: e.target.value })}>
              <option value="">Todos</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </FormField>
          <FormField label="Pessoa">
            <select className="input" value={filters.pessoa} onChange={(e) => setFilters({ ...filters, pessoa: e.target.value })}>
              <option value="">Todos</option>
              {people.map((person) => <option key={person.id} value={person.id}>{person.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Categoria">
            <select className="input" value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
              <option value="">Todos</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Cartão">
            <select className="input" value={filters.cartao} onChange={(e) => setFilters({ ...filters, cartao: e.target.value })}>
              <option value="">Todos</option>
              {cards.map((card) => <option key={card.id} value={card.id}>{card.nome}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Resumo por mês</h2>
        {summaries.length ? (
          <div className="grid gap-3 lg:grid-cols-3">
            {summaries.map((summary) => (
              <button
                key={summary.monthKey}
                className={`rounded-md border p-4 text-left transition ${
                  selected?.monthKey === summary.monthKey
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                    : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
                }`}
                type="button"
                onClick={() => setSelectedMonth(summary.monthKey)}
              >
                <p className="font-bold text-slate-950 dark:text-white">{summary.label}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Receitas: {formatCurrency(summary.totalReceitas)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Gastos: {formatCurrency(summary.totalGastos)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Parcelamentos: {formatCurrency(summary.totalParcelados)}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Saldo do mês: {formatCurrency(summary.saldo)}</p>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState text="Nenhum mês encontrado." />
        )}
      </section>

      {selected ? (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard label="Receitas" value={selected.totalReceitas} tone="good" />
            <SummaryCard label="Gastos" value={selected.totalGastos} tone="bad" />
            <SummaryCard label="Reembolsos" value={selected.totalReembolsos} tone="good" />
            <SummaryCard label="Saldo do mês" value={selected.saldo} tone={selected.saldo >= 0 ? "good" : "bad"} />
          </div>

          <section className="card p-4">
            <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Detalhamento do mês selecionado</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Receitas</h3>
                {selected.incomes.length ? selected.incomes.map((income) => (
                  <p key={income.id} className="text-sm text-slate-600 dark:text-slate-300">{formatDate(income.data)} · {income.descricao} · {formatCurrency(income.valor)}</p>
                )) : <p className="text-sm text-slate-500">Nenhuma receita no mês.</p>}
              </div>
              <div>
                <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Gastos</h3>
                {selected.expenses.length ? selected.expenses.map((expense) => (
                  <p key={expense.id} className="text-sm text-slate-600 dark:text-slate-300">{expense.descricao} · {formatCurrency(expense.valor)}</p>
                )) : <p className="text-sm text-slate-500">Nenhum gasto no mês.</p>}
              </div>
              <div>
                <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Parcelamentos do mês</h3>
                {selected.expenses.filter((expense) => expense.isInstallment).length ? selected.expenses.filter((expense) => expense.isInstallment).map((expense) => (
                  <p key={expense.id} className="text-sm text-slate-600 dark:text-slate-300">{expense.descricao} · {formatCurrency(expense.valor)}</p>
                )) : <p className="text-sm text-slate-500">Nenhum parcelamento no mês.</p>}
              </div>
              <div>
                <h3 className="mb-2 font-bold text-slate-900 dark:text-white">Gastos fixos do mês</h3>
                {fixedExpenses.length ? fixedExpenses.map((expense) => (
                  <p key={expense.id} className="text-sm text-slate-600 dark:text-slate-300">{expense.descricao} · {formatCurrency(expense.valor)}</p>
                )) : <p className="text-sm text-slate-500">Nenhum gasto fixo cadastrado.</p>}
              </div>
            </div>
          </section>
          <CardInvoiceSummary expenses={expenses} fixedExpenses={fixedExpenses} cards={cards} monthKey={selected.monthKey} />
        </section>
      ) : null}
    </div>
  );
}
