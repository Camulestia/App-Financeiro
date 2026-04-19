import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import EmptyState from "../components/EmptyState";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/formatters";

export default function ChartsPage() {
  const { expenses, incomes, categories, people } = useFinance();
  const byCategory = categories
    .map((category) => ({
      name: category.nome,
      value: expenses.filter((item) => item.categoria === category.id).reduce((sum, item) => sum + Number(item.valor || 0), 0),
      color: category.cor,
    }))
    .filter((item) => item.value > 0);
  const byPerson = people
    .map((person) => ({
      name: person.nome,
      Gastos: expenses.filter((item) => item.pessoa === person.id).reduce((sum, item) => sum + Number(item.valor || 0), 0),
    }))
    .filter((item) => item.Gastos > 0);
  const totals = [
    { name: "Receitas", value: incomes.reduce((sum, item) => sum + Number(item.valor || 0), 0), fill: "#059669" },
    { name: "Gastos", value: expenses.reduce((sum, item) => sum + Number(item.valor || 0), 0), fill: "#e11d48" },
  ];

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
          <EmptyState text="Nenhum gasto para agrupar por categoria." />
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
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Saldo</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={totals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {totals.map((item) => <Cell key={item.name} fill={item.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
