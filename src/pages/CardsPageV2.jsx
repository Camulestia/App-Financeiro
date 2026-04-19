import { useState } from "react";
import CardInvoiceSummary from "../components/CardInvoiceSummary";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { getMonthKey } from "../utils/installmentUtils";

export default function CardsPageV2() {
  const { cards, expenses, addCard, removeCard } = useFinance();
  const [form, setForm] = useState({ nome: "", fechamento: "" });
  const [errors, setErrors] = useState({});
  const [monthKey, setMonthKey] = useState(getMonthKey(new Date().toISOString()));

  async function submit(event) {
    event.preventDefault();
    const next = {};
    if (!form.nome.trim()) next.nome = "Campo obrigatório";
    if (!form.fechamento) next.fechamento = "Campo obrigatório";
    setErrors(next);
    if (Object.keys(next).length) return;
    await addCard(form);
    setForm({ nome: "", fechamento: "" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="card space-y-4 p-4" onSubmit={submit}>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Novo cartão</h2>
          <FormField label="Nome" error={errors.nome}>
            <input className="input" placeholder="Ex: Nubank" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </FormField>
          <FormField label="Data de fechamento" error={errors.fechamento}>
            <input className="input" type="number" min="1" max="31" placeholder="Dia do mês" value={form.fechamento} onChange={(e) => setForm({ ...form, fechamento: e.target.value })} />
          </FormField>
          <button className="btn-primary w-full" type="submit">Salvar cartão</button>
        </form>
        <section className="card p-4">
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Cartões cadastrados</h2>
          {cards.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((card) => (
                <div key={card.id} className="rounded-md bg-slate-50 p-4 dark:bg-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{card.nome}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Fechamento: dia {card.fechamento}</p>
                    </div>
                    <button className="btn-danger" type="button" onClick={() => removeCard(card.id)}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhum cartão cadastrado." />
          )}
        </section>
      </div>
      <section className="card p-4">
        <FormField label="Mês da fatura">
          <input className="input max-w-xs" type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
        </FormField>
      </section>
      <CardInvoiceSummary expenses={expenses} cards={cards} monthKey={monthKey} />
    </div>
  );
}
