import { useEffect, useRef } from 'react';
import { Palette, X } from 'lucide-react';

import { obtenerTema, TEMAS_CATALOGO, type TemaId } from '../data/temas';
import { URL_API_PYTHON_DEFECTO } from '../engine/compilador';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';

export type EscalaTexto = 'small' | 'normal' | 'large';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  tema: TemaId;
  onCambiarTema: (t: TemaId) => void;
  onAbrirGaleriaTemas: () => void;
  escalaTexto: EscalaTexto;
  onCambiarEscala: (e: EscalaTexto) => void;
  movimientoReducido: boolean;
  onCambiarMovimiento: (v: boolean) => void;
  urlApi: string;
  onCambiarUrlApi: (url: string) => void;
}

export function SettingsDialog({
  open,
  onClose,
  tema,
  onCambiarTema,
  onAbrirGaleriaTemas,
  escalaTexto,
  onCambiarEscala,
  movimientoReducido,
  onCambiarMovimiento,
  urlApi,
  onCambiarUrlApi,
}: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const temaMeta = obtenerTema(tema);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog"
      aria-labelledby="settings-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="dialog-head">
        <h2 id="settings-title" style={{ fontSize: '1.15rem' }}>
          Ajustes de Chispa · Code Compiler
        </h2>
        <button
          type="button"
          className="btn btn-icon"
          onClick={onClose}
          aria-label="Cerrar ajustes"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="overlay-scroll-host">
        <div ref={bodyRef} className="dialog-body">
          <div className="setting-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <label htmlFor="settings-theme-select" className="setting-label">
                Tema visual ({TEMAS_CATALOGO.length} disponibles)
              </label>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => {
                  onClose();
                  onAbrirGaleriaTemas();
                }}
              >
                <Palette size={14} aria-hidden="true" /> Ver muestras
              </button>
            </div>
            <select
              id="settings-theme-select"
              className="text-input"
              value={temaMeta.id}
              onChange={(e) => onCambiarTema(e.target.value as TemaId)}
            >
              {TEMAS_CATALOGO.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.grupo})
                </option>
              ))}
            </select>
          </div>

          <div className="setting-group">
            <span className="setting-label">Tamaño de letra</span>
            <div className="segmented" role="group" aria-label="Seleccionar tamaño de letra">
              {(
                [
                  ['small', 'Pequeño'],
                  ['normal', 'Normal'],
                  ['large', 'Grande'],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  className="seg-btn"
                  aria-pressed={escalaTexto === val}
                  onClick={() => onCambiarEscala(val)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <span className="setting-label">Reducir animaciones y movimiento</span>
              <input
                type="checkbox"
                checked={movimientoReducido}
                onChange={(e) => onCambiarMovimiento(e.target.checked)}
                style={{ width: 22, height: 22 }}
              />
            </label>
          </div>

          <div className="setting-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <label htmlFor="api-url-input" className="setting-label">
                Servidor Python
              </label>
              {urlApi.trim() !== URL_API_PYTHON_DEFECTO && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onCambiarUrlApi(URL_API_PYTHON_DEFECTO)}
                >
                  Restaurar Render
                </button>
              )}
            </div>
            <input
              id="api-url-input"
              type="url"
              className="text-input"
              style={{ width: '100%' }}
              value={urlApi}
              onChange={(e) => onCambiarUrlApi(e.target.value)}
              placeholder={URL_API_PYTHON_DEFECTO}
            />
            <small style={{ color: 'var(--ink-secondary)', fontSize: '0.74rem', lineHeight: 1.45, display: 'block', marginTop: 4 }}>
              Por defecto usa Python en Render. Solo cambia esta URL si ejecutas la API localmente en tu equipo.
            </small>
          </div>
        </div>
        <ContainerOverlayScrollbar targetRef={bodyRef} />
      </div>
    </dialog>
  );
}
