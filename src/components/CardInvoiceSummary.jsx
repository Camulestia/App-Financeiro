import { formatCurrency } from "../utils/formatters";
import { getCardInvoiceSummaries, getMonthLabel } from "../utils/installmentUtils";

export default function CardInvoiceSummary({ expenses, fixedExpenses = [], cards, monthKey, title = "Faturas do mês" }) {
  const summaries = getCardInvoiceSummaries(expenses, cards, monthKey, fixedExpenses);

  return (
    <section className="card p-4">
      <h2 className="mb-1 text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{getMonthLabel(monthKey)}</p>
      {summaries.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {summaries.map((summary) => (
            <div key={summary.card.id} className="rounded-md bg-slate-50 p-4 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">{summary.card.nome}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Fechamento: dia {summary.card.fechamento}</p>
                </div>
                <strong className="text-emerald-700 dark:text-emerald-300">{formatCurrency(summary.total)}</strong>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                <span>Total da fatura: {formatCurrency(summary.total)}</span>
                <span>Lançamentos: {summary.entryCount}</span>
                <span>Parcelas na fatura: {summary.installmentCount}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhuma fatura encontrada para este mês.
        </p>
      )}
    </section>
  );
}
