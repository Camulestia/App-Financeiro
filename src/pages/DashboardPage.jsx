import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/EmptyState";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate, monthName } from "../utils/formatters";

export default function DashboardPage() {
  const { expenses, incomes, categories } = useFinance();
  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const totalIncomes = incomes.reduce((sum, item) => sum + Number(item.valor || 0), 0);
  const balance = totalIncomes - totalExpenses;
  const recentExpenses = [...expenses].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 5);
  const chartData = [...new Set([...expenses, ...incomes].map((item) => item.data))]
    .sort()
    .slice(-8)
    .map((date) => ({
      data: monthName(date),
      Receitas: incomes.filter((item) => item.data === date).reduce((sum, item) => sum + Number(item.valor || 0), 0),
      Gastos: expenses.filter((item) => item.data === date).reduce((sum, item) => sum + Number(item.valor || 0), 0),
      dataOriginal: date,
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Receitas" value={totalIncomes} tone="good" />
        <SummaryCard label="Gastos" value={totalExpenses} tone="bad" />
        <SummaryCard label="Saldo" value={balance} tone={balance >= 0 ? "good" : "bad"} />
      </div>
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Resumo do período</h2>
        {chartData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
                <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(_, items) => formatDate(items?.[0]?.payload?.dataOriginal)} />
                <Bar dataKey="Receitas" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Cadastre receitas e gastos para ver o resumo." />
        )}
      </section>
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Últimos gastos</h2>
        {recentExpenses.length ? (
          <div className="space-y-3">
            {recentExpenses.map((expense) => {
              const category = categories.find((item) => item.id === expense.categoria);
              return (
                <div key={expense.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{expense.descricao}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(expense.data)} · {category?.nome || "Outros"}
                    </p>
                  </div>
                  <strong className="text-rose-600">{formatCurrency(expense.valor)}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Nenhum gasto cadastrado." />
        )}
      </section>
    </div>
  );
}
