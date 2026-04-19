import { useEffect, useState } from "react";
import CurrencyInput from "./CurrencyInput";
import FormField from "./FormField";
import { todayISO } from "../utils/formatters";

const emptyForm = {
  tipoLancamento: "unico",
  installmentMode: "totalAmount",
  descricao: "",
  valor: 0,
  totalAmount: 0,
  installmentAmount: 0,
  installmentCount: "",
  data: todayISO(),
  startDate: todayISO(),
  categoria: "",
  pessoa: "",
  cartao: "",
};

function getEmptyForm(defaultPersonId = "") {
  return {
    ...emptyForm,
    pessoa: defaultPersonId,
  };
}

function stripInstallmentLabel(description = "") {
  return description.replace(/\s\(\d+\/\d+\)$/, "");
}

export default function ExpenseForm({ categories, people, cards, onSubmit, initialExpense, editingScope, onCancel }) {
  const defaultPersonId = people.find((person) => person.isDefault)?.id || "";
  const [form, setForm] = useState(() => getEmptyForm(defaultPersonId));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initialExpense) {
      setForm(getEmptyForm(defaultPersonId));
      return;
    }

    if (initialExpense.isInstallment && editingScope === "group") {
      setForm({
        ...emptyForm,
        tipoLancamento: "parcelado",
        descricao: initialExpense.descricaoBase || stripInstallmentLabel(initialExpense.descricao),
        totalAmount: Number(initialExpense.totalAmount || initialExpense.valor || 0),
        installmentAmount: Number(initialExpense.installmentAmount || initialExpense.valor || 0),
        installmentCount: initialExpense.installmentCount || "",
        startDate: initialExpense.startDate || initialExpense.purchaseDate || initialExpense.data || todayISO(),
        categoria: initialExpense.categoria || "",
        pessoa: initialExpense.pessoa || "",
        cartao: initialExpense.cartao || "",
      });
      return;
    }

    setForm({
      ...emptyForm,
      tipoLancamento: "unico",
      descricao: initialExpense.descricao || "",
      valor: Number(initialExpense.valor || 0),
      data: initialExpense.data || initialExpense.purchaseDate || todayISO(),
      categoria: initialExpense.categoria || "",
      pessoa: initialExpense.pessoa || "",
      cartao: initialExpense.cartao || "",
    });
  }, [initialExpense, editingScope, defaultPersonId]);

  function validate() {
    const next = {};
    if (!form.descricao.trim()) next.descricao = "Descrição obrigatória";
    if (!form.categoria) next.categoria = "Selecione uma categoria";

    if (form.tipoLancamento === "unico") {
      if (!form.valor || form.valor <= 0) next.valor = "Valor deve ser maior que zero";
      if (!form.data) next.data = "Data inválida";
    } else {
      const count = Number(form.installmentCount);
      if (!form.startDate) next.startDate = "Data inicial obrigatória";
      if (!form.installmentCount) next.installmentCount = "Informe a quantidade de parcelas";
      if (count <= 1) next.installmentCount = "O número de parcelas deve ser maior que 1";
      if (form.installmentMode === "totalAmount" && (!form.totalAmount || form.totalAmount <= 0)) {
        next.totalAmount = "Informe o valor total";
      }
      if (form.installmentMode === "installmentAmount" && (!form.installmentAmount || form.installmentAmount <= 0)) {
        next.installmentAmount = "Informe o valor da parcela";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;

    if (form.tipoLancamento === "parcelado") {
      await onSubmit({
        descricao: form.descricao,
        installmentMode: form.installmentMode,
        totalAmount: form.totalAmount,
        installmentAmount: form.installmentAmount,
        installmentCount: Number(form.installmentCount),
        startDate: form.startDate,
        categoria: form.categoria,
        pessoa: form.pessoa,
        cartao: form.cartao,
      });
    } else {
      await onSubmit({
        ...initialExpense,
        descricao: form.descricao,
        valor: form.valor,
        data: form.data,
        purchaseDate: form.data,
        categoria: form.categoria,
        pessoa: form.pessoa,
        cartao: form.cartao,
      });
    }

    if (!initialExpense) setForm(getEmptyForm(defaultPersonId));
  }

  const isGroupEditing = initialExpense?.isInstallment && editingScope === "group";

  return (
    <form className="card space-y-4 p-4" onSubmit={submit}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          {initialExpense ? (isGroupEditing ? "Editar parcelamento" : "Editar parcela") : "Novo gasto"}
        </h2>
        {onCancel ? (
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
      </div>

      {!initialExpense ? (
        <FormField label="Tipo de lançamento">
          <select className="input" value={form.tipoLancamento} onChange={(e) => setForm({ ...form, tipoLancamento: e.target.value })}>
            <option value="unico">Gasto único</option>
            <option value="parcelado">Gasto parcelado</option>
          </select>
        </FormField>
      ) : null}

      {form.tipoLancamento === "parcelado" ? (
        <FormField label="Modo de parcelamento">
          <select className="input" value={form.installmentMode} onChange={(e) => setForm({ ...form, installmentMode: e.target.value })}>
            <option value="totalAmount">Valor total + parcelas</option>
            <option value="installmentAmount">Valor da parcela + meses</option>
          </select>
        </FormField>
      ) : null}

      <FormField label="Descrição" error={errors.descricao}>
        <input className="input" placeholder="Ex: Notebook" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </FormField>

      {form.tipoLancamento === "parcelado" ? (
        <>
          {form.installmentMode === "totalAmount" ? (
            <FormField label="Valor total" error={errors.totalAmount}>
              <CurrencyInput value={form.totalAmount} onChange={(totalAmount) => setForm({ ...form, totalAmount })} placeholder="R$ 0,00" />
            </FormField>
          ) : (
            <FormField label="Valor da parcela" error={errors.installmentAmount}>
              <CurrencyInput value={form.installmentAmount} onChange={(installmentAmount) => setForm({ ...form, installmentAmount })} placeholder="R$ 0,00" />
            </FormField>
          )}
          <FormField label="Quantidade de parcelas" error={errors.installmentCount}>
            <input
              className="input"
              type="number"
              min="2"
              placeholder="Digite a quantidade de parcelas"
              value={form.installmentCount}
              onChange={(e) => setForm({ ...form, installmentCount: e.target.value })}
            />
          </FormField>
          <FormField label="Data inicial" error={errors.startDate}>
            <input className="input" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </FormField>
        </>
      ) : (
        <>
          <FormField label="Valor" error={errors.valor}>
            <CurrencyInput value={form.valor} onChange={(valor) => setForm({ ...form, valor })} placeholder="R$ 0,00" />
          </FormField>
          <FormField label="Data" error={errors.data}>
            <input className="input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </FormField>
        </>
      )}

      <FormField label="Categoria" error={errors.categoria}>
        <select className="input" value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
          <option value="">Selecione uma categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.nome}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Pessoa">
        <select className="input" value={form.pessoa} onChange={(e) => setForm({ ...form, pessoa: e.target.value })}>
          <option value="">Selecione uma pessoa</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.nome}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Cartão">
        <select className="input" value={form.cartao} onChange={(e) => setForm({ ...form, cartao: e.target.value })}>
          <option value="">Selecione um cartão</option>
          {cards.map((card) => (
            <option key={card.id} value={card.id}>
              {card.nome}
            </option>
          ))}
        </select>
      </FormField>

      <button className="btn-primary w-full" type="submit">
        {initialExpense ? "Salvar alterações" : "Salvar gasto"}
      </button>
    </form>
  );
}
