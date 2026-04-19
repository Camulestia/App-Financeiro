import { useMonth } from "../context/MonthContext";

export default function MonthSelector() {
  const { selectedMonth, setSelectedMonth, previousMonth, nextMonth } = useMonth();

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="space-y-1">
        <span className="label">Mês</span>
        <span className="block text-xs text-slate-500 dark:text-slate-400">Selecionar mês</span>
        <input
          aria-label="Selecionar mês"
          className="input w-44"
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
        />
      </label>
      <button className="btn-secondary" type="button" onClick={previousMonth}>
        Mês anterior
      </button>
      <button className="btn-secondary" type="button" onClick={nextMonth}>
        Próximo mês
      </button>
    </div>
  );
}
