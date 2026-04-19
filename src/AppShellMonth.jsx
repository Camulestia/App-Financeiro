import { useCallback, useMemo, useState } from "react";
import Sidebar from "./components/SidebarV2";
import Topbar from "./components/Topbar";
import { useFinance } from "./context/FinanceContext";
import CardsPage from "./pages/CardsPageMonth";
import ChartsPage from "./pages/ChartsPageMonth";
import DashboardPage from "./pages/DashboardPagePeopleNav";
import ExpensesPage from "./pages/ExpensesPageMonth";
import FixedExpensesPage from "./pages/FixedExpensesPage";
import FutureInstallmentsPage from "./pages/FutureInstallmentsPage";
import IncomesPage from "./pages/IncomesPageMonth";
import MonthsPage from "./pages/MonthsPage";
import PeoplePage from "./pages/PeoplePageDRE";

const pages = {
  dashboard: { title: "Dashboard", component: DashboardPage },
  gastos: { title: "Gastos", component: ExpensesPage },
  receitas: { title: "Receitas", component: IncomesPage },
  meses: { title: "Meses", component: MonthsPage },
  cartoes: { title: "Cartões", component: CardsPage },
  pessoas: { title: "Pessoas", component: PeoplePage },
  fixos: { title: "Fixos", component: FixedExpensesPage },
  parcelas: { title: "Parcelas futuras", component: FutureInstallmentsPage },
  graficos: { title: "Gráficos", component: ChartsPage },
};

export default function AppShellMonth() {
  const [activePage, setActivePage] = useState("dashboard");
  const [personDetailId, setPersonDetailId] = useState("");
  const { loading } = useFinance();
  const CurrentPage = useMemo(() => pages[activePage].component, [activePage]);

  const openPersonDetail = useCallback((personId) => {
    setPersonDetailId(personId);
    setActivePage("pessoas");
  }, []);

  const clearPersonDetail = useCallback(() => {
    setPersonDetailId("");
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 lg:flex">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="min-w-0 flex-1">
        <Topbar title={pages[activePage].title} />
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
          {loading ? (
            <div className="card p-6 text-center text-slate-500 dark:text-slate-400">Carregando dados...</div>
          ) : (
            <CurrentPage
              onOpenPersonDetail={openPersonDetail}
              selectedPersonIdFromDashboard={personDetailId}
              clearSelectedPersonFromDashboard={clearPersonDetail}
            />
          )}
        </main>
      </div>
    </div>
  );
}
