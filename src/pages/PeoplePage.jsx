import { useState } from "react";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";

export default function PeoplePage() {
  const { people, addPerson, removePerson } = useFinance();
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
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Pessoas cadastradas</h2>
        {people.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {people.map((person) => (
              <div key={person.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white">{person.nome}</span>
                <button className="btn-danger" type="button" onClick={() => removePerson(person.id)}>Remover</button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Nenhuma pessoa cadastrada." />
        )}
      </section>
    </div>
  );
}
