/**
 * Panel lateral derecho acoplado al Dock de iconos (estilo GoJS.app + Codédex):
 * - Misiones guiadas con XP y comprobación en vivo
 * - Guía rápida de bloques con búsqueda Fuse.js
 * - Juegos 2D y archivos (Importar / Exportar)
 * - Historial de instantáneas
 */

import Fuse from 'fuse.js';
import { useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Code2,
  Download,
  FolderOpen,
  History,
  Lightbulb,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trophy,
  Upload,
  X,
} from 'lucide-react';

import { BLOQUES_EDU } from '../data/bloques';
import { EJEMPLOS_EDU } from '../data/ejemplos';
import { MISIONES_EDU, type MisionEdu } from '../data/misiones';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';

export type PanelDerechoTipo = 'misiones' | 'guia' | 'ejemplos' | 'historial' | null;

export interface InstantaneaCodigo {
  id: string;
  pestanaId: string;
  hora: string;
  etiqueta: string;
  lineas: number;
  codigo: string;
}

interface RightDrawerProps {
  panel: PanelDerechoTipo;
  onCerrar: () => void;
  misionesCompletadas: string[];
  misionActiva: MisionEdu | null;
  onIniciarMision: (m: MisionEdu) => void;
  onComprobarMision: () => void;
  feedbackMision: { ok: boolean; texto: string } | null;
  onInsertarBloque: (codigo: string) => void;
  onAbrirCodigoNuevo: (nombre: string, codigo: string) => void;
  onImportarArchivo: () => void;
  onExportarEdu: () => void;
  historial: InstantaneaCodigo[];
  onGuardarInstantanea: () => void;
  onRestaurarInstantanea: (codigo: string) => void;
  nombrePestanaActual: string;
  mobileVisible?: boolean;
}

export function RightDrawer({
  panel,
  onCerrar,
  misionesCompletadas,
  misionActiva,
  onIniciarMision,
  onComprobarMision,
  feedbackMision,
  onInsertarBloque,
  onAbrirCodigoNuevo,
  onImportarArchivo,
  onExportarEdu,
  historial,
  onGuardarInstantanea,
  onRestaurarInstantanea,
  nombrePestanaActual,
  mobileVisible = false,
}: RightDrawerProps) {
  const drawerScrollRef = useRef<HTMLDivElement | null>(null);
  const [busquedaGuia, setBusquedaGuia] = useState('');

  const fuseGuia = useMemo(
    () =>
      new Fuse(BLOQUES_EDU, {
        keys: ['titulo', 'etiquetaCorta', 'bloqueScratch', 'palabrasClave'],
        threshold: 0.38,
        ignoreLocation: true,
      }),
    [],
  );

  const resultadosGuia = useMemo(() => {
    if (!busquedaGuia.trim()) return BLOQUES_EDU;
    return fuseGuia.search(busquedaGuia.trim()).map((r) => r.item);
  }, [busquedaGuia, fuseGuia]);

  if (!panel) return null;

  const porcentajeMisiones = Math.round((misionesCompletadas.length / MISIONES_EDU.length) * 100);
  const xpTotal = misionesCompletadas.length * 100;

  const descargarDiploma = () => {
    const insignias = MISIONES_EDU.filter((m) => misionesCompletadas.includes(m.id))
      .map((m) => `• ${m.insignia}`)
      .join('\n');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="520" viewBox="0 0 880 520">
  <rect width="880" height="520" rx="24" fill="#0C0F17"/>
  <rect x="20" y="20" width="840" height="480" rx="18" fill="#141926" stroke="#FACC15" stroke-width="4"/>
  <text x="440" y="88" text-anchor="middle" font-family="sans-serif" font-size="30" font-weight="700" fill="#FACC15">DIPLOMA CODE COMPILER · CHISPA .EDU</text>
  <text x="440" y="142" text-anchor="middle" font-family="monospace" font-size="20" fill="#F5F7FF">${misionesCompletadas.length}/${MISIONES_EDU.length} misiones completadas · ${xpTotal} XP</text>
  <rect x="70" y="180" width="740" height="240" rx="12" fill="#10141F" stroke="#28324C" stroke-width="2"/>
  ${(insignias || '• Completa misiones en Chispa .edu para desbloquear insignias')
    .split('\n')
    .map(
      (line, i) =>
        `<text x="100" y="${224 + i * 32}" font-family="monospace" font-size="16" fill="#4ADE80">${line.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`,
    )
    .join('')}
  <text x="440" y="466" text-anchor="middle" font-family="monospace" font-size="13" fill="#98A8C7">topional/code-compiler · Lenguaje Educativo .edu</text>
</svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diploma-chispa-edu.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const titulos: Record<Exclude<PanelDerechoTipo, null>, { texto: string; icono: React.ReactNode }> = {
    misiones: { texto: 'Misiones', icono: <Trophy size={14} aria-hidden="true" /> },
    guia: { texto: 'Guía de Bloques', icono: <BookOpen size={14} aria-hidden="true" /> },
    ejemplos: { texto: 'Juegos 2D y Archivos', icono: <FolderOpen size={14} aria-hidden="true" /> },
    historial: { texto: 'Historial', icono: <History size={14} aria-hidden="true" /> },
  };

  return (
    <aside
      className={`wb-pane wb-drawer ${mobileVisible ? '' : 'mobile-hidden'}`}
      aria-label={titulos[panel].texto}
    >
      <div className="wb-pane-header">
        <span className="wb-pane-title">
          {titulos[panel].icono}
          {titulos[panel].texto}
        </span>
        <button
          type="button"
          className="ide-icon-btn hide-narrow"
          onClick={onCerrar}
          aria-label="Cerrar panel lateral"
          title="Cerrar panel"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="overlay-scroll-host is-flex">
      {/* 1. MISIONES (estilo Codédex al lado del código) */}
      {panel === 'misiones' && (
        <div ref={drawerScrollRef} className="drawer-scroll">
          <div className="drawer-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.84rem' }}>Progreso de aventura</strong>
              <span className="pill-mini ok">{xpTotal} XP</span>
            </div>
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={porcentajeMisiones}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progreso de misiones"
            >
              <div className="progress-bar-fill" style={{ width: `${porcentajeMisiones}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                {misionesCompletadas.length} de {MISIONES_EDU.length} completadas
              </span>
              <button type="button" className="btn btn-sm" onClick={descargarDiploma}>
                <Download size={13} aria-hidden="true" /> Diploma
              </button>
            </div>
          </div>

          {misionActiva && feedbackMision && (
            <div
              className={`drawer-card ${feedbackMision.ok ? 'done' : ''}`}
              role="status"
              style={{ borderColor: feedbackMision.ok ? 'var(--ok)' : 'var(--err)' }}
            >
              <strong style={{ fontSize: '0.82rem', color: feedbackMision.ok ? 'var(--ok)' : 'var(--err)' }}>
                {feedbackMision.texto}
              </strong>
            </div>
          )}

          {MISIONES_EDU.map((m) => {
            const hecha = misionesCompletadas.includes(m.id);
            const activa = misionActiva?.id === m.id;
            return (
              <article
                key={m.id}
                className={`drawer-card ${hecha ? 'done' : ''}`}
                style={activa ? { borderColor: 'var(--accent)' } : undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                  <span className="pill-mini">{m.etiquetaNivel}</span>
                  {hecha ? (
                    <span className="pill-mini ok">
                      <CheckCircle2 size={11} aria-hidden="true" /> +100 XP
                    </span>
                  ) : (
                    <span className="pill-mini">
                      <Award size={11} aria-hidden="true" /> {m.insignia}
                    </span>
                  )}
                </div>

                <strong style={{ fontSize: '0.9rem' }}>{m.titulo}</strong>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-secondary)' }}>
                  {m.objetivo}
                </p>

                <details style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                    <Lightbulb size={12} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4 }} />
                    Ver pista
                  </summary>
                  <p style={{ margin: '5px 0 0' }}>{m.pista}</p>
                </details>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${activa ? '' : 'btn-primary'}`}
                    style={{ flex: 1 }}
                    onClick={() => onIniciarMision(m)}
                  >
                    <Code2 size={13} aria-hidden="true" />
                    {activa ? 'Recargar reto' : 'Abrir reto'}
                  </button>
                  {activa && (
                    <button
                      type="button"
                      className="btn btn-ok btn-sm"
                      onClick={onComprobarMision}
                    >
                      Comprobar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 2. GUÍA VISUAL DE BLOQUES CON FUSE.JS */}
      {panel === 'guia' && (
        <div ref={drawerScrollRef} className="drawer-scroll">
          <div style={{ position: 'relative' }}>
            <label htmlFor="drawer-guide-search" className="sr-only">
              Buscar comando en la guía .edu
            </label>
            <Search
              size={14}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-muted)',
              }}
            />
            <input
              id="drawer-guide-search"
              type="text"
              className="text-input"
              style={{ width: '100%', paddingLeft: 30, minHeight: 34 }}
              value={busquedaGuia}
              onChange={(e) => setBusquedaGuia(e.target.value)}
              placeholder="Buscar: bucle, dado, preguntar, si..."
            />
          </div>

          {resultadosGuia.map((item) => (
            <article key={item.id} className="drawer-card">
              <strong style={{ fontSize: '0.86rem' }}>{item.titulo}</strong>
              <span className="pill-mini">Scratch: {item.bloqueScratch}</span>
              <pre className="code-mini" tabIndex={0}>
                <code>{item.ejemploCompleto}</code>
              </pre>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onInsertarBloque(item.plantilla)}
                >
                  <Plus size={13} aria-hidden="true" /> Insertar
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => onAbrirCodigoNuevo(`${item.id}.edu`, item.ejemploCompleto)}
                >
                  <Play size={13} aria-hidden="true" /> Probar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* 4. EJEMPLOS OFICIALES Y ARCHIVOS */}
      {panel === 'ejemplos' && (
        <div ref={drawerScrollRef} className="drawer-scroll">
          <div className="drawer-card">
            <strong style={{ fontSize: '0.84rem' }}>Tus archivos</strong>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm" onClick={onImportarArchivo}>
                <Upload size={13} aria-hidden="true" /> Importar archivo
              </button>
              <button type="button" className="btn btn-sm" onClick={onExportarEdu}>
                <Download size={13} aria-hidden="true" /> Descargar código
              </button>
            </div>
          </div>

          <span className="section-tag">// juegos 2D listos para jugar</span>
          {EJEMPLOS_EDU.map((ej) => (
            <article key={ej.id} className="drawer-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: '0.88rem' }}>{ej.titulo}</strong>
                <span className="pill-mini ok">{ej.nivel}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--ink-secondary)' }}>
                {ej.subtitulo}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onAbrirCodigoNuevo(ej.id, ej.codigo)}
              >
                <Play size={13} aria-hidden="true" /> Jugar en nueva pestaña
              </button>
            </article>
          ))}
        </div>
      )}

      {/* 5. HISTORIAL DE INSTANTÁNEAS */}
      {panel === 'historial' && (
        <div ref={drawerScrollRef} className="drawer-scroll">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
              {nombrePestanaActual}
            </span>
            <button type="button" className="btn btn-primary btn-sm" onClick={onGuardarInstantanea}>
              <Save size={13} aria-hidden="true" /> Guardar versión
            </button>
          </div>

          {historial.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Cada ejecución guarda una instantánea automática aquí para que puedas volver atrás cuando quieras.
            </p>
          ) : (
            historial.map((snap) => (
              <div key={snap.id} className="drawer-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.82rem' }}>{snap.etiqueta}</strong>
                  <span className="pill-mini">{snap.hora}</span>
                </div>
                <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                  {snap.lineas} líneas
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => onRestaurarInstantanea(snap.codigo)}
                >
                  <RotateCcw size={13} aria-hidden="true" /> Restaurar esta versión
                </button>
              </div>
            ))
          )}
        </div>
      )}
        <ContainerOverlayScrollbar key={panel} targetRef={drawerScrollRef} />
      </div>
    </aside>
  );
}
