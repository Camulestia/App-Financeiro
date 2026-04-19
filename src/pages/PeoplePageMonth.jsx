import { useState } from "react";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { formatCurrency } from "../utils/formatters";
import { getExpenseBillingMonth, getMonthKey } from "../utils/installmentUtils";

export default function PeoplePageMonth() {
  const { people, expenses, incomes, cards, addPerson, removePerson, setDefaultPerson } = useFinance();
  const { selectedMonth } = useMonth();
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (!nome.trim()) {
      setError("Campo obrigatório");
      return;
    }
    await addPerson({ nome });
    setNome("");
    setError("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form className="card space-y-4 p-4" onSubmit={submit}>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Nova pessoa</h2>
        <FormField label="Nome" error={error}>
          <input className="input" placeholder="Nome da pessoa" value={nome} onChange={(e) => setNome(e.target.value)} />
        </FormField>
        <button className="btn-primary w-full" type="submit">Salvar pessoa</button>
      </form>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Resumo por pessoa no mês</h2>
        {people.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {people.map((person) => {
              const totalGastos = expenses
                .filter((expense) => expense.pessoa === person.id && getExpenseBillingMonth(expense, cards) === selectedMonth)
                .reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
              const totalReembolsos = incomes
                .filter((income) => income.pessoa === person.id && income.tipo === "Reembolso" && getMonthKey(income.data) === selectedMonth)
                .reduce((sum, income) => sum + Number(income.valor || 0), 0);
              return (
                <div key={person.id} className="rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white">{person.nome}</p>
                        {person.isDefault ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                            Padrão
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Gastos do mês: {formatCurrency(totalGastos)}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Reembolsos do mês: {formatCurrency(totalReembolsos)}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Saldo: {formatCurrency(totalReembolsos - totalGastos)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!person.isDefault ? (
                        <button className="btn-secondary" type="button" onClick={() => setDefaultPerson(person.id)}>
                          Definir como padrão
                        </button>
                      ) : null}
                      <button className="btn-danger" type="button" onClick={() => removePerson(person.id)}>Remover</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Nenhuma pessoa cadastrada." />
        )}
      </section>
    </div>
  );
}
