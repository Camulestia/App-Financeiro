import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CardInvoiceSummary from "../components/CardInvoiceSummary";
import EmptyState from "../components/EmptyState";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getMonthKey, getMonthlySummary } from "../utils/installmentUtils";

export default function DashboardPageV2() {
  const { expenses, incomes, categories, cards } = useFinance();
  const currentMonthKey = getMonthKey(new Date().toISOString());
  const summaries = getMonthlySummary(expenses, incomes, cards);
  const current = summaries.find((item) => item.monthKey === currentMonthKey) || {
    totalReceitas: 0,
    totalGastos: 0,
    saldo: 0,
    expenses: [],
  };
  const chartData = summaries.slice(-8).map((summary) => ({
    mes: summary.label,
    Receitas: summary.totalReceitas,
    Gastos: summary.totalGastos,
    Saldo: summary.saldo,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Receitas" value={current.totalReceitas} tone="good" />
        <SummaryCard label="Gastos" value={current.totalGastos} tone="bad" />
        <SummaryCard label="Saldo" value={current.saldo} tone={current.saldo >= 0 ? "good" : "bad"} />
      </div>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos por mês</h2>
        {chartData.length ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="Receitas" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gastos" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="Cadastre receitas e gastos para ver o resumo." />
        )}
      </section>

      <CardInvoiceSummary expenses={expenses} cards={cards} monthKey={currentMonthKey} />

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Parcelas do mês atual</h2>
        {current.expenses.filter((expense) => expense.isInstallment).length ? (
          <div className="space-y-3">
            {current.expenses.filter((expense) => expense.isInstallment).map((expense) => {
              const category = categories.find((item) => item.id === expense.categoria);
              return (
                <div key={expense.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{expense.descricao}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(expense.purchaseDate || expense.data)} · {category?.nome || "Outros"}
                    </p>
                  </div>
                  <strong className="text-rose-600">{formatCurrency(expense.valor)}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Nenhuma parcela no mês atual." />
        )}
      </section>
    </div>
  );
}
