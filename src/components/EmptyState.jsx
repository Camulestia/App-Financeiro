export default function EmptyState({ text = "Nenhum registro encontrado." }) {
  return <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">{text}</div>;
}
