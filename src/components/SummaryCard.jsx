import { formatCurrency } from "../utils/formatters";

export default function SummaryCard({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "border-slate-200 dark:border-slate-700",
    good: "border-emerald-200 dark:border-emerald-800",
    bad: "border-rose-200 dark:border-rose-800",
  };

  return (
    <div className={`card p-4 ${tones[tone]}`}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <strong className="mt-2 block text-2xl text-slate-950 dark:text-white">{formatCurrency(value)}</strong>
    </div>
  );
}
