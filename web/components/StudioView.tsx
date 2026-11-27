import confetti from 'canvas-confetti';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Blocks,
  Box,
  CheckCircle2,
  Cpu,
  Download,
  FileCode2,
  FolderOpen,
  History,
  Lightbulb,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Save,
  Send,
  SkipForward,
  Square,
  Terminal,
  Trash2,
  Trophy,
  Upload,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

import { BLOQUES_EDU, CATEGORIAS_BLOQUE, type CategoriaBloque } from '../data/bloques';
import { EJEMPLOS_EDU } from '../data/ejemplos';
import type { MisionEdu } from '../data/misiones';
import {
  compilarConApiRemota,
  compilarEdu,
  obtenerPistaPedagogica,
} from '../engine/compilador';
import { formatearCodigoEdu } from '../engine/formateador';
import { ejecutarIntermedio } from '../engine/interprete';
import type {
  Diagnostico,
  NodoArbolVisual,
  ProgramaIntermedio,
  TipoEdu,
  VariableMemoria,
} from '../engine/types';
import { ChispaMascota } from './ChispaLogo';
import { EduEditor, type EduEditorHandle } from './EduEditor';

export interface PestanaCodigo {
  id: string;
  nombre: string;
  codigo: string;
}

interface InstantaneaCodigo {
  id: string;
  pestanaId: string;
  hora: string;
  etiqueta: string;
  lineas: number;
  codigo: string;
}

interface ItemConsola {
  id: number;
  clase: 'salida' | 'pregunta' | 'respuesta' | 'aviso' | 'motivacion';
  texto: string;
  linea: number | null;
}

interface PreguntaPendiente {
  mensaje: string;
  tipo: TipoEdu;
  resolver: (valor: string | null) => void;
}

interface StudioViewProps {
  pestanas: PestanaCodigo[];
  pestanaActivaId: string;
  onCambiarPestana: (id: string) => void;
  onActualizarCodigo: (id: string, codigo: string) => void;
  onNuevaPestana: (nombre?: string, codigo?: string) => void;
  onCerrarPestana: (id: string) => void;
  misionActiva: MisionEdu | null;
  onSalirMision: () => void;
  onCompletarMision: (misionId: string) => void;
  modoMotor: 'navegador' | 'api';
  urlApi: string;
  velocidadMs: number;
  onCambiarVelocidad: (ms: number) => void;
  movimientoReducido: boolean;
}

function ArbolNodo({ nodo, profundidad = 0 }: { nodo: NodoArbolVisual; profundidad?: number }) {
  return (
    <div className={profundidad > 0 ? 'tree-node' : 'mono'} style={{ marginTop: 4 }}>
      <div>
        <strong style={{ color: 'var(--accent)' }}>{nodo.etiqueta}</strong>
        {nodo.detalle && (
          <span style={{ color: 'var(--ink-secondary)', marginLeft: 6 }}>{nodo.detalle}</span>
        )}
        {nodo.linea && (
          <span style={{ color: 'var(--ink-muted)', marginLeft: 6, fontSize: '0.72rem' }}>
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

export function StudioView({
  pestanas,
  pestanaActivaId,
  onCambiarPestana,
  onActualizarCodigo,
  onNuevaPestana,
  onCerrarPestana,
  misionActiva,
  onSalirMision,
  onCompletarMision,
  modoMotor,
  urlApi,
  velocidadMs,
  onCambiarVelocidad,
  movimientoReducido,
}: StudioViewProps) {
  const pestanaActual = pestanas.find((p) => p.id === pestanaActivaId) ?? pestanas[0];
  const editorRef = useRef<EduEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const [mostrarPaleta, setMostrarPaleta] = useState(true);
  const [catPaleta, setCatPaleta] = useState<CategoriaBloque | 'todas'>('todas');
  const [panelDerecho, setPanelDerecho] = useState<'escenario' | 'rayosx' | 'historial'>('escenario');
  const [subRayosX, setSubRayosX] = useState<'tokens' | 'arbol' | 'simbolos' | 'ir'>('tokens');
  const [autoRun, setAutoRun] = useState(false);

  const [estadoEjec, setEstadoEjec] = useState<'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso'>('inactivo');
  const [consola, setConsola] = useState<ItemConsola[]>([]);
  const [variables, setVariables] = useState<VariableMemoria[]>([]);
  const [pilaLlamadas, setPilaLlamadas] = useState<string[]>(['programa']);
  const [lineaActiva, setLineaActiva] = useState<number | null>(null);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [diagnosticosEjec, setDiagnosticosEjec] = useState<Diagnostico[]>([]);
  const [resumenEjec, setResumenEjec] = useState<string | null>(null);
  const [preguntaPendiente, setPreguntaPendiente] = useState<PreguntaPendiente | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [feedbackMision, setFeedbackMision] = useState<{ ok: boolean; texto: string } | null>(null);
  const [historial, setHistorial] = useState<InstantaneaCodigo[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const pasoResolverRef = useRef<((continuar: boolean) => void) | null>(null);
  const modoPasoRef = useRef<boolean>(false);
  const pausadoRef = useRef<boolean>(false);
  const velocidadRef = useRef<number>(velocidadMs);
  velocidadRef.current = velocidadMs;
  const seqConsolaRef = useRef(0);

  const compilacion = useMemo(() => compilarEdu(pestanaActual.codigo, 'intermedio'), [pestanaActual.codigo]);

  const tienePreguntar = useMemo(
    () => compilacion.tokens.some((t) => t.tipo === 'PREGUNTAR'),
    [compilacion.tokens],
  );

  const todosDiagnosticos =
    compilacion.diagnosticos.length > 0 ? compilacion.diagnosticos : diagnosticosEjec;

  const lineasError = useMemo(
    () => todosDiagnosticos.map((d) => d.linea).filter((l): l is number => typeof l === 'number'),
    [todosDiagnosticos],
  );

  const agregarItemConsola = (
    clase: ItemConsola['clase'],
    texto: string,
    linea: number | null = null,
  ) => {
    seqConsolaRef.current += 1;
    const id = seqConsolaRef.current;
    setConsola((prev) => [...prev, { id, clase, texto, linea }]);
  };

  const guardarInstantanea = (etiqueta: string) => {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const nueva: InstantaneaCodigo = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pestanaId: pestanaActual.id,
      hora,
      etiqueta,
      lineas: pestanaActual.codigo.split('\n').length,
      codigo: pestanaActual.codigo,
    };
    setHistorial((prev) => {
      if (prev[0] && prev[0].pestanaId === nueva.pestanaId && prev[0].codigo === nueva.codigo) {
        return prev;
      }
      return [nueva, ...prev].slice(0, 20);
    });
  };

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [consola, preguntaPendiente]);

  const detenerEjecucion = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (pasoResolverRef.current) {
      pasoResolverRef.current(false);
      pasoResolverRef.current = null;
    }
    if (preguntaPendiente) {
      preguntaPendiente.resolver(null);
      setPreguntaPendiente(null);
    }
    pausadoRef.current = false;
    modoPasoRef.current = false;
    setEstadoEjec('inactivo');
    setLineaActiva(null);
  };

  useEffect(() => () => detenerEjecucion(), []);

  const iniciarEjecucion = async (pasoAPaso: boolean, silencioso = false) => {
    detenerEjecucion();
    setConsola([]);
    setVariables([]);
    setPilaLlamadas(['programa']);
    setDiagnosticosEjec([]);
    setResumenEjec(null);
    if (!silencioso) {
      setFeedbackMision(null);
      setPanelDerecho('escenario');
      guardarInstantanea(pasoAPaso ? 'Paso a paso' : 'Ejecución');
    }

    let intermedio: ProgramaIntermedio | null = null;

    if (modoMotor === 'api') {
      try {
        const resRemota = await compilarConApiRemota(urlApi, pestanaActual.codigo);
        if (resRemota.diagnosticos.length > 0 || !resRemota.intermedio) {
          setDiagnosticosEjec(resRemota.diagnosticos);
          return;
        }
        intermedio = resRemota.intermedio;
      } catch {
        setDiagnosticosEjec([
          {
            etapa: 'servicio',
            mensaje: `No se pudo conectar con la API Python en ${urlApi}. Cambia a "Navegador" en Ajustes o inicia uvicorn.`,
            linea: null,
            columna: null,
          },
        ]);
        return;
      }
    } else {
      if (compilacion.diagnosticos.length > 0 || !compilacion.intermedio) {
        return;
      }
      intermedio = compilacion.intermedio;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    modoPasoRef.current = pasoAPaso;
    pausadoRef.current = false;
    setEstadoEjec(pasoAPaso ? 'esperando_paso' : 'corriendo');

    await ejecutarIntermedio(intermedio, {
      signal: controller.signal,
      onEvento: (ev) => {
        if (ev.tipo === 'salida') {
          agregarItemConsola('salida', ev.texto, ev.linea);
        } else if (ev.tipo === 'pregunta') {
          agregarItemConsola('pregunta', ev.mensaje, ev.linea);
        } else if (ev.tipo === 'entrada_invalida') {
          agregarItemConsola('aviso', ev.mensaje, ev.linea);
        } else if (ev.tipo === 'motivacion') {
          agregarItemConsola(
            'motivacion',
            ev.modo === 'juego'
              ? 'Modo juego activado — ¡listo para jugar!'
              : 'Modo calculadora activado — ¡a calcular!',
            ev.linea,
          );
        } else if (ev.tipo === 'paso') {
          setVariables(ev.estado.variables);
          setPilaLlamadas(ev.estado.pilaLlamadas);
          setLineaActiva(ev.estado.linea);
        } else if (ev.tipo === 'fin') {
          setResumenEjec(`Listo en ${ev.duracionMs} ms (${ev.pasosTotales} ops).`);
        } else if (ev.tipo === 'error') {
          setDiagnosticosEjec(ev.diagnosticos);
        }
      },
      leerEntrada: (mensaje, tipo) =>
        new Promise<string | null>((resolve) => {
          setTextoRespuesta('');
          setPreguntaPendiente({ mensaje, tipo, resolver: resolve });
        }),
      esperarPaso: silencioso
        ? undefined
        : async () => {
            if (controller.signal.aborted) return false;
            if (modoPasoRef.current || pausadoRef.current) {
              setEstadoEjec(modoPasoRef.current ? 'esperando_paso' : 'pausado');
              return new Promise<boolean>((resolve) => {
                pasoResolverRef.current = resolve;
              });
            }
            if (velocidadRef.current > 0) {
              await new Promise((r) => setTimeout(r, velocidadRef.current));
            }
            return !controller.signal.aborted;
          },
    });

    if (!controller.signal.aborted) {
      setEstadoEjec('inactivo');
      setLineaActiva(null);
    }
  };

  // Auto-run con debounce de 800 ms (estilo GoJS.app), omitiendo scripts con `preguntar`
  useEffect(() => {
    if (!autoRun || tienePreguntar || compilacion.diagnosticos.length > 0) return;
    const t = setTimeout(() => {
      void iniciarEjecucion(false, true);
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestanaActual.codigo, autoRun, tienePreguntar]);

  const avanzarUnPaso = () => {
    if (pasoResolverRef.current) {
      const fn = pasoResolverRef.current;
      pasoResolverRef.current = null;
      fn(true);
    } else if (estadoEjec === 'inactivo') {
      void iniciarEjecucion(true);
    }
  };

  const alternarPausa = () => {
    if (estadoEjec === 'corriendo') {
      pausadoRef.current = true;
      setEstadoEjec('pausado');
    } else if (estadoEjec === 'pausado' || estadoEjec === 'esperando_paso') {
      pausadoRef.current = false;
      modoPasoRef.current = false;
      setEstadoEjec('corriendo');
      if (pasoResolverRef.current) {
        const fn = pasoResolverRef.current;
        pasoResolverRef.current = null;
        fn(true);
      }
    }
  };

  const formatearActual = () => {
    const formateado = formatearCodigoEdu(pestanaActual.codigo);
    if (formateado !== pestanaActual.codigo) {
      onActualizarCodigo(pestanaActual.id, formateado);
    }
  };

  const enviarRespuesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preguntaPendiente) return;
    const val = textoRespuesta;
    const { resolver } = preguntaPendiente;
    setPreguntaPendiente(null);
    setTextoRespuesta('');
    agregarItemConsola('respuesta', val);
    resolver(val);
  };

  const descargarArchivo = (nombre: string, contenido: string, tipoMime: string) => {
    const blob = new Blob([contenido], { type: tipoMime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onNuevaPestana(file.name, reader.result);
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const comprobarMisionActiva = async () => {
    if (!misionActiva) return;
    const res = await misionActiva.verificar(pestanaActual.codigo);
    setFeedbackMision({ ok: res.completada, texto: res.mensaje });
    if (res.completada) {
      onCompletarMision(misionActiva.id);
      if (
        !movimientoReducido &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        void confetti({ particleCount: 70, spread: 68, origin: { y: 0.65 } });
      }
    }
  };

  const bloquesFiltrados =
    catPaleta === 'todas'
      ? BLOQUES_EDU
      : BLOQUES_EDU.filter((b) => b.categoria === catPaleta);

  const historialPestana = historial.filter((h) => h.pestanaId === pestanaActual.id);

  const estadoMascota: 'feliz' | 'pensando' | 'celebrando' | 'alerta' =
    todosDiagnosticos.length > 0
      ? 'alerta'
      : estadoEjec !== 'inactivo'
        ? 'pensando'
        : resumenEjec
          ? 'celebrando'
          : 'feliz';

  return (
    <div aria-label="Estudio interactivo de programación .edu">
      {misionActiva && (
        <section
          className="panel"
          style={{
            padding: '14px 18px',
            marginBottom: 14,
            borderColor: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
          aria-label={`Misión activa: ${misionActiva.titulo}`}
        >
          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="pill">{misionActiva.etiquetaNivel}</span>
              <strong>{misionActiva.titulo}</strong>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
              {misionActiva.objetivo}
            </p>
            {feedbackMision && (
              <p
                role="status"
                style={{
                  margin: '8px 0 0',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  color: feedbackMision.ok ? 'var(--ok)' : 'var(--err)',
                }}
              >
                {feedbackMision.texto}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ok btn-sm"
              onClick={() => void comprobarMisionActiva()}
            >
              <Trophy size={15} aria-hidden="true" /> Comprobar misión
            </button>
            <button type="button" className="btn btn-sm" onClick={onSalirMision}>
              <X size={15} aria-hidden="true" /> Cerrar misión
            </button>
          </div>
        </section>
      )}

      {/* Barra superior del Estudio */}
      <div className="panel studio-toolbar">
        <div className="studio-tabs" role="region" aria-label="Archivos abiertos en el Estudio">
          {pestanas.map((tab) => (
            <div key={tab.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <button
                type="button"
                aria-current={tab.id === pestanaActual.id ? 'true' : undefined}
                className="studio-tab"
                onClick={() => {
                  detenerEjecucion();
                  onCambiarPestana(tab.id);
                }}
              >
                <FileCode2 size={14} aria-hidden="true" />
                <span>{tab.nombre}</span>
              </button>
              {pestanas.length > 1 && (
                <button
                  type="button"
                  className="studio-tab-close"
                  aria-label={`Cerrar pestaña ${tab.nombre}`}
                  onClick={() => {
                    detenerEjecucion();
                    onCerrarPestana(tab.id);
                  }}
                >
                  <X size={13} aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onNuevaPestana()}
            aria-label="Crear nuevo archivo .edu"
          >
            <Plus size={15} aria-hidden="true" /> Nuevo
          </button>
        </div>

        <div className="studio-controls">
          <button
            type="button"
            className={`autorun-pill ${autoRun ? 'on' : ''}`}
            aria-pressed={autoRun}
            onClick={() => setAutoRun((v) => !v)}
            title="Ejecutar automáticamente al editar (se pausa si el código usa preguntar)"
          >
            <span className="pulse-dot" aria-hidden="true" />
            auto-run {autoRun ? 'on' : 'off'}
          </button>

          <button
            type="button"
            className="btn btn-sm"
            aria-pressed={mostrarPaleta}
            onClick={() => setMostrarPaleta((v) => !v)}
          >
            <Blocks size={15} aria-hidden="true" />
            {mostrarPaleta ? 'Ocultar bloques' : 'Mostrar bloques'}
          </button>

          <label className="sr-only" htmlFor="ejemplo-select">
            Cargar programa de ejemplo
          </label>
          <select
            id="ejemplo-select"
            className="btn btn-sm"
            value=""
            onChange={(e) => {
              const ej = EJEMPLOS_EDU.find((x) => x.id === e.target.value);
              if (ej) {
                detenerEjecucion();
                onNuevaPestana(`${ej.id}.edu`, ej.codigo);
              }
            }}
            aria-label="Cargar programa de ejemplo"
          >
            <option value="">Cargar ejemplo...</option>
            {EJEMPLOS_EDU.map((ej) => (
              <option key={ej.id} value={ej.id}>
                {ej.titulo} ({ej.nivel})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-ok btn-sm"
            onClick={() => void iniciarEjecucion(false)}
            disabled={compilacion.diagnosticos.length > 0 && modoMotor === 'navegador'}
            title="Ejecutar (Ctrl + Enter)"
          >
            <Play size={15} aria-hidden="true" /> Ejecutar
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={avanzarUnPaso}
            disabled={compilacion.diagnosticos.length > 0 && modoMotor === 'navegador'}
          >
            <SkipForward size={15} aria-hidden="true" />
            {estadoEjec === 'esperando_paso' ? 'Siguiente paso' : 'Paso a paso'}
          </button>

          {estadoEjec !== 'inactivo' && (
            <>
              <button type="button" className="btn btn-sm" onClick={alternarPausa}>
                {estadoEjec === 'corriendo' ? (
                  <>
                    <Pause size={15} aria-hidden="true" /> Pausar
                  </>
                ) : (
                  <>
                    <Play size={15} aria-hidden="true" /> Continuar
                  </>
                )}
              </button>
              <button type="button" className="btn btn-sm" onClick={detenerEjecucion}>
                <Square size={14} aria-hidden="true" /> Detener
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cuerpo principal de 3 columnas */}
      <div className={`studio-layout ${mostrarPaleta ? '' : 'palette-collapsed'}`}>
        {mostrarPaleta && (
          <aside className="panel blocks-drawer" aria-label="Paleta de bloques .edu">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: '1rem' }}>Bloques .edu</h2>
              <span className="pill">Clic o arrastra</span>
            </div>

            <div className="cat-filter-row" role="group" aria-label="Filtrar bloques por categoría">
              <button
                type="button"
                className="cat-chip"
                aria-pressed={catPaleta === 'todas'}
                onClick={() => setCatPaleta('todas')}
              >
                Todos
              </button>
              {CATEGORIAS_BLOQUE.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className="cat-chip"
                  aria-pressed={catPaleta === cat.id}
                  onClick={() => setCatPaleta(cat.id)}
                >
                  {cat.nombre.split(' ')[0]}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bloquesFiltrados.map((bloque) => {
                const cat = CATEGORIAS_BLOQUE.find((c) => c.id === bloque.categoria)!;
                return (
                  <button
                    key={bloque.id}
                    type="button"
                    className="brick-btn"
                    style={{ '--cat-color': cat.colorVar } as React.CSSProperties}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/x-edu-snippet', bloque.plantilla);
                    }}
                    onClick={() => editorRef.current?.insertSnippet(bloque.plantilla)}
                  >
                    <span className="brick-title">{bloque.etiquetaCorta}</span>
                    <span className="brick-scratch">{bloque.bloqueScratch}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* EDITOR CODEMIRROR 6 */}
        <section className="panel editor-card" aria-label="Editor de código fuente">
          <div className="editor-meta-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {compilacion.diagnosticos.length === 0 ? (
                <span className="status-pill ok">
                  <CheckCircle2 size={14} aria-hidden="true" />
                  Sin errores · {compilacion.duracionMs.toFixed(1)} ms
                </span>
              ) : (
                <span className="status-pill err">
                  <AlertTriangle size={14} aria-hidden="true" />
                  {compilacion.diagnosticos.length}{' '}
                  {compilacion.diagnosticos.length === 1 ? 'aviso' : 'avisos'}
                </span>
              )}
              {lineaActiva && (
                <span className="status-pill run">
                  <Zap size={13} aria-hidden="true" /> Línea {lineaActiva}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={formatearActual}
                title="Indentar código automáticamente (Ctrl + Shift + F)"
              >
                <Wand2 size={14} aria-hidden="true" /> Formatear
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".edu,.txt"
                onChange={importarArchivo}
                className="sr-only"
                aria-label="Importar archivo .edu"
              />
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => fileInputRef.current?.click()}
                title="Abrir archivo .edu desde tu equipo"
              >
                <Upload size={14} aria-hidden="true" /> Abrir
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  descargarArchivo(pestanaActual.nombre, pestanaActual.codigo, 'text/plain;charset=utf-8')
                }
                title="Descargar código fuente .edu"
              >
                <Download size={14} aria-hidden="true" /> .edu
              </button>
              <button
                type="button"
                className="btn btn-sm"
                disabled={!compilacion.intermedio}
                onClick={() => {
                  if (!compilacion.intermedio) return;
                  descargarArchivo(
                    pestanaActual.nombre.replace(/\.edu$/i, '') + '.ir.json',
                    JSON.stringify(compilacion.intermedio, null, 2),
                    'application/json;charset=utf-8',
                  );
                }}
                title="Exportar código intermedio JSON v1"
              >
                <FolderOpen size={14} aria-hidden="true" /> .ir.json
              </button>
            </div>
          </div>

          <EduEditor
            ref={editorRef}
            value={pestanaActual.codigo}
            onChange={(nuevo) => onActualizarCodigo(pestanaActual.id, nuevo)}
            activeLine={lineaActiva}
            hoverLine={hoverLine}
            errorLines={lineasError}
            onShortcutRun={() => void iniciarEjecucion(false)}
            onShortcutFormat={formatearActual}
          />
        </section>

        {/* PANEL DERECHO: ESCENARIO | RAYOS X | HISTORIAL */}
        <section className="right-pane" aria-label="Salida, memoria, rayos X e historial">
          <div className="panel" style={{ overflow: 'hidden' }}>
            <div className="subtabs" role="tablist" aria-label="Vistas del panel derecho">
              <button
                type="button"
                role="tab"
                aria-selected={panelDerecho === 'escenario'}
                className="subtab-btn"
                onClick={() => setPanelDerecho('escenario')}
              >
                <Terminal size={15} aria-hidden="true" /> Escenario
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panelDerecho === 'rayosx'}
                className="subtab-btn"
                onClick={() => setPanelDerecho('rayosx')}
              >
                <Cpu size={15} aria-hidden="true" /> Rayos X
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={panelDerecho === 'historial'}
                className="subtab-btn"
                onClick={() => setPanelDerecho('historial')}
              >
                <History size={15} aria-hidden="true" /> Historial ({historialPestana.length})
              </button>
            </div>

            {panelDerecho === 'escenario' && (
              <div className="stage-body">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ChispaMascota estado={estadoMascota} size={40} />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.94rem' }}>
                        Escenario de Chispa
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                        {resumenEjec ??
                          (estadoEjec === 'inactivo'
                            ? 'Pulsa Ejecutar (Ctrl+Enter) o Paso a paso'
                            : 'Programa en marcha...')}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label htmlFor="speed-select" className="sr-only">
                      Velocidad de animación
                    </label>
                    <select
                      id="speed-select"
                      className="btn btn-sm"
                      value={String(velocidadMs)}
                      onChange={(e) => onCambiarVelocidad(Number(e.target.value))}
                      aria-label="Velocidad de ejecución"
                    >
                      <option value="0">Turbo (instantáneo)</option>
                      <option value="180">Normal (animado)</option>
                      <option value="450">Lento (didáctico)</option>
                    </select>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => {
                        setConsola([]);
                        setResumenEjec(null);
                      }}
                      aria-label="Limpiar consola"
                      title="Limpiar consola"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="console-feed" role="log" aria-live="polite" aria-label="Salida del programa">
                  {consola.length === 0 && !preguntaPendiente && (
                    <p style={{ margin: 'auto', textAlign: 'center', fontSize: '0.86rem', color: 'var(--ink-muted)' }}>
                      Aquí aparecerán las salidas de <code className="mono">mostrar</code>. Pasa el
                      ratón o haz clic sobre cualquier salida para saltar a su línea.
                    </p>
                  )}

                  {consola.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`speech-bubble interactive-bubble ${
                        item.clase === 'respuesta'
                          ? 'user-reply'
                          : item.clase === 'aviso'
                            ? 'warn-bubble'
                            : item.clase === 'motivacion'
                              ? 'badge-bubble'
                              : ''
                      }`}
                      onMouseEnter={() => setHoverLine(item.linea)}
                      onMouseLeave={() => setHoverLine(null)}
                      onClick={() => {
                        if (item.linea) editorRef.current?.focusLine(item.linea, 1);
                      }}
                    >
                      <span>{item.texto}</span>
                      {item.linea && <span className="line-tag">L{item.linea}</span>}
                    </button>
                  ))}
                  <div ref={consoleEndRef} />
                </div>

                {preguntaPendiente && (
                  <div className="prompt-box" role="region" aria-label="Responder pregunta del programa">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{preguntaPendiente.mensaje}</strong>
                      <span className="pill">Tipo esperado: {preguntaPendiente.tipo}</span>
                    </div>
                    <form className="prompt-form" onSubmit={enviarRespuesta}>
                      <label htmlFor="respuesta-edu" className="sr-only">
                        Escribe tu respuesta
                      </label>
                      <input
                        id="respuesta-edu"
                        type="text"
                        className="text-input"
                        value={textoRespuesta}
                        onChange={(e) => setTextoRespuesta(e.target.value)}
                        placeholder={
                          preguntaPendiente.tipo === 'numero'
                            ? 'Escribe un número (ej. 5)'
                            : preguntaPendiente.tipo === 'logico'
                              ? 'verdadero o falso'
                              : 'Escribe tu respuesta...'
                        }
                        autoFocus
                      />
                      <button type="submit" className="btn btn-primary">
                        <Send size={15} aria-hidden="true" /> Responder
                      </button>
                    </form>
                  </div>
                )}

                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <h3 style={{ fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Box size={16} aria-hidden="true" /> Cajitas de memoria
                    </h3>
                    <span className="pill">Pila: {pilaLlamadas.join(' → ')}</span>
                  </div>

                  {variables.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--ink-muted)' }}>
                      Ejecuta el programa para ver tus variables crearse y actualizarse aquí.
                    </p>
                  ) : (
                    <div className="memory-grid">
                      {variables.map((v) => (
                        <div
                          key={v.idInterno}
                          className={`memory-box ${v.cambioReciente ? 'changed' : ''}`}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <span className="memory-name">{v.nombre}</span>
                            <span className="pill" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
                              {v.tipo}
                            </span>
                          </div>
                          <span className="memory-val">{v.valor}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {todosDiagnosticos.length > 0 && (
                  <div className="diag-list" role="alert" aria-label="Avisos del compilador">
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--err)' }}>
                      Avisos del compilador ({todosDiagnosticos.length})
                    </h3>
                    {todosDiagnosticos.map((diag, idx) => {
                      const pista = obtenerPistaPedagogica(diag);
                      return (
                        <button
                          key={idx}
                          type="button"
                          className="diag-card"
                          onClick={() => {
                            if (diag.linea) {
                              editorRef.current?.focusLine(diag.linea, diag.columna);
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <strong style={{ fontSize: '0.86rem' }}>
                              [{diag.etapa}] {diag.linea ? `Línea ${diag.linea}:${diag.columna ?? 1}` : 'General'}
                            </strong>
                            <span className="pill">Ir a línea</span>
                          </div>
                          <span className="mono" style={{ fontSize: '0.82rem' }}>
                            {diag.mensaje}
                          </span>
                          <div className="diag-hint">
                            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Lightbulb size={14} aria-hidden="true" /> {pista.titulo}:
                            </strong>{' '}
                            {pista.explicacion}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {panelDerecho === 'rayosx' && (
              <div className="stage-body">
                <div className="cat-filter-row" role="tablist" aria-label="Etapas del compilador">
                  {(
                    [
                      ['tokens', `1. Tokens (${compilacion.tokens.length - 1})`],
                      ['arbol', '2. Árbol'],
                      ['simbolos', `3. Símbolos (${compilacion.simbolos.length})`],
                      ['ir', `4. Código IR (${compilacion.intermedio?.instrucciones.length ?? 0})`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={subRayosX === id}
                      className="cat-chip"
                      aria-pressed={subRayosX === id}
                      onClick={() => setSubRayosX(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {subRayosX === 'tokens' && (
                  <div className="xray-table-wrap">
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
                          .slice(0, 200)
                          .map((t, i) => (
                            <tr key={i}>
                              <td>
                                {t.linea}:{t.columna}
                              </td>
                              <td>{t.tipo}</td>
                              <td>{t.texto}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {subRayosX === 'arbol' && (
                  <div className="xray-table-wrap" style={{ padding: 12 }}>
                    {compilacion.arbolVisual ? (
                      <ArbolNodo nodo={compilacion.arbolVisual} />
                    ) : (
                      <p style={{ margin: 0, color: 'var(--ink-muted)', fontSize: '0.86rem' }}>
                        Corrige los errores léxicos o sintácticos para inspeccionar el árbol sintáctico.
                      </p>
                    )}
                  </div>
                )}

                {subRayosX === 'simbolos' && (
                  <div className="xray-table-wrap">
                    <table className="xray-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Tipo</th>
                          <th>Ámbito</th>
                          <th>Línea</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compilacion.simbolos.length === 0 ? (
                          <tr>
                            <td colSpan={4}>Todavía no hay variables ni funciones declaradas.</td>
                          </tr>
                        ) : (
                          compilacion.simbolos.map((s, i) => (
                            <tr key={i}>
                              <td>{s.esFuncion ? s.firma : s.nombre}</td>
                              <td>{s.tipo}</td>
                              <td>{s.ambito}</td>
                              <td>{s.linea}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {subRayosX === 'ir' && (
                  <div className="xray-table-wrap">
                    {compilacion.intermedio ? (
                      <table className="xray-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Op</th>
                            <th>Arg 1</th>
                            <th>Arg 2</th>
                            <th>Dest</th>
                            <th>L</th>
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
                              <td>{ins.linea ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ padding: 12, margin: 0, color: 'var(--ink-muted)', fontSize: '0.86rem' }}>
                        El código intermedio se genera cuando el programa pasa el análisis semántico sin errores.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {panelDerecho === 'historial' && (
              <div className="stage-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.92rem' }}>
                      Instantáneas de {pestanaActual.nombre}
                    </strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                      Cada ejecución guarda un punto de restauración automático
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => guardarInstantanea('Guardado manual')}
                  >
                    <Save size={14} aria-hidden="true" /> Guardar versión
                  </button>
                </div>

                {historialPestana.length === 0 ? (
                  <p style={{ margin: '10px 0 0', fontSize: '0.86rem', color: 'var(--ink-muted)' }}>
                    Todavía no hay instantáneas. Ejecuta tu código o pulsa «Guardar versión».
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {historialPestana.map((snap) => (
                      <div
                        key={snap.id}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--bg-surface-alt)',
                          border: '1.5px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.86rem' }}>
                            {snap.etiqueta} · {snap.hora}
                          </strong>
                          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                            {snap.lineas} líneas
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onActualizarCodigo(pestanaActual.id, snap.codigo)}
                        >
                          <RotateCcw size={13} aria-hidden="true" /> Restaurar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
