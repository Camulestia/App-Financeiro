import { useTheme } from "../context/ThemeContext";
import BackupRestore from "./BackupRestore";

export default function Topbar({ title }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Dados salvos neste dispositivo, prontos para uso offline.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <BackupRestore />
        <button type="button" className="btn-secondary" onClick={toggleTheme}>
          {isDark ? "Modo claro" : "Modo escuro"}
        </button>
      </div>
    </header>
  );
}
