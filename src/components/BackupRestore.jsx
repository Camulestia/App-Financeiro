import { useRef, useState } from "react";
import { useFinance } from "../context/FinanceContext";

export default function BackupRestore() {
  const fileRef = useRef(null);
  const { exportAllData, restoreData } = useFinance();
  const [message, setMessage] = useState("");

  async function handleExport() {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-financas-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup realizado com sucesso");
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await restoreData(JSON.parse(await file.text()));
      setMessage("Dados restaurados com sucesso");
    } catch {
      setMessage("Erro ao importar arquivo");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary" onClick={handleExport}>
        Exportar dados
      </button>
      <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
        Importar dados
      </button>
      <input ref={fileRef} className="hidden" type="file" accept="application/json" onChange={handleImport} />
      {message ? <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{message}</span> : null}
    </div>
  );
}
