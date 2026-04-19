import { useEffect, useState } from "react";
import CurrencyInput from "../components/CurrencyInput";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getMonthKey } from "../utils/installmentUtils";

export default function IncomesPageMonth() {
  const { incomes, people, addIncome, removeIncome } = useFinance();
  const { selectedMonth } = useMonth();
  const defaultPersonId = people.find((person) => person.isDefault)?.id || "";
  const [form, setForm] = useState({ descricao: "", valor: 0, data: `${selectedMonth}-01`, tipo: "Pessoal", pessoa: "" });
  const [errors, setErrors] = useState({});
  const monthIncomes = incomes.filter((income) => getMonthKey(income.data) === selectedMonth).sort((a, b) => b.data.localeCompare(a.data));

  useEffect(() => {
    setForm((current) => ({
      ...current,
      data: current.data?.startsWith(selectedMonth) ? current.data : `${selectedMonth}-01`,
      pessoa: current.pessoa || (current.tipo === "Pessoal" ? defaultPersonId : ""),
    }));
  }, [selectedMonth, defaultPersonId]);

  function changeType(tipo) {
    setForm((current) => ({
      ...current,
      tipo,
      pessoa: tipo === "Pessoal" ? current.pessoa || defaultPersonId : "",
    }));
  }

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.descricao.trim()) next.descricao = "Campo obrigatório";
    if (!form.valor || form.valor <= 0) next.valor = "Valor inválido";
    if (!form.data) next.data = "Data inválida";
    if (form.tipo === "Reembolso" && !form.pessoa) next.pessoa = "Selecione uma pessoa para o reembolso";
    setErrors(next);
    if (Object.keys(next).length) return;
    await addIncome(form);
    setForm({ descricao: "", valor: 0, data: `${selectedMonth}-01`, tipo: "Pessoal", pessoa: defaultPersonId });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form className="card space-y-4 p-4" onSubmit={submit}>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Nova receita</h2>
        <FormField label="Descrição" error={errors.descricao}>
          <input className="input" placeholder="Ex: Salário" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </FormField>
        <FormField label="Valor" error={errors.valor}>
          <CurrencyInput value={form.valor} onChange={(valor) => setForm({ ...form, valor })} placeholder="R$ 0,00" />
        </FormField>
        <FormField label="Data" error={errors.data}>
          <input className="input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </FormField>
        <FormField label="Tipo">
          <select className="input" value={form.tipo} onChange={(e) => changeType(e.target.value)}>
            <option>Pessoal</option>
            <option>Reembolso</option>
          </select>
        </FormField>
        <FormField label="Pessoa" error={errors.pessoa}>
          <select className="input" value={form.pessoa} onChange={(e) => setForm({ ...form, pessoa: e.target.value })}>
            <option value="">Selecione uma pessoa</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome}
              </option>
            ))}
          </select>
        </FormField>
        <button className="btn-primary w-full" type="submit">Salvar receita</button>
      </form>

      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Receitas do mês</h2>
        {monthIncomes.length ? (
          <div className="space-y-3">
            {monthIncomes.map((income) => {
              const person = people.find((item) => item.id === income.pessoa);
              return (
                <div key={income.id} className="flex flex-col gap-3 rounded-md bg-slate-50 p-3 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{income.descricao}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(income.data)} · {income.tipo} · {person?.nome || "Sem pessoa"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong className="text-emerald-700 dark:text-emerald-300">{formatCurrency(income.valor)}</strong>
                    <button className="btn-danger" type="button" onClick={() => removeIncome(income.id)}>Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Nenhuma receita no mês selecionado." />
        )}
      </section>
    </div>
  );
}
