import { useRef, useState } from "react";
import EmptyState from "../components/EmptyState";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, formatDate, todayISO } from "../utils/formatters";

function parseCsv(text) {
  const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  const dataRows = rows[0]?.toLowerCase().includes("descricao") ? rows.slice(1) : rows;
  return dataRows.map((row) => {
    const [descricao, valor, data] = row.split(",").map((cell) => cell?.trim());
    return {
      descricao: descricao || "Gasto importado",
      valor: Number(String(valor || "0").replace(".", "").replace(",", ".")),
      data: data?.includes("/") ? data.split("/").reverse().join("-") : data || todayISO(),
    };
  });
}

export default function ImportPage() {
  const fileRef = useRef(null);
  const { pendingImports, categories, addPendingImport, addImportedExpense, discardImport } = useFinance();
  const [message, setMessage] = useState("");

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      for (const row of rows) await addPendingImport({ ...row, categoria: categories[0]?.id || "" });
      setMessage("Importações pendentes");
    } catch {
      setMessage("Erro ao importar arquivo");
    } finally {
      event.target.value = "";
    }
  }

  async function confirm(item) {
    try {
      await addImportedExpense(item, item.id);
      setMessage("Importação confirmada");
    } catch (error) {
      setMessage(error.message || "Este item já existe");
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-4">
        <h2 className="mb-3 text-lg font-bold text-slate-950 dark:text-white">Importar CSV</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Use colunas na ordem: descrição, valor e data.</p>
        <button className="btn-primary" type="button" onClick={() => fileRef.current?.click()}>Importar extrato</button>
        <input ref={fileRef} className="hidden" type="file" accept=".csv,text/csv" onChange={handleFile} />
        {message ? <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</p> : null}
      </section>
      <section className="card p-4">
        <h2 className="mb-4 text-lg font-bold text-slate-950 dark:text-white">Importações pendentes</h2>
        {pendingImports.length ? (
          <div className="space-y-3">
            {pendingImports.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-md bg-slate-50 p-3 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{item.descricao}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatDate(item.data)} · {formatCurrency(item.valor)}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary" type="button" onClick={() => confirm(item)}>Confirmar</button>
                  <button className="btn-secondary" type="button" onClick={() => discardImport(item.id)}>Descartar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="Nenhuma importação pendente." />
        )}
      </section>
    </div>
  );
}
