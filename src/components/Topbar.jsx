import { useTheme } from "../context/ThemeContext";
import BackupRestore from "./BackupRestore";
import MonthSelector from "./MonthSelector";

function SunIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export default function Topbar({ title }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Dados salvos neste dispositivo, prontos para uso offline.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MonthSelector />
        <BackupRestore />
        <button
          type="button"
          className="btn-icon"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          aria-pressed={isDark}
          title="Alternar tema"
        >
          {isDark ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
