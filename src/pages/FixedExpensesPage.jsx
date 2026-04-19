import { useState } from "react";
import CurrencyInput from "../components/CurrencyInput";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/formatters";

export default function FixedExpensesPage() {
  const { fixedExpenses, people, cards, addFixedExpense, removeFixedExpense } = useFinance();
  const emptyForm = { descricao: "", valor: 0, frequencia: "Mensal", personId: "", cardId: "" };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState("");

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.descricao.trim()) next.descricao = "Descrição obrigatória";
    if (!form.valor || form.valor <= 0) next.valor = "Valor deve ser maior que zero";
    setErrors(next);
    if (Object.keys(next).length) return;
    await addFixedExpense({
      ...form,
      id: editingId || form.id,
      pessoa: form.personId,
      cartao: form.cardId,
    });
    setForm(emptyForm);
    setEditingId("");
  }

  function editFixedExpense(item) {
    setEditingId(item.id);
    setForm({
      ...emptyForm,
      ...item,
      personId: item.personId || item.pessoa || "",
      cardId: item.cardId || item.cartao || "",
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form className="card space-y-4 p-4" onSubmit={submit}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">
            {editingId ? "Editar gasto fixo" : "Novo gasto fixo"}
          </h2>
          {editingId ? (
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setEditingId("");
              }}
            >
              Cancelar
            </button>
          ) : null}
        </div>
        <FormField label="Descrição" error={errors.descricao}>
          <input className="input" placeholder="Ex: Aluguel" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </FormField>
        <FormField label="Valor" error={errors.valor}>
          <CurrencyInput value={form.valor} onChange={(valor) => setForm({ ...form, valor })} />
        </FormField>
        <FormField label="Frequência">
          <select className="input" value={form.frequencia} onChange={(e) => setForm({ ...form, frequencia: e.target.value })}>
            <option>Semanal</option>
            <option>Mensal</option>
            <option>Anual</option>
          </select>
        </FormField>
        <FormField label="Pessoa">
          <select className="input" value={form.personId} onChange={(e) => setForm({ ...form, personId: e.target.value })}>
            <option value="">Selecione uma pessoa</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Cartão">
          <select className="input" value={form.cardId} onChange={(e) => setForm({ ...form, cardId: e.target.value })}>
            <option value="">Selecione um cartão</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.nome}
              </option>
            ))}
          </select>
        </FormField>
        <button className="btn-primary w-full" type="submit">
          {editingId ? "Salvar alterações" : "Salvar fixo"}
        </button>
      </form>
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos fixos</h2>
        {fixedExpenses.length ? (
          <div className="space-y-3">
            {fixedExpenses.map((item) => {
              const person = people.find((personItem) => personItem.id === (item.personId || item.pessoa));
              const card = cards.find((cardItem) => cardItem.id === (item.cardId || item.cartao));

              return (
                <div key={item.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.descricao}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {item.frequencia}
                      {person ? ` - ${person.nome}` : ""}
                      {card ? ` - ${card.nome}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <strong>{formatCurrency(item.valor)}</strong>
                    <button className="btn-secondary" type="button" onClick={() => editFixedExpense(item)}>Editar</button>
                    <button className="btn-danger" type="button" onClick={() => removeFixedExpense(item.id)}>Remover</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState text="Nenhum gasto fixo cadastrado." />
        )}
      </section>
    </div>
  );
}
