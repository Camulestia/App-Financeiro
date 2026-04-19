import { useState } from "react";
import CardInvoiceList from "../components/CardInvoiceList";
import CardDetail from "../components/CardDetail";
import CardMonthlySummary from "../components/CardMonthlySummary";
import EmptyState from "../components/EmptyState";
import FormField from "../components/FormField";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { getCardsMonthlyOverview } from "../services/financeLogic";

export default function CardsPageMonth() {
  const { cards, expenses, categories, people, addCard, removeCard } = useFinance();
  const { selectedMonth, selectedMonthLabel } = useMonth();
  const [form, setForm] = useState({ nome: "", fechamento: "" });
  const [errors, setErrors] = useState({});
  const [selectedCardId, setSelectedCardId] = useState("");
  const overview = getCardsMonthlyOverview(selectedMonth, expenses, cards);

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
      <section className="card p-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">Mês selecionado</p>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{selectedMonthLabel}</h2>
      </section>

      <CardMonthlySummary overview={overview} />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form className="card space-y-4 p-4" onSubmit={submit}>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Novo cartão</h2>
          <FormField label="Nome" error={errors.nome}>
            <input className="input" placeholder="Ex: Nubank" value={form.nome} onChange={(event) => setForm({ ...form, nome: event.target.value })} />
          </FormField>
          <FormField label="Data de fechamento" error={errors.fechamento}>
            <input
              className="input"
              type="number"
              min="1"
              max="31"
              placeholder="Dia do mês"
              value={form.fechamento}
              onChange={(event) => setForm({ ...form, fechamento: event.target.value })}
            />
          </FormField>
          <button className="btn-primary w-full" type="submit">Salvar cartão</button>
        </form>

        <section className="card p-4">
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Cartões cadastrados</h2>
          {cards.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {cards.map((card) => (
                <div
                  key={card.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCardId(card.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") setSelectedCardId(card.id);
                  }}
                  className={`cursor-pointer rounded-md border p-4 transition ${
                    selectedCardId === card.id
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                      : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{card.nome}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Fechamento: dia {card.fechamento}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        className="btn-secondary"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedCardId(card.id);
                        }}
                      >
                        Ver detalhes
                      </button>
                      <button
                        className="btn-danger"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          removeCard(card.id);
                          if (selectedCardId === card.id) setSelectedCardId("");
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
            <EmptyState text="Nenhum cartão cadastrado." />
          )}
        </section>
      </div>

      <CardInvoiceList invoices={overview.invoices} monthKey={selectedMonth} onOpenCard={setSelectedCardId} />

      {selectedCardId ? (
        <CardDetail
          cardId={selectedCardId}
          expenses={expenses}
          cards={cards}
          categories={categories}
          people={people}
          onClose={() => setSelectedCardId("")}
        />
      ) : null}
    </div>
  );
}
