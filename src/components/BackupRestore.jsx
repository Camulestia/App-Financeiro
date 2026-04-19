import { useRef, useState } from "react";
import { useFinance } from "../context/FinanceContext";

function DownloadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21V9" />
      <path d="m7 14 5-5 5 5" />
      <path d="M5 3h14" />
    </svg>
  );
}

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
    setMessage("Backup exportado com sucesso");
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await restoreData(JSON.parse(await file.text()));
      setMessage("Dados importados com sucesso");
    } catch (error) {
      setMessage(error.message === "Arquivo inválido" ? "Arquivo inválido" : "Erro ao importar dados");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-icon" onClick={handleExport} aria-label="Exportar dados" title="Exportar dados">
        <DownloadIcon />
      </button>
      <button type="button" className="btn-icon" onClick={() => fileRef.current?.click()} aria-label="Importar dados" title="Importar dados">
        <UploadIcon />
      </button>
      <input ref={fileRef} className="hidden" type="file" accept="application/json" onChange={handleImport} />
      {message ? <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{message}</span> : null}
    </div>
  );
}
