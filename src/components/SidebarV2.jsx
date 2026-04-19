const menu = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "gastos", label: "Gastos", icon: "-" },
  { id: "receitas", label: "Receitas", icon: "+" },
  { id: "meses", label: "Meses", icon: "M" },
  { id: "cartoes", label: "Cartões", icon: "C" },
  { id: "pessoas", label: "Pessoas", icon: "P" },
  { id: "fixos", label: "Fixos", icon: "F" },
  { id: "importar", label: "Importar", icon: "I" },
  { id: "parcelas", label: "Parcelas futuras", icon: "PF" },
  { id: "graficos", label: "Gráficos", icon: "G" },
];

export default function SidebarV2({ activePage, setActivePage }) {
  return (
    <aside className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 font-bold text-white">FP</div>
        <div>
          <p className="text-base font-bold text-slate-900 dark:text-white">Finanças Pessoais</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Controle simples</p>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-4 lg:block lg:space-y-1 lg:overflow-visible">
        {menu.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActivePage(item.id)}
            className={`flex min-w-max items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition lg:w-full ${
              activePage === item.id
                ? "bg-emerald-700 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
            }`}
          >
            <span className="w-6 text-center text-xs">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
