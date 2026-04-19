import EmptyState from "./EmptyState";
import SummaryCard from "./SummaryCard";
import { useMonth } from "../context/MonthContext";
import { getPersonMonthlySummary } from "../services/financeLogic";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function PersonDetailDRE({ person, expenses, incomes, categories, cards, mode = "detalhes", onClose }) {
  const { selectedMonth, selectedMonthLabel, previousMonth, nextMonth } = useMonth();

  if (!person) {
    return (
      <section className="card p-4">
        <EmptyState text="Nenhum dado encontrado neste mês" />
      </section>
    );
  }

  const summary = getPersonMonthlySummary(person.id, selectedMonth, expenses, incomes, cards);
  const categoryTotals = categories
    .map((category) => ({
      category,
      total: summary.expenses
        .filter((expense) => expense.categoria === category.id)
        .reduce((sum, expense) => sum + Number(expense.valor || 0), 0),
    }))
    .filter((item) => item.total > 0);

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
            <p className="text-sm text-slate-500 dark:text-slate-400">Mês selecionado: {selectedMonthLabel}</p>
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

      <section className="card p-4">
        <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Resumo mensal</h3>
        {summary.totalExpenses || summary.totalReimbursements ? (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <SummaryCard label="Total de gastos" value={summary.totalExpenses} tone="bad" />
              <SummaryCard label="Total de reembolsos" value={summary.totalReimbursements} tone="good" />
              <SummaryCard label="Saldo final" value={summary.balance} tone={summary.balance >= 0 ? "good" : "bad"} />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total em parcelamentos</p>
                <strong className="text-slate-950 dark:text-white">{formatCurrency(summary.totalInstallments)}</strong>
              </div>
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total por categoria</p>
                {categoryTotals.length ? (
                  <div className="mt-2 space-y-1">
                    {categoryTotals.map((item) => (
                      <p key={item.category.id} className="text-sm text-slate-700 dark:text-slate-200">
                        {item.category.nome}: {formatCurrency(item.total)}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Nenhum dado encontrado neste mês</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <EmptyState text="Nenhum dado encontrado neste mês" />
        )}
      </section>

      {mode === "resumo" ? null : (
        <>
          <section className="card p-4">
            <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos</h3>
            {summary.expenses.length ? (
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
                    {summary.expenses.map((expense) => {
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
              <EmptyState text="Nenhum dado encontrado neste mês" />
            )}
          </section>

          <section className="card p-4">
            <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Reembolsos</h3>
            {summary.reimbursements.length ? (
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
                    {summary.reimbursements.map((income) => (
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
              <EmptyState text="Nenhum dado encontrado neste mês" />
            )}
          </section>
        </>
      )}
    </section>
  );
}
