import { useState } from "react";
import CardInvoiceSummary from "../components/CardInvoiceSummary";
import EmptyState from "../components/EmptyState";
import ExpenseForm from "../components/ExpenseForm";
import InstallmentGroupActions from "../components/InstallmentGroupActions";
import { useFinance } from "../context/FinanceContext";
import { useMonth } from "../context/MonthContext";
import { formatCurrency, formatDate } from "../utils/formatters";
import { getExpenseBillingMonth, getMonthLabel } from "../utils/installmentUtils";

export default function ExpensesPageMonth() {
  const {
    expenses,
    categories,
    people,
    cards,
    fixedExpenses,
    addExpense,
    updateExpense,
    addInstallmentGroup,
    updateInstallmentGroup,
    removeExpense,
    removeInstallmentGroup,
  } = useFinance();
  const { selectedMonth } = useMonth();
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingScope, setEditingScope] = useState("single");

  async function handleSubmit(payload) {
    setMessage("");
    try {
      if (editing?.isInstallment && editingScope === "group") {
        await updateInstallmentGroup(editing.installmentGroupId, payload);
        setMessage("Alterações salvas com sucesso");
      } else if (editing) {
        await updateExpense(payload);
        setMessage("Alterações salvas com sucesso");
      } else if (payload.installmentCount) {
        await addInstallmentGroup(payload);
      } else {
        await addExpense(payload);
      }
      setEditing(null);
    } catch (error) {
      setMessage(error.message || "Este item já existe");
    }
  }

  async function deleteSingle(expense) {
    if (!window.confirm(expense.isInstallment ? "Tem certeza que deseja excluir esta parcela?" : "Tem certeza que deseja excluir este gasto?")) return;
    await removeExpense(expense.id);
  }

  async function deleteGroup(expense) {
    if (!window.confirm("Tem certeza que deseja excluir o parcelamento inteiro?")) return;
    await removeInstallmentGroup(expense.installmentGroupId);
    setMessage("Parcelamento excluído com sucesso");
  }

  const monthExpenses = expenses
    .filter((expense) => getExpenseBillingMonth(expense, cards) === selectedMonth)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <ExpenseForm
          categories={categories}
          people={people}
          cards={cards}
          onSubmit={handleSubmit}
          initialExpense={editing}
          editingScope={editingScope}
          onCancel={editing ? () => setEditing(null) : null}
        />
        {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">{message}</p> : null}
      </div>

      <div className="space-y-6">
        <CardInvoiceSummary expenses={expenses} fixedExpenses={fixedExpenses} cards={cards} monthKey={selectedMonth} />
        <section className="card p-4">
          <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Gastos do mês</h2>
          {monthExpenses.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2">Descrição</th>
                    <th>Compra</th>
                    <th>Mês financeiro</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>Parcela</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {monthExpenses.map((expense) => {
                    const category = categories.find((item) => item.id === expense.categoria);
                    const billingMonth = getExpenseBillingMonth(expense, cards);
                    return (
                      <tr key={expense.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">{expense.descricao}</td>
                        <td>{formatDate(expense.purchaseDate || expense.data)}</td>
                        <td>{getMonthLabel(billingMonth)}</td>
                        <td>{category?.nome || "Outros"}</td>
                        <td className="font-semibold text-rose-600">{formatCurrency(expense.valor)}</td>
                        <td>{expense.isInstallment ? `${expense.installmentIndex}/${expense.installmentCount}` : "Gasto único"}</td>
                        <td>
                          <InstallmentGroupActions
                            expense={expense}
                            onEditSingle={(item) => {
                              setEditing(item);
                              setEditingScope("single");
                            }}
                            onEditGroup={(item) => {
                              setEditing(item);
                              setEditingScope("group");
                            }}
                            onDeleteSingle={deleteSingle}
                            onDeleteGroup={deleteGroup}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="Nenhum gasto no mês selecionado." />
          )}
        </section>
      </div>
    </div>
  );
}
