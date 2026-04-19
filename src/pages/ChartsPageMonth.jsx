import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/EmptyState";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { formatCurrency } from "../utils/formatters";
import { getCardInvoiceSummaries, getMonthlySummary, getUpcomingInstallments } from "../utils/installmentUtils";

export default function ChartsPageMonth() {
  const { expenses, incomes, categories, people, cards } = useFinance();
  const { selectedMonth, selectedMonthLabel } = useMonth();
  const summaries = getMonthlySummary(expenses, incomes, cards);
  const current = summaries.find((summary) => summary.monthKey === selectedMonth);
  const currentExpenses = current?.expenses || [];
  const byCategory = categories
    .map((category) => ({
      name: category.nome,
      value: currentExpenses.filter((item) => item.categoria === category.id).reduce((sum, item) => sum + Number(item.valor || 0), 0),
      color: category.cor,
    }))
    .filter((item) => item.value > 0);
  const byPerson = people
    .map((person) => ({
      name: person.nome,
      Gastos: currentExpenses.filter((item) => item.pessoa === person.id).reduce((sum, item) => sum + Number(item.valor || 0), 0),
    }))
    .filter((item) => item.Gastos > 0);
  const monthlyData = [
    {
      name: selectedMonthLabel,
      "Gastos por mês": current?.totalGastos || 0,
      "Saldo por mês": current?.saldo || 0,
    },
  ];
  const invoices = getCardInvoiceSummaries(expenses, cards, selectedMonth).map((summary) => ({
    name: summary.card.nome,
    "Faturas por cartão": summary.total,
  }));
  const future = getUpcomingInstallments(expenses, cards, selectedMonth).slice(0, 8).map((item) => ({
    name: `${item.installmentIndex}/${item.installmentCount}`,
    "Parcelamentos futuros": Number(item.valor || 0),
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Por categoria</h2>
        {byCategory.length ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={105} label>
                  {byCategory.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Nenhum gasto para agrupar por categoria no mês selecionado." />
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Por pessoa</h2>
        {byPerson.length ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPerson}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="Gastos" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Associe gastos a pessoas para ver este gráfico." />
        )}
      </section>

      <section className="card p-4 xl:col-span-2">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos por mês e saldo por mês</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="Gastos por mês" fill="#e11d48" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saldo por mês" fill="#059669" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Faturas por cartão</h2>
        {invoices.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoices}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="Faturas por cartão" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Nenhuma fatura no mês selecionado." />
        )}
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Parcelamentos futuros</h2>
        {future.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={future}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="Parcelamentos futuros" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Nenhuma parcela futura encontrada." />
        )}
      </section>
    </div>
  );
}
