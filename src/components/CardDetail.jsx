import CardEntriesList from "./CardEntriesList";
import SummaryCard from "./SummaryCard";
import { useMonth } from "../context/MonthContext";
import { getCardMonthlySummary } from "../services/financeLogic";

export default function CardDetail({ cardId, expenses, fixedExpenses = [], cards, categories, people, onClose }) {
  const { selectedMonth, selectedMonthLabel, previousMonth, nextMonth } = useMonth();
  const summary = getCardMonthlySummary(cardId, selectedMonth, expenses, cards, fixedExpenses);

  if (!summary.card) return null;

  return (
    <section className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950 dark:text-white">Detalhes do cartão</h2>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">{summary.card.nome}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Mês selecionado: {selectedMonthLabel}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Fechamento: dia {summary.card.fechamento}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={previousMonth}>
              Mês anterior
            </button>
            <button className="btn-secondary" type="button" onClick={nextMonth}>
              Próximo mês
            </button>
            <button className="btn-secondary" type="button" onClick={onClose}>
              Voltar para cartões
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total da fatura" value={summary.total} tone="neutral" />
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Lançamentos</p>
          <strong className="mt-2 block text-2xl text-slate-950 dark:text-white">{summary.entryCount}</strong>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Parcelas na fatura</p>
          <strong className="mt-2 block text-2xl text-slate-950 dark:text-white">{summary.installmentCount}</strong>
        </div>
      </div>

      <section className="card p-4">
        <h3 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Lançamentos da fatura</h3>
        <CardEntriesList entries={summary.entries} categories={categories} people={people} />
      </section>
    </section>
  );
}
