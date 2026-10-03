import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { XIcon } from './Icons.tsx';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps): JSX.Element | null {
  const sheet = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const focusable = (): HTMLElement[] => Array.from(sheet.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? []);
    (focusable()[0] ?? sheet.current)?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close.current();
      if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0]; const last = items[items.length - 1];
        if (!first) { e.preventDefault(); sheet.current?.focus(); }
        else if (e.shiftKey && (document.activeElement === first || !sheet.current?.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={sheet}
        tabIndex={-1}
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Cerrar">
            <XIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
