import { useEffect, useRef } from 'react';
import { Palette, X } from 'lucide-react';

import { obtenerTema, TEMAS_CATALOGO, type TemaId } from '../data/temas';
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
  modoMotor: 'navegador' | 'api';
  onCambiarModoMotor: (m: 'navegador' | 'api') => void;
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
  modoMotor,
  onCambiarModoMotor,
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
          Ajustes de Chispa .edu · Code Compiler
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
          <span className="setting-label">Motor de compilación</span>
          <div className="segmented" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <button
              type="button"
              className="seg-btn"
              aria-pressed={modoMotor === 'navegador'}
              onClick={() => onCambiarModoMotor('navegador')}
            >
              Navegador (GitHub Pages)
            </button>
            <button
              type="button"
              className="seg-btn"
              aria-pressed={modoMotor === 'api'}
              onClick={() => onCambiarModoMotor('api')}
            >
              API Python local
            </button>
          </div>
          {modoMotor === 'api' && (
            <div style={{ marginTop: 6 }}>
              <label
                htmlFor="api-url-input"
                className="setting-label"
                style={{ display: 'block', marginBottom: 4 }}
              >
                URL del servidor FastAPI
              </label>
              <input
                id="api-url-input"
                type="url"
                className="text-input"
                style={{ width: '100%' }}
                value={urlApi}
                onChange={(e) => onCambiarUrlApi(e.target.value)}
                placeholder="http://127.0.0.1:8000"
              />
            </div>
          )}
        </div>
        </div>
        <ContainerOverlayScrollbar targetRef={bodyRef} />
      </div>
    </dialog>
  );
}
