import { useState } from "react";
import CurrencyInput from "../components/CurrencyInput";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate, todayISO } from "../utils/formatters";

export default function ExpensesPage() {
  const { expenses, categories, people, cards, addExpense, removeExpense } = useFinance();
  const [form, setForm] = useState({ descricao: "", valor: 0, data: todayISO(), categoria: "", pessoa: "", cartao: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  function validate() {
    const next = {};
    if (!form.descricao.trim()) next.descricao = "Descrição obrigatória";
    if (!form.valor || form.valor <= 0) next.valor = "Valor deve ser maior que zero";
    if (!form.data) next.data = "Data inválida";
    if (!form.categoria) next.categoria = "Selecione uma categoria";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (!validate()) return;
    try {
      await addExpense(form);
      setForm({ descricao: "", valor: 0, data: todayISO(), categoria: "", pessoa: "", cartao: "" });
    } catch (error) {
      setMessage(error.message || "Este item já existe");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <form className="card space-y-4 p-4" onSubmit={submit}>
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Novo gasto</h2>
        <FormField label="Descrição" error={errors.descricao}>
          <input className="input" placeholder="Ex: Supermercado" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </FormField>
        <FormField label="Valor" error={errors.valor}>
          <CurrencyInput value={form.valor} onChange={(valor) => setForm({ ...form, valor })} placeholder="R$ 0,00" />
        </FormField>
        <FormField label="Data" error={errors.data}>
          <input className="input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </FormField>
        <FormField label="Categoria" error={errors.categoria}>
          <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.nome}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Pessoa">
          <select className="input" value={form.pessoa} onChange={(e) => setForm({ ...form, pessoa: e.target.value })}>
            <option value="">Selecione uma pessoa</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{person.nome}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Cartão">
          <select className="input" value={form.cartao} onChange={(e) => setForm({ ...form, cartao: e.target.value })}>
            <option value="">Selecione um cartão</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>{card.nome}</option>
            ))}
          </select>
        </FormField>
        {message ? <p className="text-sm font-semibold text-rose-600">{message}</p> : null}
        <button className="btn-primary w-full" type="submit">Salvar gasto</button>
      </form>
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos cadastrados</h2>
        {expenses.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-slate-500 dark:text-slate-400">
                <tr><th className="py-2">Descrição</th><th>Data</th><th>Categoria</th><th>Valor</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {[...expenses].sort((a, b) => b.data.localeCompare(a.data)).map((expense) => {
                  const category = categories.find((item) => item.id === expense.categoria);
                  return (
                    <tr key={expense.id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3 font-semibold text-slate-900 dark:text-white">{expense.descricao}</td>
                      <td>{formatDate(expense.data)}</td>
                      <td>{category?.nome || "Outros"}</td>
                      <td className="font-semibold text-rose-600">{formatCurrency(expense.valor)}</td>
                      <td><button className="btn-danger" type="button" onClick={() => removeExpense(expense.id)}>Remover</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Nenhum gasto cadastrado." />
        )}
      </section>
    </div>
  );
}
