import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import PersonDetail from "../components/PersonDetail";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { formatCurrency } from "../utils/formatters";
import { getExpenseBillingMonth, getMonthKey } from "../utils/installmentUtils";

export default function PeoplePageDetailed({ selectedPersonIdFromDashboard, clearSelectedPersonFromDashboard }) {
  const { people, expenses, incomes, cards, categories, addPerson, removePerson, setDefaultPerson } = useFinance();
  const { selectedMonth } = useMonth();
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");

  useEffect(() => {
    if (selectedPersonIdFromDashboard) {
      setSelectedPersonId(selectedPersonIdFromDashboard);
      clearSelectedPersonFromDashboard?.();
    }
  }, [selectedPersonIdFromDashboard, clearSelectedPersonFromDashboard]);

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

  const selectedPerson = people.find((person) => person.id === selectedPersonId);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="card space-y-4 p-4" onSubmit={submit}>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Nova pessoa</h2>
          <FormField label="Nome" error={error}>
            <input className="input" placeholder="Nome da pessoa" value={nome} onChange={(e) => setNome(e.target.value)} />
          </FormField>
          <button className="btn-primary w-full" type="submit">Salvar pessoa</button>
        </form>

        <section className="card p-4">
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Pessoas</h2>
          {people.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {people.map((person) => {
                const totalGastos = expenses
                  .filter((expense) => expense.pessoa === person.id && getExpenseBillingMonth(expense, cards) === selectedMonth)
                  .reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
                const totalReembolsos = incomes
                  .filter((income) => income.pessoa === person.id && income.tipo === "Reembolso" && getMonthKey(income.data) === selectedMonth)
                  .reduce((sum, income) => sum + Number(income.valor || 0), 0);
                const saldo = totalReembolsos - totalGastos;
                return (
                  <div
                    key={person.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedPersonId(person.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") setSelectedPersonId(person.id);
                    }}
                    className={`cursor-pointer rounded-md border p-4 transition ${
                      selectedPersonId === person.id
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                        : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-950 dark:text-white">{person.nome}</p>
                        {person.isDefault ? (
                          <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                            Padrão
                          </span>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <p>Gastos do mês: {formatCurrency(totalGastos)}</p>
                        <p>Reembolsos: {formatCurrency(totalReembolsos)}</p>
                        <p className="font-semibold text-slate-900 dark:text-white">Saldo: {formatCurrency(saldo)}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn-primary" type="button" onClick={() => setSelectedPersonId(person.id)}>
                          Ver detalhes
                        </button>
                        {!person.isDefault ? (
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDefaultPerson(person.id);
                            }}
                          >
                            Definir como padrão
                          </button>
                        ) : null}
                        <button
                          className="btn-danger"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removePerson(person.id);
                          }}
                        >
                          Remover
                        </button>
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

      <PersonDetail
        person={selectedPerson}
        expenses={expenses}
        incomes={incomes}
        categories={categories}
        cards={cards}
        onClose={() => setSelectedPersonId("")}
      />
    </div>
  );
}
