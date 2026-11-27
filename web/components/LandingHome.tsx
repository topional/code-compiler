import { useAutoAnimate } from '@formkit/auto-animate/react';
import { motion } from 'motion/react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Blocks,
  Gamepad2,
  Github,
  MessageSquare,
  Palette,
  Play,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Terminal,
  Trophy,
  Wand2,
} from 'lucide-react';

import { EJEMPLOS_EDU, type EjemploEdu } from '../data/ejemplos';
import { MISIONES_EDU, type MisionEdu } from '../data/misiones';
import { obtenerTema, type TemaId } from '../data/temas';
import { compilarEdu } from '../engine/compilador';
import { ejecutarIntermedio } from '../engine/interprete';
import type { VariableMemoria } from '../engine/types';
import { ChispaBrandMark, ChispaMascota } from './ChispaLogo';
import { ContainerOverlayScrollbar, OverlayScrollbar } from './OverlayScrollbar';
import { UnifiedBackdrop, type ModoFondoContinuo } from './UnifiedBackdrop';
import {
  AnimatedNumber,
  KineticLetterStage,
  ScrambleText,
  SplitRevealText,
  SpotlightCard,
  TypewriterCycle,
} from './MotionPrimitives';

interface LandingHomeProps {
  tema: TemaId;
  movimientoReducido: boolean;
  onAbrirGaleriaTemas: () => void;
  onAbrirBuscador: () => void;
  misionesCompletadas: string[];
  onEntrarIde: () => void;
  onEntrarConCodigo: (nombre: string, codigo: string) => void;
  onEntrarConMision: (mision: MisionEdu) => void;
  onEntrarConRayosX?: () => void;
  onEntrarConGuia: () => void;
}

type TabHeroCard = 'runner' | 'chat';

const TOY_HEROES = [
  { id: 'zorro', label: 'Zorro Nova', valor: 'Zorro Nova' },
  { id: 'robot', label: 'Robot Pixel', valor: 'Robot Pixel' },
  { id: 'dragon', label: 'Dragón Chispa', valor: 'Dragon Chispa' },
  { id: 'luna', label: 'Capitana Luna', valor: 'Capitana Luna' },
] as const;

const TOY_POWERS = [
  {
    id: 'dado',
    label: 'Dado mágico (1-6)',
    bloque: 'puntos = dado al azar entre 1 y 6',
    linea: 'asignar puntos valor de numero aleatorio entre 1 y 6',
  },
  {
    id: 'doble',
    label: 'Super rayo x2',
    bloque: 'puntos = 25 × 2',
    linea: 'asignar puntos valor de 25 * 2',
  },
  {
    id: 'escudo',
    label: 'Escudo +50',
    bloque: 'puntos = 50 + 50',
    linea: 'asignar puntos valor de 50 + 50',
  },
  {
    id: 'salto',
    label: 'Salto estelar',
    bloque: 'puntos = 10 × 9',
    linea: 'asignar puntos valor de 10 * 9',
  },
] as const;

const TOY_ENDINGS = [
  {
    id: 'celebrar',
    label: 'Celebrar victoria',
    bloque: 'mostrar "¡Aventura lista!", heroe y puntos',
    lineas: 'mostrar "¡Aventura lista!"\nmostrar heroe\nmostrar puntos',
  },
  {
    id: 'repetir',
    label: 'Repetir 3 veces',
    bloque: 'repetir 3 veces → "¡Nivel superado!"',
    lineas: 'mostrar heroe\nrepetir 3 veces\n    mostrar "¡Nivel superado!"\nfin\nmostrar puntos',
  },
  {
    id: 'record',
    label: 'Comprobar medalla',
    bloque: 'si puntos ≥ 50 → "¡Medalla de oro!"',
    lineas:
      'mostrar heroe\nsi puntos es mayor o igual que 50 entonces\n    mostrar "¡Medalla de oro!"\nsino\n    mostrar "¡Buen intento! Sube tus puntos"\nfin',
  },
] as const;

const FRASES_CINETICAS_HERO = [
  'Compila en español',
  'Bloques a código real',
  'Aprende jugando',
  'Crea juegos y algoritmos',
];

const LINEAS_CODE_TYPEWRITER = [
  'crear variable energia  →  asignar energia valor de 100',
  'si dado es mayor o igual que 4 entonces  →  mostrar "¡Crítico!"',
  'definir triple(numero n) devuelve numero  →  devolver n * 3',
  'repetir 5 veces  →  mostrar cuenta  →  fin',
];

const CODIGO_HERO_PLAYGROUND = `# Edita cualquier línea y mira la respuesta en vivo
crear variable piloto
asignar piloto valor de "Nova"
crear variable energia
asignar energia valor de numero aleatorio entre 40 y 100

mostrar "¡Motor Chispa encendido!"
mostrar piloto
mostrar energia

si energia es mayor o igual que 70 entonces
    mostrar "Potencia máxima alcanzada"
sino
    mostrar "Recargando núcleos..."
fin`;

interface PresetPipeline {
  id: string;
  etiqueta: string;
  codigo: string;
}

const PRESETS_PIPELINE: PresetPipeline[] = [
  {
    id: 'vars',
    etiqueta: 'Guardar puntos',
    codigo: `crear variable puntos\nasignar puntos valor de 25 * 4\nmostrar puntos`,
  },
  {
    id: 'decision',
    etiqueta: 'Lanzar un dado',
    codigo: `crear variable dado\nasignar dado valor de numero aleatorio entre 1 y 6\nsi dado es mayor o igual que 4 entonces\n    mostrar "¡Ganaste!"\nsino\n    mostrar "¡Intenta otra vez!"\nfin`,
  },
  {
    id: 'funcion',
    etiqueta: 'Crear un truco',
    codigo: `definir doble(numero x) devuelve numero\n    devolver x * 2\nfin\nmostrar doble(21)`,
  },
  {
    id: 'error',
    etiqueta: 'Cazar un error',
    codigo: `crear variable vidas\nasignar vidas valor de 3\nasignar vidas valor de "tres"`,
  },
];

interface MensajeChat {
  id: number;
  rol: 'chispa' | 'usuario';
  texto: string;
  snippet?: { nombre: string; codigo: string };
}

const RESPUESTAS_CHISPA: {
  patron: RegExp;
  texto: string;
  snippet: { nombre: string; codigo: string };
}[] = [
  {
    patron: /ciclo|repetir|mientras|bucle|loop/i,
    texto:
      'Puedes repetir acciones con "repetir N veces ... fin" o con "mientras condicion hacer ... fin". Mira este contador:',
    snippet: {
      nombre: 'ciclo_rapido.edu',
      codigo: `crear variable cuenta\nasignar cuenta valor de 5\nrepetir 5 veces\n    mostrar cuenta\n    asignar cuenta valor de cuenta - 1\nfin\nmostrar "¡Listo!"`,
    },
  },
  {
    patron: /si|sino|decision|condicion|compar/i,
    texto:
      'Las decisiones se escriben casi como hablas: "si ... entonces ... sino ... fin". Prueba este ejemplo:',
    snippet: {
      nombre: 'decision.edu',
      codigo: `crear variable nota\nasignar nota valor de 18\nsi nota es mayor o igual que 14 entonces\n    mostrar "Aprobado"\nsino\n    mostrar "Sigue practicando"\nfin`,
    },
  },
  {
    patron: /funcion|definir|devolver|receta/i,
    texto:
      'Declara funciones indicando el tipo de cada parámetro y lo que devuelve ("numero", "texto" o "logico"):',
    snippet: {
      nombre: 'mi_funcion.edu',
      codigo: `definir cuadrado(numero n) devuelve numero\n    devolver n * n\nfin\nmostrar cuadrado(9)`,
    },
  },
  {
    patron: /juego|dado|azar|aleatorio/i,
    texto:
      'Usa "numero aleatorio entre A y B" para crear dados, duelos o adivina el número al instante:',
    snippet: {
      nombre: 'dado_duelo.edu',
      codigo: `crear variable dado\nasignar dado valor de numero aleatorio entre 1 y 6\nmostrar "Sacaste:"\nmostrar dado`,
    },
  },
  {
    patron: /ir|compilador|pasos|token|parser/i,
    texto:
      'Code Compiler revisa tu programa en 4 pasos rápidos: lee cada palabra, comprueba el orden, revisa los tipos y ejecuta tu código al instante.',
    snippet: {
      nombre: 'mi_programa.edu',
      codigo: `crear variable x\nasignar x valor de 12 + 30\nmostrar x`,
    },
  },
];

function responderChispa(consulta: string): Omit<MensajeChat, 'id' | 'rol'> {
  for (const r of RESPUESTAS_CHISPA) {
    if (r.patron.test(consulta)) {
      return { texto: r.texto, snippet: r.snippet };
    }
  }
  return {
    texto:
      'Puedo ayudarte con variables, ciclos (repetir/mientras), decisiones (si/sino), funciones o juegos con azar. Aquí tienes una plantilla lista:',
    snippet: {
      nombre: 'hola.edu',
      codigo: `crear variable nombre\nasignar nombre valor de "Explorador"\nmostrar "Hola desde Chispa:"\nmostrar nombre`,
    },
  };
}

interface SalidaDemo {
  id: string;
  linea: number | null;
  texto: string;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  tema,
  movimientoReducido,
  onAbrirGaleriaTemas,
  onAbrirBuscador,
  misionesCompletadas,
  onEntrarIde,
  onEntrarConCodigo,
  onEntrarConMision,
  onEntrarConGuia,
}) => {
  const [modoFondo, setModoFondo] = useState<ModoFondoContinuo>('koi');
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const [tabHero, setTabHero] = useState<TabHeroCard>('runner');
  const [codigoDemo, setCodigoDemo] = useState<string>(CODIGO_HERO_PLAYGROUND);
  const [salidasDemo, setSalidasDemo] = useState<SalidaDemo[]>([]);
  const [varsDemo, setVarsDemo] = useState<VariableMemoria[]>([]);
  const [tiempoDemoMs, setTiempoDemoMs] = useState<number>(0);
  const [runSeq, setRunSeq] = useState(0);

  // Chat interactivo con Chispa
  const [mensajesChat, setMensajesChat] = useState<MensajeChat[]>([
    {
      id: 1,
      rol: 'chispa',
      texto:
        '¡Hola! Pregúntame cómo escribir ciclos, decisiones, funciones o juegos y te genero código listo para abrir en Code Compiler.',
    },
  ]);
  const [inputChat, setInputChat] = useState('');

  // Constructor mágico de bloques en 3 clics (para niños)
  const [toyHeroId, setToyHeroId] = useState<(typeof TOY_HEROES)[number]['id']>('zorro');
  const [toyPowerId, setToyPowerId] = useState<(typeof TOY_POWERS)[number]['id']>('dado');
  const [toyEndId, setToyEndId] = useState<(typeof TOY_ENDINGS)[number]['id']>('celebrar');
  const [salidasToy, setSalidasToy] = useState<string[]>([]);

  // Simulador amigable de 4 pasos
  const [presetPipeId, setPresetPipeId] = useState<string>(PRESETS_PIPELINE[0].id);
  const [salidasPipe, setSalidasPipe] = useState<string[]>([]);

  const [outputAnimRef] = useAutoAnimate<HTMLDivElement>({ duration: 200 });
  const [chatAnimRef] = useAutoAnimate<HTMLDivElement>({ duration: 220 });

  const miniEditorRef = useRef<HTMLTextAreaElement | null>(null);
  const runnerOutRef = useRef<HTMLDivElement | null>(null);
  const chatMsgRef = useRef<HTMLDivElement | null>(null);

  const setRunnerOutNode = useCallback(
    (node: HTMLDivElement | null) => {
      outputAnimRef(node);
      runnerOutRef.current = node;
    },
    [outputAnimRef],
  );

  const setChatMsgNode = useCallback(
    (node: HTMLDivElement | null) => {
      chatAnimRef(node);
      chatMsgRef.current = node;
    },
    [chatAnimRef],
  );

  const temaMeta = obtenerTema(tema);
  const compilacionDemo = useMemo(() => compilarEdu(codigoDemo, 'intermedio'), [codigoDemo]);

  useEffect(() => {
    let cancelado = false;
    const t0 = performance.now();
    if (compilacionDemo.diagnosticos.length > 0 || !compilacionDemo.intermedio) {
      setSalidasDemo([]);
      setVarsDemo([]);
      setTiempoDemoMs(compilacionDemo.duracionMs);
      return;
    }
    const localOut: SalidaDemo[] = [];
    let lastVars: VariableMemoria[] = [];
    void ejecutarIntermedio(compilacionDemo.intermedio, {
      onEvento: (ev) => {
        if (ev.tipo === 'salida') {
          localOut.push({
            id: `${runSeq}-${localOut.length}-${ev.linea ?? 0}`,
            linea: ev.linea ?? null,
            texto: ev.texto,
          });
        } else if (ev.tipo === 'paso') {
          lastVars = ev.estado.variables;
        }
      },
      leerEntrada: async () => '1',
      maxPasos: 3000,
    }).then(() => {
      if (cancelado) return;
      setSalidasDemo(localOut);
      setVarsDemo(lastVars);
      setTiempoDemoMs(performance.now() - t0);
    });
    return () => {
      cancelado = true;
    };
  }, [compilacionDemo, runSeq]);

  const toyHero = TOY_HEROES.find((h) => h.id === toyHeroId) ?? TOY_HEROES[0];
  const toyPower = TOY_POWERS.find((p) => p.id === toyPowerId) ?? TOY_POWERS[0];
  const toyEnd = TOY_ENDINGS.find((e) => e.id === toyEndId) ?? TOY_ENDINGS[0];
  const codigoToy = useMemo(
    () =>
      `crear variable heroe\nasignar heroe valor de "${toyHero.valor}"\ncrear variable puntos\n${toyPower.linea}\n${toyEnd.lineas}`,
    [toyHero.valor, toyPower.linea, toyEnd.lineas],
  );
  const compToy = useMemo(() => compilarEdu(codigoToy, 'intermedio'), [codigoToy]);

  useEffect(() => {
    let cancelado = false;
    if (compToy.diagnosticos.length > 0 || !compToy.intermedio) {
      setSalidasToy([]);
      return;
    }
    const out: string[] = [];
    void ejecutarIntermedio(compToy.intermedio, {
      onEvento: (ev) => {
        if (ev.tipo === 'salida') out.push(ev.texto);
      },
      leerEntrada: async () => '1',
      maxPasos: 2000,
    }).then(() => {
      if (!cancelado) setSalidasToy(out);
    });
    return () => {
      cancelado = true;
    };
  }, [compToy]);

  const presetPipe =
    PRESETS_PIPELINE.find((p) => p.id === presetPipeId) ?? PRESETS_PIPELINE[0];
  const compPipe = useMemo(() => compilarEdu(presetPipe.codigo, 'intermedio'), [presetPipe.codigo]);

  useEffect(() => {
    let cancelado = false;
    if (compPipe.diagnosticos.length > 0 || !compPipe.intermedio) {
      setSalidasPipe([]);
      return;
    }
    const out: string[] = [];
    void ejecutarIntermedio(compPipe.intermedio, {
      onEvento: (ev) => {
        if (ev.tipo === 'salida') out.push(ev.texto);
      },
      leerEntrada: async () => '1',
      maxPasos: 2000,
    }).then(() => {
      if (!cancelado) setSalidasPipe(out);
    });
    return () => {
      cancelado = true;
    };
  }, [compPipe]);

  const enviarConsultaChat = (textoCrudo: string) => {
    const q = textoCrudo.trim();
    if (!q) return;
    const resp = responderChispa(q);
    setMensajesChat((prev) => [
      ...prev.slice(-4),
      { id: Date.now(), rol: 'usuario', texto: q },
      { id: Date.now() + 1, rol: 'chispa', ...resp },
    ]);
    setInputChat('');
  };

  const xpGanado = misionesCompletadas.length * 150;
  const xpTotal = MISIONES_EDU.length * 150;
  const porcentajeXp = Math.round((xpGanado / xpTotal) * 100);
  const ejemplosMostrar: EjemploEdu[] = EJEMPLOS_EDU.slice(0, 6);

  return (
    <div className="lp-root">
      <UnifiedBackdrop
        tema={tema}
        modo={modoFondo}
        desactivarAnimacion={movimientoReducido}
      />
      <OverlayScrollbar />
      {/* BARRA DE NAVEGACIÓN PRINCIPAL */}
      <header className={`lp-nav${navScrolled ? ' is-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <a href="#inicio-top" className="lp-brand" aria-label="Chispa Code Compiler, página principal">
            <ChispaBrandMark size={40} />
            <span className="lp-brand-stack">
              <span className="lp-brand-title">Chispa</span>
              <span className="lp-brand-sub">Code Compiler</span>
            </span>
          </a>

          <nav className="lp-nav-links" aria-label="Navegación principal">
            <a href="#inicio-top" className="lp-nav-link">
              Inicio
            </a>
            <button type="button" className="lp-nav-link lp-nav-link-btn" onClick={onEntrarConGuia}>
              Guía
            </button>
            <a href="#estudio" className="lp-nav-link">
              Estudio
            </a>
            <a href="#misiones" className="lp-nav-link">
              Misiones
            </a>
            <a href="#proyectos" className="lp-nav-link">
              Proyectos
            </a>
            <a
              href="https://github.com/topional/code-compiler"
              target="_blank"
              rel="noreferrer"
              className="lp-nav-link lp-nav-github"
            >
              <Github size={14} aria-hidden="true" />
              <span>GitHub</span>
            </a>
          </nav>

          <div className="lp-nav-actions">
            <button
              type="button"
              className="lp-nav-icon-btn"
              onClick={onAbrirBuscador}
              aria-label="Buscar comandos, retos y ejemplos (Ctrl+K)"
              title="Buscar (Ctrl + K)"
            >
              <Search size={18} aria-hidden="true" />
            </button>

            <button
              type="button"
              className="lp-nav-icon-btn"
              onClick={onAbrirGaleriaTemas}
              aria-label={`Cambiar tema visual. Actual: ${temaMeta.nombre}`}
              title={`Tema: ${temaMeta.nombre}`}
            >
              <Palette size={18} aria-hidden="true" />
            </button>

            <motion.button
              type="button"
              className="lp-nav-cta-pixel"
              whileHover={movimientoReducido ? undefined : { y: -1 }}
              whileTap={movimientoReducido ? undefined : { y: 2 }}
              onClick={onEntrarIde}
            >
              Code Compiler
            </motion.button>
          </div>
        </div>
      </header>

      <main id="inicio-top">
        {/* HERO PRINCIPAL DE CHISPA SOBRE EL LIENZO CONTINUO UNIFICADO */}
        <section className="lp-hero-stage" aria-label="Presentación de Chispa">
          <div className="lp-hero-grid">
            {/* COLUMNA IZQUIERDA */}
            <div className="lp-hero-copy">
              <div className="lp-status-pill">
                <span className="lp-live-dot" aria-hidden="true" />
                <ScrambleText
                  texto="ENTORNO DE PROGRAMACIÓN EN ESPAÑOL"
                  desactivarAnimacion={movimientoReducido}
                />
              </div>

              <h1 className="lp-kinetic-h1">
                <span className="lp-h1-prefix">Chispa</span>
                <KineticLetterStage
                  frases={FRASES_CINETICAS_HERO}
                  desactivarAnimacion={movimientoReducido}
                  className="lp-h1-dynamic"
                />
              </h1>

              <p className="lp-hero-desc">
                Aprende a programar en español con bloques tipo Scratch y da el salto a{' '}
                <strong>Code Compiler</strong>: inventa tus propios juegos, supera misiones y mira
                tus ideas cobrar vida al instante.
              </p>

              <div className="lp-code-ticker" aria-label="Ejemplo animado de código">
                <span className="lp-ticker-prompt" aria-hidden="true">
                  &gt;_
                </span>
                <TypewriterCycle
                  frases={LINEAS_CODE_TYPEWRITER}
                  desactivarAnimacion={movimientoReducido}
                />
              </div>

              <div className="lp-hero-buttons">
                <motion.button
                  type="button"
                  className="lp-cta-primary lp-cta-lg"
                  whileHover={movimientoReducido ? undefined : { scale: 1.03, y: -2 }}
                  whileTap={movimientoReducido ? undefined : { scale: 0.96 }}
                  onClick={onEntrarIde}
                >
                  <Play size={16} aria-hidden="true" />
                  <span>Abrir Code Compiler</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </motion.button>

                <a href="#estudio" className="lp-cta-glass">
                  <Wand2 size={16} aria-hidden="true" />
                  <span>Ver cómo funciona</span>
                </a>
              </div>

              {temaMeta.grupo !== 'Accesibilidad' && (
                <div
                  className="lp-shader-bar"
                  role="group"
                  aria-label="Elegir mundo vivo programado a código"
                  title="Toca o haz clic en cualquier zona libre del fondo para interactuar con el mundo"
                >
                  <span className="lp-shader-label">
                    <Sparkles size={13} aria-hidden="true" /> Mundos:
                  </span>
                  {(
                    [
                      { id: 'koi', label: 'Estanque Koi', hint: 'Toque: ondas de agua que atraen a los peces Koi' },
                      { id: 'luciernagas', label: 'Luciérnagas', hint: 'Toque: suelta un farol flotante que atrae al enjambre' },
                      { id: 'cosmos', label: 'Cosmos', hint: 'Toque: lente gravitacional y meteoros curvados' },
                      { id: 'vector', label: 'Vector 3D', hint: 'Toque: pulso sísmico 3D sobre la malla de montañas' },
                      { id: 'lluvia', label: 'Lluvia Neón', hint: 'Toque: salpicadura y gotas resbalando por el cristal' },
                      { id: 'acropolis', label: 'Acrópolis', hint: 'Toque: estrella fugaz dorada sobre el Partenón' },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="lp-shader-chip"
                      aria-pressed={modoFondo === s.id}
                      title={s.hint}
                      onClick={() => setModoFondo(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA: PRUEBA EN VIVO + CHAT CON CHISPA */}
            <div className="lp-hero-panel-wrap lp-beam-frame">
              <div className="lp-hero-panel">
                <div className="lp-panel-tabs" role="tablist" aria-label="Herramienta interactiva de portada">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tabHero === 'runner'}
                    className="lp-panel-tab"
                    onClick={() => setTabHero('runner')}
                  >
                    {tabHero === 'runner' && (
                      <motion.span
                        layoutId="hero-card-tab"
                        className="lp-panel-tab-bg"
                        transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="lp-tab-inner">
                      <Terminal size={14} aria-hidden="true" />
                      <span>Probar código vivo</span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={tabHero === 'chat'}
                    className="lp-panel-tab"
                    onClick={() => setTabHero('chat')}
                  >
                    {tabHero === 'chat' && (
                      <motion.span
                        layoutId="hero-card-tab"
                        className="lp-panel-tab-bg"
                        transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="lp-tab-inner">
                      <MessageSquare size={14} aria-hidden="true" />
                      <span>Chat con Chispa</span>
                    </span>
                  </button>
                </div>

                {tabHero === 'runner' ? (
                  <div className="lp-runner-body">
                    <div className="lp-runner-bar">
                      <span className="mono" style={{ fontSize: '0.76rem' }}>
                        laboratorio · {compilacionDemo.tokens.length} tokens
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="lp-mini-btn"
                          onClick={() => setRunSeq((n) => n + 1)}
                        >
                          <Play size={12} aria-hidden="true" /> Ejecutar
                        </button>
                        <button
                          type="button"
                          className="lp-mini-btn"
                          onClick={() => setCodigoDemo(CODIGO_HERO_PLAYGROUND)}
                          aria-label="Restaurar código de ejemplo"
                          title="Restaurar"
                        >
                          <RotateCcw size={12} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <label htmlFor="lp-mini-editor" className="sr-only">
                      Editor interactivo de código
                    </label>
                    <div className="overlay-scroll-host">
                      <textarea
                        ref={miniEditorRef}
                        id="lp-mini-editor"
                        className="lp-hero-textarea"
                        value={codigoDemo}
                        onChange={(e) => setCodigoDemo(e.target.value)}
                        spellCheck={false}
                        aria-label="Editor interactivo de código"
                      />
                      <ContainerOverlayScrollbar targetRef={miniEditorRef} />
                    </div>

                    <div className="lp-runner-out-head">
                      <span>Salida en vivo</span>
                      <span
                        className="mono"
                        style={{
                          color: compilacionDemo.diagnosticos.length ? 'var(--err)' : 'var(--ok)',
                        }}
                      >
                        {compilacionDemo.diagnosticos.length
                          ? `${compilacionDemo.diagnosticos.length} aviso(s)`
                          : `✓ ${tiempoDemoMs.toFixed(1)} ms`}
                      </span>
                    </div>

                    <div className="overlay-scroll-host">
                      <div
                        ref={setRunnerOutNode}
                        className="lp-runner-out"
                        tabIndex={0}
                        aria-label="Resultado del compilador"
                      >
                        {compilacionDemo.diagnosticos.length > 0
                          ? compilacionDemo.diagnosticos.map((d, i) => (
                              <div
                                key={`e-${i}`}
                                className="lp-out-row"
                                style={{ borderLeftColor: 'var(--err)' }}
                              >
                                <span className="lp-out-ln">L{d.linea ?? '?'}</span>
                                <span className="lp-out-val">
                                  [{d.etapa}] {d.mensaje}
                                </span>
                              </div>
                            ))
                          : salidasDemo.map((s) => (
                              <div key={s.id} className="lp-out-row">
                                <span className="lp-out-ln">L{s.linea ?? '·'}</span>
                                <span className="lp-out-val">{s.texto}</span>
                              </div>
                            ))}
                      </div>
                      <ContainerOverlayScrollbar targetRef={runnerOutRef} />
                    </div>

                    <div className="lp-runner-foot">
                      <div className="lp-runner-mem">
                        {varsDemo.slice(0, 3).map((v) => (
                          <span key={v.idInterno} className="mem-chip">
                            <span className="mem-chip-name">{v.nombre}</span>={v.valor}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="lp-cta-primary lp-cta-xs"
                        onClick={() => onEntrarConCodigo('laboratorio.edu', codigoDemo)}
                      >
                        <span>Llevar a Code Compiler</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="lp-chat-body">
                    <div className="lp-chat-head">
                      <ChispaMascota estado="feliz" size={32} />
                      <div>
                        <strong style={{ fontSize: '0.86rem' }}>Asistente interactivo Chispa</strong>
                        <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                          Respuestas instantáneas con código ejecutable
                        </div>
                      </div>
                    </div>

                    <div className="lp-chat-prompts" role="group" aria-label="Preguntas rápidas">
                      {[
                        '¿Cómo hago un ciclo?',
                        '¿Cómo uso si / sino?',
                        '¿Cómo creo una función?',
                        'Dame un juego de dado',
                      ].map((q) => (
                        <button
                          key={q}
                          type="button"
                          className="lp-prompt-chip"
                          onClick={() => enviarConsultaChat(q)}
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    <div className="overlay-scroll-host is-flex">
                      <div
                        ref={setChatMsgNode}
                        className="lp-chat-messages"
                        tabIndex={0}
                        aria-label="Conversación con Chispa"
                      >
                        {mensajesChat.map((m) => (
                          <div key={m.id} className={`lp-chat-msg is-${m.rol}`}>
                            <p>{m.texto}</p>
                            {m.snippet && (
                              <div className="lp-chat-snippet">
                                <pre>{m.snippet.codigo}</pre>
                                <button
                                  type="button"
                                  className="lp-cta-primary lp-cta-xs"
                                  onClick={() =>
                                    onEntrarConCodigo(m.snippet!.nombre, m.snippet!.codigo)
                                  }
                                >
                                  <Play size={11} aria-hidden="true" />
                                  <span>Abrir en Code Compiler</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <ContainerOverlayScrollbar targetRef={chatMsgRef} />
                    </div>

                    <form
                      className="lp-chat-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        enviarConsultaChat(inputChat);
                      }}
                    >
                      <label htmlFor="lp-chat-input" className="sr-only">
                        Escribe una pregunta de programación
                      </label>
                      <input
                        id="lp-chat-input"
                        type="text"
                        className="lp-chat-input"
                        value={inputChat}
                        onChange={(e) => setInputChat(e.target.value)}
                        placeholder="Pregunta sobre ciclos, funciones, decisiones..."
                      />
                      <button
                        type="submit"
                        className="lp-cta-primary lp-cta-xs"
                        aria-label="Enviar pregunta"
                      >
                        <Send size={13} aria-hidden="true" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: ESTUDIO INTERACTIVO PARA NIÑOS (CONSTRUCTOR DE BLOQUES + 4 PASOS AMIGABLES) */}
        <section id="estudio" className="lp-section" aria-labelledby="estudio-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">
              <ScrambleText
                texto="// taller mágico de bloques"
                desactivarAnimacion={movimientoReducido}
              />
            </span>
            <h2 id="estudio-heading" className="lp-h2">
              <SplitRevealText
                texto="Arma tu primer programa en 3 clics"
                desactivarAnimacion={movimientoReducido}
              />
            </h2>
            <p className="lp-lead">
              Elige un personaje, un poder y un final: mira cómo tus bloques se convierten al
              instante en código real en español.
            </p>
          </div>

          <div className="lp-toy-card">
            <div className="lp-toy-controls">
              <div className="lp-toy-group" role="group" aria-label="Elegir personaje">
                <span className="lp-toy-step-label">1. ELIGE TU PERSONAJE</span>
                <div className="lp-toy-pills">
                  {TOY_HEROES.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className="lp-toy-pill"
                      aria-pressed={toyHeroId === h.id}
                      onClick={() => setToyHeroId(h.id)}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lp-toy-group" role="group" aria-label="Elegir poder">
                <span className="lp-toy-step-label">2. ELIGE SU PODER</span>
                <div className="lp-toy-pills">
                  {TOY_POWERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="lp-toy-pill"
                      aria-pressed={toyPowerId === p.id}
                      onClick={() => setToyPowerId(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lp-toy-group" role="group" aria-label="Elegir final">
                <span className="lp-toy-step-label">3. ELIGE QUÉ PASA AL FINAL</span>
                <div className="lp-toy-pills">
                  {TOY_ENDINGS.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      className="lp-toy-pill"
                      aria-pressed={toyEndId === e.id}
                      onClick={() => setToyEndId(e.id)}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lp-toy-stack" aria-label="Bloques armados">
                <div className="lp-toy-block is-var">
                  <span>heroe = &quot;{toyHero.valor}&quot;</span>
                  <span className="lp-toy-block-tag">Personaje</span>
                </div>
                <div className="lp-toy-block is-op">
                  <span>{toyPower.bloque}</span>
                  <span className="lp-toy-block-tag">Poder</span>
                </div>
                <div className="lp-toy-block is-ctrl">
                  <span>{toyEnd.bloque}</span>
                  <span className="lp-toy-block-tag">Acción</span>
                </div>
              </div>
            </div>

            <div className="lp-toy-result">
              <div className="lp-toy-result-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <ChispaMascota estado="celebrando" size={30} />
                  <div>
                    <strong style={{ fontSize: '0.86rem' }}>Tu código en español</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      Generado y ejecutado en vivo
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="lp-cta-primary lp-cta-xs"
                  onClick={() => onEntrarConCodigo('mi_aventura.edu', codigoToy)}
                >
                  <span>Seguir en Code Compiler</span>
                  <ArrowRight size={13} aria-hidden="true" />
                </button>
              </div>

              <pre className="lp-toy-code">{codigoToy}</pre>

              <div className="lp-toy-out" aria-label="Resultado del programa creado">
                <span className="lp-toy-step-label">RESPUESTA EN PANTALLA</span>
                {salidasToy.map((linea, idx) => (
                  <div key={`${idx}-${linea}`} className="lp-toy-out-line">
                    <span className="lp-toy-out-arrow" aria-hidden="true">
                      →
                    </span>
                    <span>{linea}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lp-subhead">
            <span className="lp-kicker">
              <ScrambleText texto="// magia paso a paso" desactivarAnimacion={movimientoReducido} />
            </span>
            <h3 id="pipe-heading" className="lp-h3-section">
              ¿Cómo entiende Chispa tus palabras en 4 pasos?
            </h3>
            <p className="lp-lead">
              Toca un ejemplo sencillo y mira cómo <strong>Chispa</strong> lee tus frases, revisa
              que todo encaje y pone tu idea en marcha.
            </p>
          </div>

          <div className="lp-filter-row" role="group" aria-label="Elegir ejemplo sencillo">
            {PRESETS_PIPELINE.map((p) => (
              <button
                key={p.id}
                type="button"
                className="lp-filter-pill"
                aria-pressed={presetPipeId === p.id}
                onClick={() => setPresetPipeId(p.id)}
              >
                {presetPipeId === p.id && (
                  <motion.span
                    layoutId="pipe-preset-pill"
                    className="lp-filter-pill-bg"
                    transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                    aria-hidden="true"
                  />
                )}
                <span className="lp-tab-inner">{p.etiqueta}</span>
              </button>
            ))}
          </div>

          <div className="lp-pipe-source">
            <pre>{presetPipe.codigo}</pre>
            <button
              type="button"
              className="lp-cta-primary lp-cta-xs"
              onClick={() => onEntrarConCodigo(`${presetPipe.id}.edu`, presetPipe.codigo)}
            >
              <span>Editar en Code Compiler</span>
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>

          <div className="lp-pipeline-grid">
            <SpotlightCard desactivarAnimacion={movimientoReducido} className="lp-stage-card">
              <span className="lp-stage-num">PASO 1 · LEE TUS PALABRAS</span>
              <h3>{compPipe.tokens.filter((t) => t.texto.trim()).length} piezas encontradas</h3>
              <div className="lp-token-cloud">
                {compPipe.tokens
                  .filter((t) => t.texto.trim().length > 0)
                  .slice(0, 7)
                  .map((t, i) => (
                    <span key={i} className="lp-token-chip">
                      {t.texto}
                    </span>
                  ))}
              </div>
            </SpotlightCard>

            <SpotlightCard
              delay={0.05}
              desactivarAnimacion={movimientoReducido}
              className="lp-stage-card"
            >
              <span className="lp-stage-num">PASO 2 · ARMA EL PLAN</span>
              <h3>Orden de instrucciones</h3>
              <p>
                {compPipe.diagnosticos.some((d) => d.etapa === 'gramatica')
                  ? '¡Uy! Falta acomodar o cerrar una instrucción antes de jugar.'
                  : `¡Orden perfecto! Tu programa tiene ${compPipe.arbolVisual?.hijos.length ?? 0} paso(s) claros.`}
              </p>
            </SpotlightCard>

            <SpotlightCard
              delay={0.1}
              desactivarAnimacion={movimientoReducido}
              className="lp-stage-card"
            >
              <span className="lp-stage-num">PASO 3 · REVISA LAS REGLAS</span>
              <h3>
                {compPipe.diagnosticos.length > 0
                  ? `¡Pista detectada! (${compPipe.diagnosticos.length})`
                  : '¡Todo encaja perfecto!'}
              </h3>
              <p>
                {compPipe.diagnosticos.length > 0
                  ? compPipe.diagnosticos[0].mensaje
                  : `Tus cajas guardadas (${compPipe.simbolos.map((s) => s.nombre).join(', ') || 'ninguna'}) tienen el tipo correcto.`}
              </p>
            </SpotlightCard>

            <SpotlightCard
              delay={0.15}
              desactivarAnimacion={movimientoReducido}
              className="lp-stage-card"
            >
              <span className="lp-stage-num">PASO 4 · ¡EN ACCIÓN!</span>
              <h3>{compPipe.intermedio ? '¡Programa en marcha!' : 'Pausa para corregir'}</h3>
              <p
                className="mono"
                style={{ color: compPipe.diagnosticos.length ? 'var(--err)' : 'var(--ok)' }}
              >
                {compPipe.diagnosticos.length > 0
                  ? 'Corrige la pista del Paso 3 y volverá a funcionar.'
                  : salidasPipe.length > 0
                    ? `Resultado → ${salidasPipe.join(' | ')}`
                    : '¡Listo para jugar!'}
              </p>
            </SpotlightCard>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <button type="button" className="lp-cta-surface" onClick={onEntrarIde}>
              <Play size={16} aria-hidden="true" />
              <span>Probarlo en Code Compiler</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* SECCIÓN 3: MISIONES GUIADAS CON XP (PRÁCTICAS GUIADAS) */}
        <section id="misiones" className="lp-section" aria-labelledby="misiones-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">
              <ScrambleText
                texto="// misiones guiadas con medallas"
                desactivarAnimacion={movimientoReducido}
              />
            </span>
            <h2 id="misiones-heading" className="lp-h2">
              <SplitRevealText
                texto="Supera misiones paso a paso y sube de nivel"
                desactivarAnimacion={movimientoReducido}
              />
            </h2>
            <p className="lp-lead">
              Empieza desde cero con historias divertidas, pistas amigables y recompensas XP que se
              guardan en tu computadora.
            </p>
          </div>

          <div className="lp-xp-bar-card" role="region" aria-label="Progreso de misiones">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <div>
                <strong style={{ fontSize: '0.96rem' }}>
                  Progreso guardado:{' '}
                  <AnimatedNumber valor={xpGanado} desactivarAnimacion={movimientoReducido} /> /{' '}
                  {xpTotal} XP
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  {misionesCompletadas.length} de {MISIONES_EDU.length} misiones superadas
                </div>
              </div>
            </div>
            <div
              className="lp-xp-track"
              role="progressbar"
              aria-valuenow={porcentajeXp}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Porcentaje de misiones completadas"
            >
              <div
                className="lp-xp-fill"
                style={{ width: `${porcentajeXp}%` }}
              />
            </div>
            <span className="mono" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
              <AnimatedNumber
                valor={porcentajeXp}
                sufijo="%"
                desactivarAnimacion={movimientoReducido}
              />
            </span>
          </div>

          <div className="lp-bento-grid">
            {MISIONES_EDU.map((m, idx) => {
              const ok = misionesCompletadas.includes(m.id);
              return (
                <SpotlightCard
                  key={m.id}
                  delay={idx * 0.04}
                  desactivarAnimacion={movimientoReducido}
                  className={`lp-bento-card ${ok ? 'is-done' : ''}`}
                >
                  <div className="lp-bento-head">
                    <span className="lp-bento-tag">
                      <Blocks size={13} aria-hidden="true" />
                      Misión · {m.etiquetaNivel}
                    </span>
                    <span className="lp-bento-xp">{ok ? '✓ Completada' : '+150 XP'}</span>
                  </div>
                  <h3 className="lp-bento-title">{m.titulo}</h3>
                  <p className="lp-bento-desc">{m.historia}</p>
                  <pre className="lp-bento-code">
                    {m.codigoInicial.split('\n').slice(0, 3).join('\n')}
                  </pre>
                  <div className="lp-bento-foot">
                    <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      {m.insignia}
                    </span>
                    <button
                      type="button"
                      className="lp-cta-surface lp-cta-xs"
                      onClick={() => onEntrarConMision(m)}
                    >
                      <span>{ok ? 'Repetir misión' : 'Abrir misión'}</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </SpotlightCard>
              );
            })}
          </div>
        </section>

        {/* SECCIÓN 4: JUEGOS Y PROYECTOS LISTOS (COLOR SECUNDARIO DIFERENCIADO) */}
        <section id="proyectos" className="lp-section" aria-labelledby="proyectos-heading">
          <div className="lp-section-head">
            <span className="lp-kicker is-project">
              <ScrambleText
                texto="// juegos y proyectos para experimentar"
                desactivarAnimacion={movimientoReducido}
              />
            </span>
            <h2 id="proyectos-heading" className="lp-h2">
              <SplitRevealText
                texto="Juega, modifica y crea tus propios proyectos"
                desactivarAnimacion={movimientoReducido}
              />
            </h2>
            <p className="lp-lead">
              Proyectos y minijuegos listos para probar en un clic: cambia las reglas, inventa
              nuevos puntajes y hazlos tuyos dentro de <strong>Code Compiler</strong>.
            </p>
          </div>

          <div className="lp-bento-grid">
            {ejemplosMostrar.map((ej, idx) => (
              <SpotlightCard
                key={ej.id}
                delay={idx * 0.04}
                desactivarAnimacion={movimientoReducido}
                className="lp-bento-card is-project"
              >
                <div className="lp-bento-head">
                  <span className="lp-bento-tag is-project">
                    <Gamepad2 size={13} aria-hidden="true" />
                    Juego y proyecto
                  </span>
                  <span className="lp-bento-xp is-project">{ej.nivel}</span>
                </div>
                <h3 className="lp-bento-title">{ej.titulo}</h3>
                <p className="lp-bento-desc">{ej.subtitulo}</p>
                <pre className="lp-bento-code">
                  {ej.codigo.split('\n').slice(0, 3).join('\n')}
                </pre>
                <div className="lp-bento-foot">
                  <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                    {ej.etiquetas.slice(0, 2).join(' · ')}
                  </span>
                  <button
                    type="button"
                    className="lp-cta-surface lp-cta-project lp-cta-xs"
                    onClick={() =>
                      onEntrarConCodigo(ej.archivo.replace(/^examples\//, ''), ej.codigo)
                    }
                  >
                    <span>¡Jugar y editar!</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </SpotlightCard>
            ))}
          </div>

          <div className="lp-closing-card">
            <Sparkles size={26} style={{ color: 'var(--accent)' }} aria-hidden="true" />
            <h2 className="lp-h2">Abre Code Compiler y crea tu primer programa</h2>
            <p className="lp-lead">
              Sin cuentas ni descargas: editor amigable en español, bloques tipo Scratch, misiones
              divertidas y ejecución paso a paso en un clic.
            </p>
            <motion.button
              type="button"
              className="lp-cta-primary lp-cta-lg"
              whileHover={movimientoReducido ? undefined : { scale: 1.04, y: -2 }}
              whileTap={movimientoReducido ? undefined : { scale: 0.96 }}
              onClick={onEntrarIde}
            >
              <Play size={16} aria-hidden="true" />
              <span>Entrar a Code Compiler</span>
              <ArrowRight size={16} aria-hidden="true" />
            </motion.button>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span>
            <strong>Chispa</strong> · Entorno <strong>Code Compiler</strong>
          </span>
          <div className="lp-footer-links">
            <button type="button" onClick={onEntrarIde}>
              Code Compiler
            </button>
            <button type="button" onClick={onEntrarConGuia}>
              Guía
            </button>
            <a
              href="https://github.com/topional/code-compiler"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
