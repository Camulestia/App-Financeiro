import EmptyState from "./EmptyState";
import { formatCurrency } from "../utils/formatters";
import { getMonthLabel } from "../utils/installmentUtils";

export default function CardInvoiceList({ invoices, monthKey, onOpenCard }) {
  return (
    <section className="card p-4">
      <h2 className="mb-1 text-lg font-bold text-slate-950 dark:text-white">Faturas do mês</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{getMonthLabel(monthKey)}</p>
      {invoices.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2">Cartão</th>
                <th>Fechamento</th>
                <th>Total da fatura</th>
                <th>Lançamentos</th>
                <th>Parcelas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenCard?.(invoice.card.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onOpenCard?.(invoice.card.id);
                  }}
                  className="cursor-pointer border-t border-slate-200 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                >
                  <td className="py-3 font-semibold text-slate-900 dark:text-white">{invoice.card.nome}</td>
                  <td>Dia {invoice.card.fechamento}</td>
                  <td className="font-semibold text-emerald-700 dark:text-emerald-300">{formatCurrency(invoice.total)}</td>
                  <td>{invoice.entryCount}</td>
                  <td>{invoice.installmentCount}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenCard?.(invoice.card.id);
                      }}
                    >
                      Ver detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState text="Nenhuma fatura encontrada neste mês" />
      )}
    </section>
  );
}
