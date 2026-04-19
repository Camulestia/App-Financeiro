import { useMemo, useState } from "react";
import Sidebar from "./components/SidebarV2";
import Topbar from "./components/Topbar";
import { useFinance } from "./context/FinanceContext";
import CardsPage from "./pages/CardsPageV2";
import ChartsPage from "./pages/ChartsPageV2";
import DashboardPage from "./pages/DashboardPageV2";
import ExpensesPage from "./pages/ExpensesPageInstallments";
import FixedExpensesPage from "./pages/FixedExpensesPage";
import FutureInstallmentsPage from "./pages/FutureInstallmentsPage";
import ImportPage from "./pages/ImportPage";
import IncomesPage from "./pages/IncomesPage";
import MonthsPage from "./pages/MonthsPage";
import PeoplePage from "./pages/PeoplePage";

const pages = {
  dashboard: { title: "Dashboard", component: DashboardPage },
  gastos: { title: "Gastos", component: ExpensesPage },
  receitas: { title: "Receitas", component: IncomesPage },
  meses: { title: "Meses", component: MonthsPage },
  cartoes: { title: "Cartões", component: CardsPage },
  pessoas: { title: "Pessoas", component: PeoplePage },
  fixos: { title: "Fixos", component: FixedExpensesPage },
  importar: { title: "Importar", component: ImportPage },
  parcelas: { title: "Parcelas futuras", component: FutureInstallmentsPage },
  graficos: { title: "Gráficos", component: ChartsPage },
};

export default function AppShell() {
  const [activePage, setActivePage] = useState("dashboard");
  const { loading } = useFinance();
  const CurrentPage = useMemo(() => pages[activePage].component, [activePage]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="min-w-0 flex-1">
        <Topbar title={pages[activePage].title} />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          {loading ? (
            <div className="card p-6 text-center text-slate-500 dark:text-slate-400">Carregando dados...</div>
          ) : (
            <CurrentPage />
          )}
        </main>
      </div>
    </div>
  );
}
