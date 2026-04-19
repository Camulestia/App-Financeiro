export function formatCurrency(value) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

export function parseCurrency(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const onlyDigits = String(value).replace(/\D/g, "");
  return Number(onlyDigits || 0) / 100;
}

export function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function monthName(value) {
  const date = value ? new Date(`${String(value).slice(0, 10)}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat("pt-BR", { month: "short", day: "2-digit" }).format(date);
}
