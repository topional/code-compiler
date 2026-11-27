/**
 * Panel lateral derecho acoplado al Dock de iconos (estilo GoJS.app + Codédex):
 * - Misiones guiadas con XP y comprobación en vivo
 * - Rayos X del Compilador (Tokens, Árbol, Símbolos, IR v1)
 * - Guía rápida Scratch ↔ .edu con búsqueda Fuse.js
 * - Ejemplos oficiales + Importar / Exportar archivos
 * - Historial de instantáneas
 */

import Fuse from 'fuse.js';
import { useMemo, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
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
import type { NodoArbolVisual, ResultadoCompilacion } from '../engine/types';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';

export type PanelDerechoTipo = 'misiones' | 'rayosx' | 'guia' | 'ejemplos' | 'historial' | null;

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
  compilacion: ResultadoCompilacion;
  misionesCompletadas: string[];
  misionActiva: MisionEdu | null;
  onIniciarMision: (m: MisionEdu) => void;
  onComprobarMision: () => void;
  feedbackMision: { ok: boolean; texto: string } | null;
  onInsertarBloque: (codigo: string) => void;
  onAbrirCodigoNuevo: (nombre: string, codigo: string) => void;
  onImportarArchivo: () => void;
  onExportarEdu: () => void;
  onExportarIr: () => void;
  historial: InstantaneaCodigo[];
  onGuardarInstantanea: () => void;
  onRestaurarInstantanea: (codigo: string) => void;
  nombrePestanaActual: string;
  mobileVisible?: boolean;
}

function ArbolNodo({ nodo, profundidad = 0 }: { nodo: NodoArbolVisual; profundidad?: number }) {
  return (
    <div className={profundidad > 0 ? 'tree-node' : 'mono'} style={{ marginTop: 3 }}>
      <div>
        <strong style={{ color: 'var(--accent)' }}>{nodo.etiqueta}</strong>
        {nodo.detalle && (
          <span style={{ color: 'var(--ink-secondary)', marginLeft: 5 }}>{nodo.detalle}</span>
        )}
        {nodo.linea && (
          <span style={{ color: 'var(--ink-muted)', marginLeft: 5, fontSize: '0.68rem' }}>
            L{nodo.linea}
          </span>
        )}
      </div>
      {nodo.hijos.map((h, i) => (
        <ArbolNodo key={`${h.etiqueta}-${i}`} nodo={h} profundidad={profundidad + 1} />
      ))}
    </div>
  );
}

export function RightDrawer({
  panel,
  onCerrar,
  compilacion,
  misionesCompletadas,
  misionActiva,
  onIniciarMision,
  onComprobarMision,
  feedbackMision,
  onInsertarBloque,
  onAbrirCodigoNuevo,
  onImportarArchivo,
  onExportarEdu,
  onExportarIr,
  historial,
  onGuardarInstantanea,
  onRestaurarInstantanea,
  nombrePestanaActual,
  mobileVisible = false,
}: RightDrawerProps) {
  const [subRayosX, setSubRayosX] = useState<'tokens' | 'arbol' | 'simbolos' | 'ir'>('tokens');
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
    rayosx: { texto: 'Rayos X del Compilador', icono: <Cpu size={14} aria-hidden="true" /> },
    guia: { texto: 'Guía Scratch ↔ .edu', icono: <BookOpen size={14} aria-hidden="true" /> },
    ejemplos: { texto: 'Ejemplos y Archivos', icono: <FolderOpen size={14} aria-hidden="true" /> },
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

      {/* 2. RAYOS X DEL COMPILADOR */}
      {panel === 'rayosx' && (
        <div ref={drawerScrollRef} className="drawer-scroll">
          <div className="sub-tabs-row" role="group" aria-label="Etapa del compilador">
            {(
              [
                ['tokens', `Tokens (${Math.max(0, compilacion.tokens.length - 1)})`],
                ['arbol', 'Árbol'],
                ['simbolos', `Símbolos (${compilacion.simbolos.length})`],
                ['ir', `IR (${compilacion.intermedio?.instrucciones.length ?? 0})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="sub-pill"
                aria-pressed={subRayosX === id}
                onClick={() => setSubRayosX(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {subRayosX === 'tokens' && (
            <div className="xray-table-wrap" tabIndex={0}>
              <table className="xray-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Token</th>
                    <th>Lexema</th>
                  </tr>
                </thead>
                <tbody>
                  {compilacion.tokens
                    .filter((t) => t.tipo !== 'EOF' && t.tipo !== 'SALTO_LINEA')
                    .slice(0, 180)
                    .map((t, i) => (
                      <tr key={i}>
                        <td>{t.linea}:{t.columna}</td>
                        <td>{t.tipo}</td>
                        <td>{t.texto}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {subRayosX === 'arbol' && (
            <div className="xray-table-wrap" style={{ padding: 10 }} tabIndex={0}>
              {compilacion.arbolVisual ? (
                <ArbolNodo nodo={compilacion.arbolVisual} />
              ) : (
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                  Corrige los errores léxicos o sintácticos para ver el árbol sintáctico.
                </p>
              )}
            </div>
          )}

          {subRayosX === 'simbolos' && (
            <div className="xray-table-wrap" tabIndex={0}>
              <table className="xray-table">
                <thead>
                  <tr>
                    <th>Símbolo</th>
                    <th>Tipo</th>
                    <th>Ámbito</th>
                  </tr>
                </thead>
                <tbody>
                  {compilacion.simbolos.length === 0 ? (
                    <tr>
                      <td colSpan={3}>Sin variables ni funciones declaradas.</td>
                    </tr>
                  ) : (
                    compilacion.simbolos.map((s, i) => (
                      <tr key={i}>
                        <td>{s.esFuncion ? s.firma : s.nombre}</td>
                        <td>{s.tipo}</td>
                        <td>{s.ambito}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {subRayosX === 'ir' && (
            <>
              <button
                type="button"
                className="btn btn-sm"
                disabled={!compilacion.intermedio}
                onClick={onExportarIr}
              >
                <Download size={13} aria-hidden="true" /> Exportar código intermedio (.ir.json)
              </button>
              <div className="xray-table-wrap" tabIndex={0}>
                {compilacion.intermedio ? (
                  <table className="xray-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Op</th>
                        <th>A1</th>
                        <th>A2</th>
                        <th>Dest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compilacion.intermedio.instrucciones.map((ins, i) => (
                        <tr key={i}>
                          <td>{i}</td>
                          <td>{ins.operacion}</td>
                          <td>{ins.argumento1 ?? '—'}</td>
                          <td>{ins.argumento2 ?? '—'}</td>
                          <td>{ins.resultado ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={{ padding: 10, margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                    El código IR v1 se genera al pasar el análisis semántico sin errores.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. GUÍA VISUAL SCRATCH <-> .EDU CON FUSE.JS */}
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
            <strong style={{ fontSize: '0.84rem' }}>Archivos locales</strong>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm" onClick={onImportarArchivo}>
                <Upload size={13} aria-hidden="true" /> Abrir .edu
              </button>
              <button type="button" className="btn btn-sm" onClick={onExportarEdu}>
                <Download size={13} aria-hidden="true" /> Guardar .edu
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={!compilacion.intermedio}
                onClick={onExportarIr}
              >
                <Download size={13} aria-hidden="true" /> .ir.json
              </button>
            </div>
          </div>

          <span className="section-tag">// programas de ejemplo .edu</span>
          {EJEMPLOS_EDU.map((ej) => (
            <article key={ej.id} className="drawer-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: '0.88rem' }}>{ej.titulo}</strong>
                <span className="pill-mini">{ej.nivel}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--ink-secondary)' }}>
                {ej.subtitulo}
              </p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onAbrirCodigoNuevo(`${ej.id}.edu`, ej.codigo)}
              >
                <Play size={13} aria-hidden="true" /> Abrir en nueva pestaña
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
