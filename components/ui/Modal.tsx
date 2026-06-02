'use client';

import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Footer actions — usually a primary + ghost button row. */
  footer?: ReactNode;
}

/**
 * Minimal monochrome modal. Backdrop click and the Esc key close it.
 * Centered on desktop, full-width sheet style on mobile.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full md:max-w-md bg-white border border-brut-line shadow-none"
      >
        <header className="flex items-center justify-between border-b border-brut-line px-6 py-4">
          <h2
            id="modal-title"
            className="text-[10px] font-semibold tracking-brut-wide uppercase text-brut-black"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-brut-muted hover:text-brut-black transition-colors text-lg leading-none"
          >
            ×
          </button>
        </header>
        <div className="px-6 py-6">{children}</div>
        {footer ? (
          <footer className="flex items-center justify-end gap-3 border-t border-brut-line px-6 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
