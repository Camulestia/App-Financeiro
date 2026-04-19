export default function InstallmentGroupActions({ expense, onEditSingle, onEditGroup, onDeleteSingle, onDeleteGroup }) {
  if (!expense.isInstallment) {
    return (
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" type="button" onClick={() => onEditSingle(expense)}>
          Editar
        </button>
        <button className="btn-danger" type="button" onClick={() => onDeleteSingle(expense)}>
          Remover
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn-secondary" type="button" onClick={() => onEditSingle(expense)}>
        Editar somente esta parcela
      </button>
      <button className="btn-secondary" type="button" onClick={() => onEditGroup(expense)}>
        Editar parcelamento inteiro
      </button>
      <button className="btn-danger" type="button" onClick={() => onDeleteSingle(expense)}>
        Excluir somente esta parcela
      </button>
      <button className="btn-danger" type="button" onClick={() => onDeleteGroup(expense)}>
        Excluir parcelamento inteiro
      </button>
    </div>
  );
}
