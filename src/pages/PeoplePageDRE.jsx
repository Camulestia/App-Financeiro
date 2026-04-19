import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import PersonDetailDRE from "../components/PersonDetailDRE";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { getPeopleMonthlySummary } from "../services/financeLogic";
import { formatCurrency } from "../utils/formatters";

export default function PeoplePageDRE({ selectedPersonIdFromDashboard, clearSelectedPersonFromDashboard }) {
  const { people, expenses, incomes, cards, categories, fixedExpenses, addPerson, removePerson, setDefaultPerson } = useFinance();
  const { selectedMonth } = useMonth();
  const [nome, setNome] = useState("");
  const [error, setError] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [detailMode, setDetailMode] = useState("detalhes");

  useEffect(() => {
    if (selectedPersonIdFromDashboard) {
      setSelectedPersonId(selectedPersonIdFromDashboard);
      setDetailMode("detalhes");
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

  const peopleSummary = getPeopleMonthlySummary(selectedMonth, people, expenses, incomes, cards, fixedExpenses);
  const selectedPerson = people.find((person) => person.id === selectedPersonId);

  function openPerson(personId, mode) {
    setSelectedPersonId(personId);
    setDetailMode(mode);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="card space-y-4 p-4" onSubmit={submit}>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Nova pessoa</h2>
          <FormField label="Nome" error={error}>
            <input className="input" placeholder="Nome da pessoa" value={nome} onChange={(event) => setNome(event.target.value)} />
          </FormField>
          <button className="btn-primary w-full" type="submit">Salvar pessoa</button>
        </form>

        <section className="card p-4">
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Pessoas</h2>
          {peopleSummary.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {peopleSummary.map((summary) => (
                <div
                  key={summary.person.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPerson(summary.person.id, "detalhes")}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") openPerson(summary.person.id, "detalhes");
                  }}
                  className={`cursor-pointer rounded-md border p-4 transition ${
                    selectedPersonId === summary.person.id
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                      : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950 dark:text-white">{summary.person.nome}</p>
                      {summary.person.isDefault ? (
                        <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                          Padrão
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                      <p>Total de gastos do mês: {formatCurrency(summary.totalExpenses)}</p>
                      <p>Total de reembolsos do mês: {formatCurrency(summary.totalReimbursements)}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">Saldo do mês: {formatCurrency(summary.balance)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPerson(summary.person.id, "resumo");
                        }}
                      >
                        Ver resumo
                      </button>
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openPerson(summary.person.id, "detalhes");
                        }}
                      >
                        Ver detalhes
                      </button>
                      {!summary.person.isDefault ? (
                        <button
                          className="btn-secondary"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDefaultPerson(summary.person.id);
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
                          removePerson(summary.person.id);
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhum dado encontrado neste mês" />
          )}
        </section>
      </div>

      <PersonDetailDRE
        person={selectedPerson}
        expenses={expenses}
        incomes={incomes}
        categories={categories}
        cards={cards}
        fixedExpenses={fixedExpenses}
        mode={detailMode}
        onClose={() => setSelectedPersonId("")}
      />
    </div>
  );
}
