import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { addMonthsToMonthKey, getMonthKey, getMonthLabel } from "../utils/installmentUtils";

const MonthContext = createContext(null);
const STORAGE_KEY = "financas:mesSelecionado";

export function MonthProvider({ children }) {
  const [selectedMonth, setSelectedMonthState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || getMonthKey(new Date().toISOString());
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedMonth);
  }, [selectedMonth]);

  function getSelectedMonth() {
    return selectedMonth;
  }

  function setSelectedMonth(monthKey) {
    setSelectedMonthState(monthKey || getMonthKey(new Date().toISOString()));
  }

  const value = useMemo(
    () => ({
      selectedMonth,
      selectedMonthLabel: getMonthLabel(selectedMonth),
      getSelectedMonth,
      setSelectedMonth,
      previousMonth: () => setSelectedMonthState((current) => addMonthsToMonthKey(current, -1)),
      nextMonth: () => setSelectedMonthState((current) => addMonthsToMonthKey(current, 1)),
    }),
    [selectedMonth],
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const context = useContext(MonthContext);
  if (!context) throw new Error("useMonth deve ser usado dentro de MonthProvider");
  return context;
}
