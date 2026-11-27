import { motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Blocks,
  BookOpen,
  Check,
  Code2,
  Cpu,
  Layers,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Trophy,
  Zap,
} from 'lucide-react';

import { CODIGO_HERO_DEFAULT, EJEMPLOS_EDU, type EjemploEdu } from '../data/ejemplos';
import { TEMAS_CATALOGO, type TemaId } from '../data/temas';
import { compilarEdu } from '../engine/compilador';
import { ejecutarIntermedio } from '../engine/interprete';
import type { VariableMemoria } from '../engine/types';
import { ChispaMascota } from './ChispaLogo';
import { EduEditor, type EduEditorHandle } from './EduEditor';

interface HeroLandingProps {
  onAbrirEstudio: (codigo?: string, titulo?: string) => void;
  onIrMisiones: () => void;
  onIrGuia: () => void;
  misionesCompletadas: number;
  totalMisiones: number;
  temaActual: TemaId;
  onCambiarTema: (tema: TemaId) => void;
}

const DEMO_BLOQUES = [
  {
    id: 'dado',
    etiqueta: 'Lanzar dado (azar)',
    color: 'var(--cat-operador)',
    bg: 'var(--cat-operador-bg)',
    bloqueScratch: 'Dar a [dado] valor (número al azar entre 1 y 6)',
    codigo:
      'crear variable dado\nasignar dado valor de numero aleatorio entre 1 y 6\nmostrar "Salió el dado:"\nmostrar dado',
  },
  {
    id: 'decision',
    etiqueta: 'Decidir con si / sino',
    color: 'var(--cat-control)',
    bg: 'var(--cat-control-bg)',
    bloqueScratch: 'Si <(puntos) >= (50)> entonces decir ["¡Ganaste!"]',
    codigo:
      'crear variable puntos\nasignar puntos valor de 75\nsi puntos es mayor o igual que 50 entonces\n    mostrar "¡Nivel superado!"\nsino\n    mostrar "Sigue intentando"\nfin',
  },
  {
    id: 'ciclo',
    etiqueta: 'Repetir 3 veces',
    color: 'var(--cat-io)',
    bg: 'var(--cat-io-bg)',
    bloqueScratch: 'Repetir (3) veces → decir [contador]',
    codigo:
      'crear variable paso\nasignar paso valor de 1\nrepetir 3 veces\n    mostrar paso\n    asignar paso valor de paso + 1\nfin',
  },
  {
    id: 'funcion',
    etiqueta: 'Función recursiva',
    color: 'var(--cat-funcion)',
    bg: 'var(--cat-funcion-bg)',
    bloqueScratch: 'Mis bloques: factorial (numero n)',
    codigo:
      'definir factorial(numero n) devuelve numero\n    si n es menor o igual que 1 entonces\n        devolver 1\n    fin\n    devolver n * factorial(n - 1)\nfin\nmostrar factorial(5)',
  },
];

const PIPELINE_SAMPLE = `crear variable total
asignar total valor de 2 + 3 * 4
mostrar total`;

export function HeroLanding({
  onAbrirEstudio,
  onIrMisiones,
  onIrGuia,
  misionesCompletadas,
  totalMisiones,
  temaActual,
  onCambiarTema,
}: HeroLandingProps) {
  const editorRef = useRef<EduEditorHandle | null>(null);
  const [codigoHero, setCodigoHero] = useState(CODIGO_HERO_DEFAULT);
  const [autoRun, setAutoRun] = useState(true);
  const [salidas, setSalidas] = useState<{ texto: string; linea: number | null }[]>([]);
  const [variables, setVariables] = useState<VariableMemoria[]>([]);
  const [tiempoMs, setTiempoMs] = useState<number>(0.1);
  const [errores, setErrores] = useState<string[]>([]);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Estado del Showcase 1 (Bloques Scratch -> .edu interactivo)
  const [demoBloqueId, setDemoBloqueId] = useState(DEMO_BLOQUES[0].id);
  const demoBloque = DEMO_BLOQUES.find((b) => b.id === demoBloqueId) ?? DEMO_BLOQUES[0];
  const [demoSalida, setDemoSalida] = useState<string[]>([]);

  // Estado del Showcase 2 (Pipeline 4 etapas en vivo)
  const [etapaPipeline, setEtapaPipeline] = useState<'lexer' | 'parser' | 'semantico' | 'ir'>('lexer');
  const compPipeline = useMemo(() => compilarEdu(PIPELINE_SAMPLE, 'intermedio'), []);

  const correrHero = async (fuente: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const comp = compilarEdu(fuente, 'intermedio');
    if (comp.diagnosticos.length > 0 || !comp.intermedio) {
      setErrores(comp.diagnosticos.map((d) => `Línea ${d.linea ?? '?'}: ${d.mensaje}`));
      setSalidas([]);
      setVariables([]);
      return;
    }

    setErrores([]);
    const nuevasSalidas: { texto: string; linea: number | null }[] = [];
    let ultimasVars: VariableMemoria[] = [];

    await ejecutarIntermedio(comp.intermedio, {
      signal: controller.signal,
      onEvento: (ev) => {
        if (ev.tipo === 'salida') nuevasSalidas.push({ texto: ev.texto, linea: ev.linea });
        else if (ev.tipo === 'paso') ultimasVars = ev.estado.variables;
        else if (ev.tipo === 'fin') setTiempoMs(Math.max(0.1, ev.duracionMs));
        else if (ev.tipo === 'error') setErrores(ev.diagnosticos.map((d) => d.mensaje));
      },
      leerEntrada: async () => 'Explorador',
      maxPasos: 8000,
    });

    if (!controller.signal.aborted) {
      setSalidas(nuevasSalidas);
      setVariables(ultimasVars);
    }
  };

  // Ejecución inmediata en la primera carga + auto-run con debounce al editar
  const primeraCargaRef = useRef(true);
  useEffect(() => {
    if (primeraCargaRef.current) {
      primeraCargaRef.current = false;
      void correrHero(codigoHero);
      return;
    }
    if (!autoRun) return;
    const t = setTimeout(() => {
      void correrHero(codigoHero);
    }, 350);
    return () => clearTimeout(t);
  }, [codigoHero, autoRun]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Ejecutar la demo interactiva de bloque Scratch -> .edu
  useEffect(() => {
    let cancelado = false;
    const comp = compilarEdu(demoBloque.codigo, 'intermedio');
    if (!comp.intermedio) return;
    const out: string[] = [];
    void ejecutarIntermedio(comp.intermedio, {
      onEvento: (ev) => {
        if (ev.tipo === 'salida') out.push(ev.texto);
      },
      leerEntrada: async () => '1',
      maxPasos: 2000,
    }).then(() => {
      if (!cancelado) setDemoSalida(out);
    });
    return () => {
      cancelado = true;
    };
  }, [demoBloque]);

  const abrirEjemplo = (ej: EjemploEdu) => {
    onAbrirEstudio(ej.codigo, `${ej.id}.edu`);
  };

  return (
    <div>
      {/* 1. HERO CINEMATOGRÁFICO (GoJS.app + Scratch) */}
      <section className="hero-grid" aria-labelledby="hero-heading">
        <motion.div
          initial={{ y: 14 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.38, ease: 'easeOut' }}
        >
          <span className="hero-kicker">
            <Sparkles size={15} aria-hidden="true" />
            // code compiler · lenguaje educativo .edu
          </span>

          <h1 id="hero-heading" className="hero-title">
            Escribe en español.{' '}
            <span className="hero-title-muted">Mira cada línea responder</span>
            <span className="hero-cursor" aria-hidden="true" />
          </h1>

          <p className="hero-lead">
            <strong>Chispa .edu</strong> convierte tu compilador académico en un estudio vivo:
            bloques estilo Scratch, ejecución automática en milisegundos, depurador paso a paso con
            cajitas de memoria, Rayos X de las 4 etapas y 10 temas diseñados a mano.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onAbrirEstudio(codigoHero, 'mi_primer_codigo.edu')}
            >
              <Code2 size={18} aria-hidden="true" />
              Empezar a programar
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            <button type="button" className="btn" onClick={onIrMisiones}>
              <Trophy size={18} aria-hidden="true" />
              Misiones ({misionesCompletadas}/{totalMisiones})
            </button>
            <button type="button" className="btn" onClick={onIrGuia}>
              <BookOpen size={18} aria-hidden="true" />
              Guía Scratch → .edu
            </button>
          </div>

          <div className="hero-manifesto" aria-label="Principios del proyecto">
            <span>Sin instalar nada.</span>
            <span aria-hidden="true">·</span>
            <span>Sin servidor obligatorio.</span>
            <span aria-hidden="true">·</span>
            <span>100 % en español y código abierto.</span>
          </div>
        </motion.div>

        {/* VENTANA PLAYGROUND CON HALO PIXEL-MATRIX (estilo GoJS.app) */}
        <motion.div
          className="hero-playground-frame"
          initial={{ y: 16, scale: 0.99 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
        >
          <div className="pixel-halo" aria-hidden="true" />
          <div className="hero-playground" aria-label="Playground vivo de bienvenida">
            <div className="window-chrome">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="window-dots" aria-hidden="true">
                  <span className="win-dot d1" />
                  <span className="win-dot d2" />
                  <span className="win-dot d3" />
                </span>
                <span className="mono" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  dado_magico.edu
                </span>
                <button
                  type="button"
                  className={`autorun-pill ${autoRun ? 'on' : ''}`}
                  aria-pressed={autoRun}
                  onClick={() => setAutoRun((v) => !v)}
                >
                  <span className="pulse-dot" aria-hidden="true" />
                  auto-run {autoRun ? 'on' : 'off'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="timing-pill" aria-live="polite">
                  <Zap size={12} aria-hidden="true" /> {tiempoMs.toFixed(1)} ms
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setCodigoHero(CODIGO_HERO_DEFAULT);
                    void correrHero(CODIGO_HERO_DEFAULT);
                  }}
                  aria-label="Restaurar ejemplo inicial"
                  title="Restaurar"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn btn-ok btn-sm"
                  onClick={() => void correrHero(codigoHero)}
                >
                  <Play size={14} aria-hidden="true" />
                  Ejecutar
                </button>
              </div>
            </div>

            <div className="hero-playground-body">
              <div className="hero-code-col">
                <EduEditor
                  ref={editorRef}
                  value={codigoHero}
                  onChange={setCodigoHero}
                  hoverLine={hoverLine}
                  compact
                  ariaLabel="Editor rápido en vivo en lenguaje .edu"
                  onShortcutRun={() => void correrHero(codigoHero)}
                />
              </div>

              <div className="hero-output-col" aria-live="polite">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ChispaMascota
                    estado={errores.length > 0 ? 'alerta' : 'celebrando'}
                    size={36}
                  />
                  <div>
                    <strong style={{ fontSize: '0.86rem', display: 'block' }}>
                      Escenario vivo
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                      Pasa el ratón por una salida para iluminar su línea
                    </span>
                  </div>
                </div>

                {errores.length > 0 ? (
                  <div className="diag-card" role="alert">
                    <strong>Aviso del compilador:</strong>
                    {errores.map((e, i) => (
                      <span key={i} className="mono" style={{ fontSize: '0.78rem' }}>
                        {e}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {salidas.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="speech-bubble interactive-bubble"
                        onMouseEnter={() => setHoverLine(s.linea)}
                        onMouseLeave={() => setHoverLine(null)}
                        onClick={() => {
                          if (s.linea) editorRef.current?.focusLine(s.linea, 1);
                        }}
                      >
                        <span>{s.texto}</span>
                        {s.linea && <span className="line-tag">L{s.linea}</span>}
                      </button>
                    ))}
                  </div>
                )}

                {variables.length > 0 && (
                  <div style={{ marginTop: 'auto', paddingTop: 6 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'var(--ink-muted)',
                        display: 'block',
                        marginBottom: 6,
                      }}
                    >
                      CAJITAS EN MEMORIA
                    </span>
                    <div className="memory-grid compact-mem">
                      {variables.map((v) => (
                        <div key={v.idInterno} className="memory-box">
                          <span className="memory-name">{v.nombre}</span>
                          <span className="memory-val">{v.valor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 2. TRÍADA DE PILARES (estilo GoJS JS / TS / Node) */}
      <section className="section-block" aria-labelledby="pillars-heading">
        <span className="section-tag">// tres mundos en un solo lugar</span>
        <h2 id="pillars-heading" style={{ fontSize: 'clamp(1.5rem, 2.7vw, 2.15rem)', marginBottom: 18 }}>
          Diseñado para aprender sin fricción y enseñar con rigor real
        </h2>
        <div className="pillars-grid">
          <article className="panel pillar-card">
            <span className="pillar-icon" style={{ color: 'var(--cat-variable)', background: 'var(--cat-variable-bg)' }}>
              <Blocks size={22} aria-hidden="true" />
            </span>
            <h3 style={{ fontSize: '1.2rem' }}>Puente Scratch → Texto</h3>
            <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
              Cada palabra reservada conserva los colores mentales de Scratch. Haz clic o arrastra
              fichas para escribir código válido sin bloquearse ante una pantalla en blanco.
            </p>
          </article>

          <article className="panel pillar-card">
            <span className="pillar-icon" style={{ color: 'var(--cat-io)', background: 'var(--cat-io-bg)' }}>
              <Cpu size={22} aria-hidden="true" />
            </span>
            <h3 style={{ fontSize: '1.2rem' }}>Compilador real de 4 etapas</h3>
            <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
              Lexer, Parser, Analizador Semántico con tabla de símbolos y Código Intermedio de 3
              direcciones (JSON v1), con aritmética exacta de fracciones y paridad 100 % con Python.
            </p>
          </article>

          <article className="panel pillar-card">
            <span className="pillar-icon" style={{ color: 'var(--cat-operador)', background: 'var(--cat-operador-bg)' }}>
              <Terminal size={22} aria-hidden="true" />
            </span>
            <h3 style={{ fontSize: '1.2rem' }}>Depurador paso a paso vivo</h3>
            <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '0.92rem' }}>
              Avanza instrucción por instrucción, observa tus cajitas de memoria actualizarse,
              guarda instantáneas del código y recibe pistas pedagógicas cuando hay un error.
            </p>
          </article>
        </div>
      </section>

      {/* 3. SHOWCASE INTERACTIVO A: De bloque Scratch a código vivo */}
      <section className="section-block showcase-split" aria-labelledby="showcase-blocks-heading">
        <div>
          <span className="section-tag">// 01 · transición natural</span>
          <h2 id="showcase-blocks-heading" style={{ fontSize: 'clamp(1.5rem, 2.7vw, 2.2rem)', marginBottom: 12 }}>
            Cada bloque de Scratch tiene su espejo exacto en español.
          </h2>
          <p style={{ color: 'var(--ink-secondary)', marginBottom: 16 }}>
            Pulsa cualquier bloque para ver cómo se transforma en instrucciones `.edu` y qué imprime
            el intérprete al instante.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DEMO_BLOQUES.map((b) => (
              <button
                key={b.id}
                type="button"
                className="cat-chip"
                aria-pressed={b.id === demoBloque.id}
                onClick={() => setDemoBloqueId(b.id)}
              >
                {b.etiqueta}
              </button>
            ))}
          </div>
        </div>

        <div className="panel showcase-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <span
              className="scratch-brick"
              style={{
                background: demoBloque.bg,
                color: demoBloque.color,
                borderColor: demoBloque.color,
              }}
            >
              {demoBloque.bloqueScratch}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onAbrirEstudio(demoBloque.codigo, `${demoBloque.id}.edu`)}
            >
              Abrir en Estudio <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
          <pre className="bridge-code" tabIndex={0}>
            <code>{demoBloque.codigo}</code>
          </pre>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="timing-pill">Salida real:</span>
            {demoSalida.map((linea, i) => (
              <span key={i} className="pill">
                {linea}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE INTERACTIVO B: Cerebro del Compilador (4 etapas clicables) */}
      <section className="section-block showcase-split reverse" aria-labelledby="showcase-compiler-heading">
        <div>
          <span className="section-tag">// 02 · rayos x del compilador</span>
          <h2 id="showcase-compiler-heading" style={{ fontSize: 'clamp(1.5rem, 2.7vw, 2.2rem)', marginBottom: 12 }}>
            No es magia negra: explora las 4 etapas reales.
          </h2>
          <p style={{ color: 'var(--ink-secondary)', marginBottom: 16 }}>
            Ideal para clases de programación y compiladores: cambia de etapa para inspeccionar
            cómo <code className="mono">2 + 3 * 4</code> se convierte en tokens, árbol de precedencia,
            símbolos e instrucciones de tres direcciones.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(
              [
                ['lexer', '1. Lexer'],
                ['parser', '2. Parser'],
                ['semantico', '3. Semántico'],
                ['ir', '4. Código IR v1'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="cat-chip"
                aria-pressed={etapaPipeline === id}
                onClick={() => setEtapaPipeline(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="panel showcase-panel">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent)' }}>
              <Layers size={14} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 6 }} />
              Entrada: crear variable total / asignar total valor de 2 + 3 * 4
            </span>
          </div>

          {etapaPipeline === 'lexer' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {compPipeline.tokens
                .filter((t) => t.tipo !== 'EOF' && t.tipo !== 'SALTO_LINEA')
                .map((t, i) => (
                  <span key={i} className="pill">
                    <strong>{t.tipo}</strong>
                    <span style={{ color: 'var(--ink-primary)' }}>{t.texto}</span>
                  </span>
                ))}
            </div>
          )}

          {etapaPipeline === 'parser' && (
            <pre className="bridge-code" tabIndex={0}>
              <code>{`Programa
 ├── Declaración (total)
 ├── Asignación (total)
 │    └── Suma (+)
 │         ├── Número (2)
 │         └── Producto (*)   ← prioridad sobre +
 │              ├── Número (3)
 │              └── Número (4)
 └── Mostrar (Variable: total)`}</code>
            </pre>
          )}

          {etapaPipeline === 'semantico' && (
            <div className="xray-table-wrap">
              <table className="xray-table">
                <thead>
                  <tr>
                    <th>Símbolo</th>
                    <th>Tipo inferido</th>
                    <th>Ámbito</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {compPipeline.simbolos.map((s, i) => (
                    <tr key={i}>
                      <td>{s.nombre}</td>
                      <td>{s.tipo}</td>
                      <td>{s.ambito}</td>
                      <td>{s.inicializada ? 'Inicializada ✓' : 'Sin valor'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {etapaPipeline === 'ir' && (
            <div className="xray-table-wrap">
              <table className="xray-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Op</th>
                    <th>Arg1</th>
                    <th>Arg2</th>
                    <th>Dest</th>
                  </tr>
                </thead>
                <tbody>
                  {compPipeline.intermedio?.instrucciones.map((ins, i) => (
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
            </div>
          )}
        </div>
      </section>

      {/* 5. SHOWCASE INTERACTIVO C: Galería viva de 10 Temas */}
      <section className="section-block panel" style={{ padding: 24 }} aria-labelledby="themes-showcase-heading">
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div>
            <span className="section-tag">// 03 · personalización total</span>
            <h2 id="themes-showcase-heading" style={{ fontSize: 'clamp(1.45rem, 2.5vw, 2rem)' }}>
              10 temas hechos a mano. Pruébalos aquí mismo.
            </h2>
          </div>
          <span className="pill">
            <Palette size={14} aria-hidden="true" /> Atajo rápido: Ctrl + K
          </span>
        </div>

        <div className="themes-strip">
          {TEMAS_CATALOGO.map((t) => {
            const activo = t.id === temaActual;
            return (
              <button
                key={t.id}
                type="button"
                className={`theme-pill-btn ${activo ? 'active' : ''}`}
                aria-pressed={activo}
                onClick={() => onCambiarTema(t.id)}
              >
                <span className="theme-swatches mini" aria-hidden="true">
                  {t.muestras.map((hex, i) => (
                    <span key={i} className="swatch-dot" style={{ backgroundColor: hex }} />
                  ))}
                </span>
                <span>{t.nombre}</span>
                {activo && <Check size={14} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. LOS 6 PROGRAMAS OFICIALES DE examples/ */}
      <section className="section-block" aria-labelledby="examples-heading">
        <div className="section-header">
          <div>
            <span className="section-tag">// galería oficial del repositorio</span>
            <h2 id="examples-heading" style={{ fontSize: 'clamp(1.5rem, 2.6vw, 2.1rem)' }}>
              Abre y modifica los programas reales de <code className="mono">examples/</code>
            </h2>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onAbrirEstudio()}
          >
            Ir directo al Estudio
          </button>
        </div>

        <div className="examples-grid">
          {EJEMPLOS_EDU.map((ej) => (
            <article key={ej.id} className="panel example-card">
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <span className="pill">{ej.nivel}</span>
                  <span
                    className="mono"
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--ink-muted)',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {ej.archivo}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: 6 }}>{ej.titulo}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-secondary)' }}>
                  {ej.subtitulo}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ej.etiquetas.map((tag) => (
                    <span key={tag} className="pill">
                      #{tag}
                    </span>
                  ))}
                </div>
                <button type="button" className="btn btn-sm" onClick={() => abrirEjemplo(ej)}>
                  Abrir <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 7. CIERRE EDITORIAL (estilo GoJS.app) */}
      <section className="section-block closing-cta panel" aria-labelledby="closing-heading">
        <div>
          <span className="section-tag">// listo para crear</span>
          <h2 id="closing-heading" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.35rem)', marginBottom: 8 }}>
            Tu primer compilador educativo merece sentirse extraordinario.
          </h2>
          <p style={{ margin: 0, color: 'var(--ink-secondary)' }}>
            Abre el Estudio, completa las 6 misiones o inspecciona el código intermedio JSON v1.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onAbrirEstudio()}
          >
            <Sparkles size={17} aria-hidden="true" /> Abrir Estudio .edu
          </button>
          <button type="button" className="btn" onClick={onIrMisiones}>
            <Trophy size={17} aria-hidden="true" /> Empezar Misión 1
          </button>
        </div>
      </section>
    </div>
  );
}
