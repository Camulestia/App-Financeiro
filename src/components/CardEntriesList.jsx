import EmptyState from "./EmptyState";
import { formatCurrency, formatDate } from "../utils/formatters";

export default function CardEntriesList({ entries, categories, people }) {
  if (!entries.length) {
    return <EmptyState text="Nenhum lançamento encontrado para este cartão neste mês" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="text-slate-500 dark:text-slate-400">
          <tr>
            <th className="py-2">Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Categoria</th>
            <th>Pessoa</th>
            <th>Parcela</th>
            <th>Fixo</th>
            <th>Importado</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const category = categories.find((item) => item.id === entry.categoria);
            const person = people.find((item) => item.id === entry.pessoa);
            return (
              <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-3 font-semibold text-slate-900 dark:text-white">{entry.descricao}</td>
                <td className="font-semibold text-rose-600">{formatCurrency(entry.valor)}</td>
                <td>{formatDate(entry.purchaseDate || entry.data)}</td>
                <td>{category?.nome || "Outros"}</td>
                <td>{person?.nome || "Sem pessoa"}</td>
                <td>{entry.isInstallment ? `${entry.installmentIndex}/${entry.installmentCount}` : "-"}</td>
                <td>{entry.fixedExpenseId || entry.isFixed ? "Sim" : "Não"}</td>
                <td>{entry.imported || entry.importId ? "Sim" : "Não"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
