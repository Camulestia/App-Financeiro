export default function FormField({ label, error, children }) {
  return (
    <label className="space-y-1">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="block text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
