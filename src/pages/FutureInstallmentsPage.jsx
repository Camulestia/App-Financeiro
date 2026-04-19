import { useMemo, useState } from "react";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/formatters";
import { getMonthKey, getMonthLabel, getUpcomingInstallments } from "../utils/installmentUtils";

export default function FutureInstallmentsPage() {
  const { expenses, categories, people, cards } = useFinance();
  const [filters, setFilters] = useState({ mes: "", cartao: "", pessoa: "", categoria: "" });
  const baseUpcoming = useMemo(() => getUpcomingInstallments(expenses, cards, getMonthKey(new Date().toISOString())), [expenses, cards]);
  const installments = baseUpcoming.filter((item) => {
    if (filters.mes && item.billingMonthKey !== filters.mes) return false;
    if (filters.cartao && item.cartao !== filters.cartao) return false;
    if (filters.pessoa && item.pessoa !== filters.pessoa) return false;
    if (filters.categoria && item.categoria !== filters.categoria) return false;
    return true;
  });
  const availableMonths = [...new Set(baseUpcoming.map((item) => item.billingMonthKey))].sort();

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Parcelas futuras</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <FormField label="Mês">
            <select className="input" value={filters.mes} onChange={(e) => setFilters({ ...filters, mes: e.target.value })}>
              <option value="">Todos</option>
              {availableMonths.map((month) => <option key={month} value={month}>{getMonthLabel(month)}</option>)}
            </select>
          </FormField>
          <FormField label="Cartão">
            <select className="input" value={filters.cartao} onChange={(e) => setFilters({ ...filters, cartao: e.target.value })}>
              <option value="">Todos</option>
              {cards.map((card) => <option key={card.id} value={card.id}>{card.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Pessoa">
            <select className="input" value={filters.pessoa} onChange={(e) => setFilters({ ...filters, pessoa: e.target.value })}>
              <option value="">Todos</option>
              {people.map((person) => <option key={person.id} value={person.id}>{person.nome}</option>)}
            </select>
          </FormField>
          <FormField label="Categoria">
            <select className="input" value={filters.categoria} onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}>
              <option value="">Todos</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nome}</option>)}
            </select>
          </FormField>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Próximas parcelas</h2>
        {installments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2">Descrição</th>
                  <th>Parcela</th>
                  <th>Valor da parcela</th>
                  <th>Mês previsto</th>
                  <th>Cartão</th>
                  <th>Pessoa</th>
                  <th>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {installments.map((item) => {
                  const card = cards.find((cardItem) => cardItem.id === item.cartao);
                  const person = people.find((personItem) => personItem.id === item.pessoa);
                  const category = categories.find((categoryItem) => categoryItem.id === item.categoria);
                  return (
                    <tr key={item.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{item.descricao}</td>
                      <td>{item.installmentIndex}/{item.installmentCount}</td>
                      <td>{formatCurrency(item.installmentAmount || item.valor)}</td>
                      <td>{getMonthLabel(item.billingMonthKey)}</td>
                      <td>{card?.nome || "Sem cartão"}</td>
                      <td>{person?.nome || "Sem pessoa"}</td>
                      <td>{category?.nome || "Outros"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Nenhuma parcela futura encontrada." />
        )}
      </section>
    </div>
  );
}
