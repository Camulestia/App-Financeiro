import SummaryCard from "./SummaryCard";

export default function CardMonthlySummary({ overview }) {
  return (
    <section className="card p-4">
      <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Resumo das faturas</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Total geral" value={overview.totalAmount} tone="neutral" />
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Cartões com lançamentos</p>
          <strong className="mt-2 block text-2xl text-slate-950 dark:text-white">{overview.cardsWithEntries}</strong>
        </div>
        <div className="card p-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">Parcelas do mês</p>
          <strong className="mt-2 block text-2xl text-slate-950 dark:text-white">{overview.totalInstallments}</strong>
        </div>
      </div>
    </section>
  );
}
