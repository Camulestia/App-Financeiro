import { formatCurrency, parseCurrency } from "../utils/formatters";

export default function CurrencyInput({ value, onChange, placeholder = "R$ 0,00", ...props }) {
  return (
    <input
      {...props}
      className={props.className || "input"}
      inputMode="numeric"
      placeholder={placeholder}
      value={value ? formatCurrency(value) : ""}
      onChange={(event) => onChange(parseCurrency(event.target.value))}
    />
  );
}
