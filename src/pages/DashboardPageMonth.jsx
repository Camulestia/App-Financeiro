import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import CardInvoiceSummary from "../components/CardInvoiceSummary";
import EmptyState from "../components/EmptyState";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getMonthKey, getMonthlySummary } from "../utils/installmentUtils";

function getPersonSummary(people, expenses, incomes, selectedMonth) {
  return people.map((person) => {
    const monthlyExpenses = expenses.filter((expense) => expense.pessoa === person.id);
    const monthlyRefunds = incomes.filter(
      (income) => income.tipo === "Reembolso" && getMonthKey(income.data) === selectedMonth && income.pessoa === person.id,
    );
    const totalGastos = monthlyExpenses.reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
    const totalReembolsos = monthlyRefunds.reduce((sum, income) => sum + Number(income.valor || 0), 0);
    return {
      person,
      expenses: monthlyExpenses,
      refunds: monthlyRefunds,
      totalGastos,
      totalReembolsos,
      saldo: totalReembolsos - totalGastos,
    };
  });
}

export default function DashboardPageMonth() {
  const { expenses, incomes, categories, cards, people } = useFinance();
  const { selectedMonth, selectedMonthLabel } = useMonth();
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const summaries = getMonthlySummary(expenses, incomes, cards);
  const current = summaries.find((item) => item.monthKey === selectedMonth) || {
    totalReceitas: 0,
    totalGastos: 0,
    saldo: 0,
    expenses: [],
    incomes: [],
  };
  const personSummary = getPersonSummary(people, current.expenses, incomes, selectedMonth);
  const selectedPerson = personSummary.find((item) => item.person.id === selectedPersonId);
  const chartData = [
    {
      mes: selectedMonthLabel,
      Receitas: current.totalReceitas,
      Gastos: current.totalGastos,
      Saldo: current.saldo,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Receitas" value={current.totalReceitas} tone="good" />
        <SummaryCard label="Gastos" value={current.totalGastos} tone="bad" />
        <SummaryCard label="Saldo" value={current.saldo} tone={current.saldo >= 0 ? "good" : "bad"} />
      </div>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos por mês</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => formatCurrency(value).replace(",00", "")} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="Receitas" fill="#059669" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos" fill="#e11d48" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Saldo" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Resumo por pessoa</h2>
        {personSummary.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {personSummary.map((item) => (
              <div key={item.person.id} className="rounded-md bg-slate-50 p-4 dark:bg-slate-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-bold text-slate-950 dark:text-white">{item.person.nome}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gastos do mês: {formatCurrency(item.totalGastos)}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Reembolsos do mês: {formatCurrency(item.totalReembolsos)}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Saldo: {formatCurrency(item.saldo)}</p>
                  </div>
                  <button className="btn-secondary" type="button" onClick={() => setSelectedPersonId(item.person.id)}>
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Nenhuma pessoa cadastrada." />
        )}
      </section>

      {selectedPerson ? (
        <section className="card p-4">
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Detalhes de {selectedPerson.person.nome}</h2>
          {selectedPerson.expenses.length ? (
            <div className="space-y-3">
              {selectedPerson.expenses.map((expense) => {
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
            <EmptyState text="Nenhum gasto desta pessoa no mês selecionado." />
          )}
        </section>
      ) : null}

      <CardInvoiceSummary expenses={expenses} cards={cards} monthKey={selectedMonth} />

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Parcelas do mês selecionado</h2>
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
          <EmptyState text="Nenhuma parcela no mês selecionado." />
        )}
      </section>
    </div>
  );
}
