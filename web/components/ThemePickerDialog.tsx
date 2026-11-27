import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Palette, Search, X } from 'lucide-react';

import { TEMAS_CATALOGO, type TemaId } from '../data/temas';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';

interface ThemePickerDialogProps {
  open: boolean;
  onClose: () => void;
  temaActual: TemaId;
  onSeleccionarTema: (id: TemaId) => void;
}

type FiltroGrupo = 'Todos' | 'Oscuros' | 'Claros' | 'Accesibilidad';

const FILTROS: FiltroGrupo[] = ['Todos', 'Oscuros', 'Claros', 'Accesibilidad'];

export function ThemePickerDialog({
  open,
  onClose,
  temaActual,
  onSeleccionarTema,
}: ThemePickerDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [filtro, setFiltro] = useState<FiltroGrupo>('Todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  const temasFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return TEMAS_CATALOGO.filter((t) => {
      if (filtro !== 'Todos' && t.grupo !== filtro) return false;
      if (!q) return true;
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q) ||
        t.grupo.toLowerCase().includes(q)
      );
    });
  }, [busqueda, filtro]);

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog theme-dialog theme-dialog-wide"
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
          <Palette size={20} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <div>
            <h2 id="themes-dialog-title" style={{ fontSize: '1.12rem', margin: 0 }}>
              Temas Visuales y Sintaxis ({TEMAS_CATALOGO.length})
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              Cambia el fondo continuo, los colores del código, el logo y Code Compiler al instante
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

      {/* Barra de búsqueda + filtros estilo buildwithclaude.com/themes */}
      <div className="theme-toolbar">
        <div className="theme-search-wrap">
          <Search size={14} aria-hidden="true" style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
          <label htmlFor="theme-search-input" className="sr-only">
            Buscar tema visual
          </label>
          <input
            id="theme-search-input"
            type="text"
            className="theme-search-input"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tema (Gruvbox, Rosé Pine, Dracula, Kanagawa...)"
          />
        </div>

        <div className="theme-filter-pills" role="group" aria-label="Filtrar temas por categoría">
          {FILTROS.map((f) => {
            const count =
              f === 'Todos'
                ? TEMAS_CATALOGO.length
                : TEMAS_CATALOGO.filter((t) => t.grupo === f).length;
            return (
              <button
                key={f}
                type="button"
                className="theme-filter-btn"
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
              >
                <span>{f}</span>
                <span className="theme-filter-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overlay-scroll-host">
        <div ref={bodyRef} className="dialog-body">
          {temasFiltrados.length === 0 ? (
            <p style={{ margin: '18px 0', textAlign: 'center', color: 'var(--ink-muted)' }}>
              No se encontraron temas para «{busqueda}».
            </p>
          ) : (
            <div className="theme-showcase-grid">
              {temasFiltrados.map((t) => {
                const activo = t.id === temaActual;
                const s = t.sintaxis;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-preview-card ${activo ? 'active' : ''}`}
                    aria-pressed={activo}
                    onClick={() => onSeleccionarTema(t.id)}
                  >
                    {/* Cabecera con mini código sintáctico real estilo buildwithclaude.com/themes */}
                    <div
                      className="theme-code-stage"
                      style={{ backgroundColor: s.editorBg, color: s.ink }}
                      aria-hidden="true"
                    >
                      <div className="theme-code-top">
                        <span style={{ color: t.muestras[2], fontWeight: 700 }}>{t.nombre}</span>
                        <span className="theme-code-dots">
                          {[t.muestras[2], t.muestras[3], s.str, s.num, s.fn].map((hex, idx) => (
                            <span
                              key={idx}
                              className="theme-mini-sq"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                      </div>

                      <div className="theme-code-lines">
                        <div>
                          <span style={{ color: s.comment }}>1</span>{' '}
                          <span style={{ color: s.kw }}>crear variable</span>{' '}
                          <span style={{ color: s.ink }}>energia</span>
                        </div>
                        <div>
                          <span style={{ color: s.comment }}>2</span>{' '}
                          <span style={{ color: s.kw }}>asignar</span>{' '}
                          <span style={{ color: s.ink }}>energia</span>{' '}
                          <span style={{ color: s.fn }}>valor de</span>{' '}
                          <span style={{ color: s.num }}>100</span>
                        </div>
                        <div>
                          <span style={{ color: s.comment }}>3</span>{' '}
                          <span style={{ color: s.fn }}>mostrar</span>{' '}
                          <span style={{ color: s.str }}>&quot;¡Hola Chispa!&quot;</span>
                        </div>
                      </div>
                    </div>

                    {/* Pie descriptivo de la tarjeta */}
                    <div className="theme-preview-meta">
                      <div className="theme-preview-title-row">
                        <strong>{t.nombre}</strong>
                        <span className="theme-preview-badge">
                          {activo ? (
                            <>
                              <Check size={12} aria-hidden="true" /> Activo
                            </>
                          ) : (
                            t.grupo
                          )}
                        </span>
                      </div>
                      <span className="theme-preview-desc">{t.descripcion}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <ContainerOverlayScrollbar targetRef={bodyRef} />
      </div>
    </dialog>
  );
}
