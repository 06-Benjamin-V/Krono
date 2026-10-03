import { Modal } from './Modal.tsx';
import { Button } from './Button.tsx';
export function ConfirmDelete({title, busy, onCancel, onConfirm}: {title: string | null; busy: boolean; onCancel: () => void; onConfirm: () => void}): JSX.Element {
  return <Modal open={title !== null} title="Eliminar elemento" onClose={() => { if (!busy) onCancel(); }}>
    <p>¿Eliminar «{title}»? Esta acción no se puede deshacer.</p>
    <div className="form-actions"><Button variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button><Button variant="danger" disabled={busy} onClick={onConfirm}>{busy ? 'Eliminando…' : 'Eliminar'}</Button></div>
  </Modal>;
}
