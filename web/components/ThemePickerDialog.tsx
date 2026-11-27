import { useEffect, useRef } from 'react';
import { Check, Palette, X } from 'lucide-react';

import { TEMAS_CATALOGO, type TemaId } from '../data/temas';

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
  temaActual: TemaId;
  onSeleccionarTema: (id: TemaId) => void;
}

const GRUPOS: ('Oscuros' | 'Claros' | 'Accesibilidad')[] = [
  'Oscuros',
  'Claros',
  'Accesibilidad',
];

export function ThemePickerDialog({
  open,
  onClose,
  temaActual,
  onSeleccionarTema,
}: ThemePickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog theme-dialog"
      aria-labelledby="themes-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="dialog-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Palette size={20} aria-hidden="true" />
          <div>
            <h2 id="themes-dialog-title" style={{ fontSize: '1.15rem' }}>
              Galería de 10 Temas Visuales
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Cambia toda la interfaz, el editor, el logo y el escenario al instante
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onClose}
          aria-label="Cerrar selector de temas"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="dialog-body">
        {GRUPOS.map((grupo) => {
          const items = TEMAS_CATALOGO.filter((t) => t.grupo === grupo);
          return (
            <div key={grupo} className="setting-group">
              <span className="section-tag" style={{ marginBottom: 4 }}>
                // {grupo} ({items.length})
              </span>
              <div className="theme-grid">
                {items.map((t) => {
                  const activo = t.id === temaActual;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      className={`theme-card ${activo ? 'active' : ''}`}
                      aria-pressed={activo}
                      onClick={() => onSeleccionarTema(t.id)}
                    >
                      <div className="theme-swatches" aria-hidden="true">
                        {t.muestras.map((hex, i) => (
                          <span
                            key={i}
                            className="swatch-dot"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          <strong style={{ fontSize: '0.92rem' }}>{t.nombre}</strong>
                          {activo && <Check size={16} aria-hidden="true" />}
                        </div>
                        <span
                          style={{
                            display: 'block',
                            fontSize: '0.77rem',
                            color: 'var(--ink-muted)',
                            marginTop: 2,
                          }}
                        >
                          {t.descripcion}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </dialog>
  );
}
