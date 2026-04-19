import EmptyState from "./EmptyState";
import SummaryCard from "./SummaryCard";
import { useMonth } from "../context/MonthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getExpenseBillingMonth, getMonthKey } from "../utils/installmentUtils";

export default function PersonDetail({ person, expenses, incomes, categories, cards, onClose }) {
  const { selectedMonth, selectedMonthLabel, previousMonth, nextMonth } = useMonth();

  if (!person) {
    return (
      <section className="card p-4">
        <EmptyState text="Selecione uma pessoa para ver os detalhes." />
      </section>
    );
  }

  const monthExpenses = expenses.filter(
    (expense) => expense.pessoa === person.id && getExpenseBillingMonth(expense, cards) === selectedMonth,
  );
  const monthRefunds = incomes.filter(
    (income) => income.pessoa === person.id && income.tipo === "Reembolso" && getMonthKey(income.data) === selectedMonth,
  );
  const totalExpenses = monthExpenses.reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
  const totalRefunds = monthRefunds.reduce((sum, income) => sum + Number(income.valor || 0), 0);
  const balance = totalRefunds - totalExpenses;

  return (
    <section className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">{person.nome}</h2>
              {person.isDefault ? (
                <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                  Padrão
                </span>
              ) : null}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{selectedMonthLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={previousMonth}>
              Mês anterior
            </button>
            <button className="btn-secondary" type="button" onClick={nextMonth}>
              Próximo mês
            </button>
            {onClose ? (
              <button className="btn-secondary" type="button" onClick={onClose}>
                Voltar
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Gastos do mês" value={totalExpenses} tone="bad" />
        <SummaryCard label="Reembolsos do mês" value={totalRefunds} tone="good" />
        <SummaryCard label="Saldo da pessoa" value={balance} tone={balance >= 0 ? "good" : "bad"} />
      </div>

      <section className="card p-4">
        <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos</h3>
        {monthExpenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Descrição</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Categoria</th>
                  <th>Cartão</th>
                  <th>Parcela</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((expense) => {
                  const category = categories.find((item) => item.id === expense.categoria);
                  const card = cards.find((item) => item.id === expense.cartao);
                  return (
                    <tr key={expense.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{expense.descricao}</td>
                      <td className="font-semibold text-rose-600">{formatCurrency(expense.valor)}</td>
                      <td>{formatDate(expense.purchaseDate || expense.data)}</td>
                      <td>{category?.nome || "Outros"}</td>
                      <td>{card?.nome || "Sem cartão"}</td>
                      <td>{expense.isInstallment ? `${expense.installmentIndex}/${expense.installmentCount}` : "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Nenhum gasto desta pessoa no mês selecionado." />
        )}
      </section>

      <section className="card p-4">
        <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Reembolsos</h3>
        {monthRefunds.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Descrição</th>
                  <th>Valor</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {monthRefunds.map((income) => (
                  <tr key={income.id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{income.descricao}</td>
                    <td className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(income.valor)}</td>
                    <td>{formatDate(income.data)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Nenhum reembolso desta pessoa no mês selecionado." />
        )}
      </section>
    </section>
  );
}
