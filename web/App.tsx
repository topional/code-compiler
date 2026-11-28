import { useAutoAnimate } from '@formkit/auto-animate/react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Blocks,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronDown,
  Circle,
  Code2,
  Columns2,
  Download,
  FolderOpen,
  Gamepad2,
  History,
  Home,
  Lightbulb,
  Palette,
  Play,
  Plus,
  RotateCcw,
  Rows2,
  Search,
  Send,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Square,
  Terminal,
  Trash2,
  Trophy,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

import { CodeHelperModal } from './components/CodeHelperModal';
import { CommandPalette } from './components/CommandPalette';
import { Divisor } from './components/Divisor';
import type { EduEditorHandle } from './components/EduEditor';
import { GameStage2D, textoOtraVez, type EscenaJuego2D } from './components/GameStage2D';

const EduEditor = lazy(() =>
  import('./components/EduEditor').then((m) => ({ default: m.EduEditor })),
);
import { LandingHome } from './components/LandingHome';
import { ContainerOverlayScrollbar, HorizontalOverlayScrollbar } from './components/OverlayScrollbar';
import {
  RightDrawer,
  type InstantaneaCodigo,
  type PanelDerechoTipo,
} from './components/RightDrawer';
import { ScratchRail } from './components/ScratchRail';
import { SettingsDialog, type EscalaTexto } from './components/SettingsDialog';
import { ThemePickerDialog } from './components/ThemePickerDialog';
import type { CategoriaBloque } from './data/bloques';
import { CODIGO_HERO_DEFAULT, EJEMPLOS_EDU } from './data/ejemplos';
import type { MisionEdu } from './data/misiones';
import { obtenerTema, TEMAS_CATALOGO, TEMAS_VALIDOS, type TemaId } from './data/temas';
import {
  ControladorCompilacion,
  iniciarEjecucionRemota,
  obtenerPistaPedagogica,
  URL_API_PYTHON_DEFECTO,
  type SesionEjecucionRemota,
} from './engine/compilador';
import { formatearCodigoEdu } from './engine/formateador';
import type {
  Diagnostico,
  ModoEjecucionRemota,
  ResultadoCompilacionApi,
  VariableMemoria,
} from './engine/types';

interface PestanaCodigo {
  id: string;
  nombre: string;
  codigo: string;
}

interface ItemSalida {
  id: number;
  clase: 'salida' | 'pregunta' | 'respuesta' | 'aviso' | 'motivacion';
  texto: string;
  linea: number | null;
}

interface PreguntaPendiente {
  mensaje: string;
}

type VistaMovil = 'editor' | 'salida' | 'bloques' | 'misiones';

const STORAGE_KEYS = {
  tema: 'chispa_edu_tema_v2',
  escala: 'chispa_edu_escala',
  movimiento: 'chispa_edu_reduced_motion',
  pestanas: 'chispa_edu_wb_pestanas_v5',
  misiones: 'chispa_edu_misiones_ok',
  paneles: 'chispa_edu_tamano_paneles',
  urlApi: 'chispa_edu_api_url_v2',
};

function leerUrlApiInicial(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.urlApi)?.trim();
    if (raw) return raw;
  } catch {
    // ignorar
  }
  return URL_API_PYTHON_DEFECTO;
}

/**
 * Tamaño inicial: el editor ocupa el 44 % y el juego mide 320 px de alto.
 * En la vista vertical el juego va a la izquierda de la terminal y ocupa el 55 % del ancho.
 */
const PANELES_INICIALES = { editor: 0.44, juego: 320, juegoAncho: 0.55 };

function leerPaneles(): typeof PANELES_INICIALES {
  try {
    const t = JSON.parse(localStorage.getItem(STORAGE_KEYS.paneles) ?? '');
    if (typeof t?.editor === 'number' && typeof t?.juego === 'number') return { ...PANELES_INICIALES, ...t };
  } catch {
    // sin datos guardados o almacenamiento bloqueado: se usan los valores iniciales
  }
  return PANELES_INICIALES;
}

function siguienteNombreJuego(lista: PestanaCodigo[]): string {
  const usados = new Set(lista.map((p) => p.nombre.replace(/\.edu$/i, '').toLowerCase()));
  let n = 1;
  while (usados.has(`mi_juego_${n}`)) n += 1;
  return `mi_juego_${n}`;
}

function leerPestanasIniciales(): PestanaCodigo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.pestanas);
    if (raw) {
      const parsed = JSON.parse(raw) as PestanaCodigo[];
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].codigo !== undefined) {
        return parsed;
      }
    }
  } catch {
    // ignorar
  }
  return [
    { id: 'tab-dado', nombre: 'dado', codigo: CODIGO_HERO_DEFAULT },
    { id: 'tab-rpg', nombre: 'duelo_rpg', codigo: EJEMPLOS_EDU[0].codigo },
    { id: 'tab-torneo', nombre: 'torneo', codigo: EJEMPLOS_EDU[1].codigo },
    { id: 'tab-cohete', nombre: 'cohete', codigo: EJEMPLOS_EDU[2].codigo },
  ];
}

function clasificarValorSalida(texto: string): 'is-number' | 'is-bool' | '' {
  if (texto === 'verdadero' || texto === 'falso') return 'is-bool';
  if (/^-?\d+(\/\d+|\.\d+)?$/.test(texto.trim())) return 'is-number';
  return '';
}

export function App() {
  const editorRef = useRef<EduEditorHandle | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const outputEndRef = useRef<HTMLDivElement | null>(null);
  const wbOutputScrollRef = useRef<HTMLDivElement | null>(null);
  const [wbOutputAnimRef] = useAutoAnimate<HTMLDivElement>({ duration: 180 });
  const setWbOutputNode = useCallback(
    (node: HTMLDivElement | null) => {
      wbOutputAnimRef(node);
      wbOutputScrollRef.current = node;
    },
    [wbOutputAnimRef],
  );
  const [wbMemAnimRef] = useAutoAnimate<HTMLDivElement>({ duration: 180 });

  // Preferencias globales
  const [tema, setTema] = useState<TemaId>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.tema);
    return saved && TEMAS_VALIDOS.has(saved) ? (saved as TemaId) : 'gojs-dark';
  });
  const [escalaTexto, setEscalaTexto] = useState<EscalaTexto>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.escala);
    return saved === 'small' || saved === 'large' ? saved : 'normal';
  });
  const [movimientoReducido, setMovimientoReducido] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEYS.movimiento) === 'true',
  );

  // Vista superior: Página Principal (Codédex × GoJS) vs. Entorno IDE 100dvh
  const [vistaApp, setVistaApp] = useState<'inicio' | 'ide'>(() =>
    window.location.hash === '#ide' ? 'ide' : 'inicio',
  );

  // Layout del Workbench (espacioso 2 columnas por defecto: Editor + Escenario 2D)
  const [categoriaScratch, setCategoriaScratch] = useState<CategoriaBloque | null>(null);
  const [panelDerecho, setPanelDerecho] = useState<PanelDerechoTipo>(null);
  const [layoutVertical, setLayoutVertical] = useState(false);
  const [paneles, setPaneles] = useState(leerPaneles);
  const panelesLiveRef = useRef(paneles);
  panelesLiveRef.current = paneles;
  const centroRef = useRef<HTMLDivElement | null>(null);
  const salidaRef = useRef<HTMLElement | null>(null);
  const tabStripRef = useRef<HTMLDivElement | null>(null);

  // Aplica tamaños directo a variables CSS del DOM durante el arrastre (cero re-renders y cero bloqueo de localStorage)
  const aplicarPanelesEnDom = useCallback((p: typeof PANELES_INICIALES) => {
    const centro = centroRef.current;
    if (centro) {
      centro.style.setProperty('--flex-editor', String(p.editor));
      centro.style.setProperty('--flex-salida', String(1 - p.editor));
    }
    const salida = salidaRef.current;
    if (salida) {
      salida.style.setProperty('--alto-juego', `${Math.round(p.juego)}px`);
      salida.style.setProperty('--ancho-juego', `${p.juegoAncho * 100}%`);
    }
  }, []);

  const confirmarPaneles = useCallback(() => {
    setPaneles({ ...panelesLiveRef.current });
  }, []);

  useEffect(() => {
    aplicarPanelesEnDom(paneles);
    try {
      localStorage.setItem(STORAGE_KEYS.paneles, JSON.stringify(paneles));
    } catch {
      // el tamaño solo se recuerda si el navegador lo permite
    }
  }, [aplicarPanelesEnDom, paneles]);
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>('editor');

  // Modales nativos
  const [temasAbiertos, setTemasAbiertos] = useState(false);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [comandosAbiertos, setComandosAbiertos] = useState(false);
  const [ayudanteAbierto, setAyudanteAbierto] = useState(false);

  // Pestañas y archivos
  const [pestanas, setPestanas] = useState<PestanaCodigo[]>(() => leerPestanasIniciales());
  const [pestanaActivaId, setPestanaActivaId] = useState<string>(() => leerPestanasIniciales()[0].id);
  const pestanaActual = pestanas.find((p) => p.id === pestanaActivaId) ?? pestanas[0];

  // Mantiene siempre visible la pestaña activa al abrir o cambiar de juego 2D
  useEffect(() => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const activa = strip.querySelector<HTMLElement>('.file-tab[aria-current="true"]');
    activa?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pestanaActual.id, pestanas.length]);

  // Misiones
  const [misionesCompletadas, setMisionesCompletadas] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.misiones);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [misionActiva, setMisionActiva] = useState<MisionEdu | null>(null);
  const [feedbackMision, setFeedbackMision] = useState<{ ok: boolean; texto: string } | null>(null);

  // Motor Python (único motor de compilación, ejecución y depuración)
  const [urlApi, setUrlApi] = useState<string>(leerUrlApiInicial);
  const pestanaActualRef = useRef(pestanaActual);
  pestanaActualRef.current = pestanaActual;

  const [cursorPos, setCursorPos] = useState<{ linea: number; columna: number }>({ linea: 1, columna: 1 });
  const [compilacion, setCompilacion] = useState<ResultadoCompilacionApi | null>(null);
  const [conectandoPython, setConectandoPython] = useState(false);
  const [comprobandoMision, setComprobandoMision] = useState(false);
  const [estadoEjec, setEstadoEjec] = useState<'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso'>('inactivo');
  const [salidas, setSalidas] = useState<ItemSalida[]>([]);
  const [variables, setVariables] = useState<VariableMemoria[]>([]);
  const [pilaLlamadas, setPilaLlamadas] = useState<string[]>(['programa']);
  const [lineaActiva, setLineaActiva] = useState<number | null>(null);
  const lineaActivaRef = useRef<number | null>(null);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [diagnosticosEjec, setDiagnosticosEjec] = useState<Diagnostico[]>([]);
  const [falloConexionEjec, setFalloConexionEjec] = useState(false);
  const [tiempoUltEjec, setTiempoUltEjec] = useState<number | null>(null);
  const [preguntaPendiente, setPreguntaPendiente] = useState<PreguntaPendiente | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [comandoTerminal, setComandoTerminal] = useState('');
  const [runSeq, setRunSeq] = useState(0);
  const [historial, setHistorial] = useState<InstantaneaCodigo[]>([]);
  const pendingPlayRef = useRef(false);

  const compCtrlRef = useRef<ControladorCompilacion | null>(null);
  if (!compCtrlRef.current) {
    compCtrlRef.current = new ControladorCompilacion();
  }
  const abortRef = useRef<AbortController | null>(null);
  const sesionRef = useRef<SesionEjecucionRemota | null>(null);
  const conectandoTimerRef = useRef<number | null>(null);
  const ultimaAccionRef = useRef<'compilar' | 'continuo' | 'paso'>('compilar');
  const seqRef = useRef(0);

  const iniciarAvisoConexion = useCallback(() => {
    if (conectandoTimerRef.current !== null) window.clearTimeout(conectandoTimerRef.current);
    conectandoTimerRef.current = window.setTimeout(() => {
      setConectandoPython(true);
    }, 450);
  }, []);

  const limpiarAvisoConexion = useCallback(() => {
    if (conectandoTimerRef.current !== null) {
      window.clearTimeout(conectandoTimerRef.current);
      conectandoTimerRef.current = null;
    }
    setConectandoPython(false);
  }, []);

  const temaMeta = obtenerTema(tema);

  const todosDiagnosticos =
    diagnosticosEjec.length > 0 ? diagnosticosEjec : (compilacion?.diagnosticos ?? []);
  const falloConexionActual = Boolean(falloConexionEjec || compilacion?.falloConexion);

  // Limpia diagnósticos de ejecución al cambiar de pestaña, editar código o cambiar URL
  useEffect(() => {
    setDiagnosticosEjec([]);
    setFalloConexionEjec(false);
  }, [pestanaActual.id, pestanaActual.codigo, urlApi]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.urlApi, urlApi);
    } catch {
      // ignorar
    }
  }, [urlApi]);

  const lineasError = useMemo(
    () => todosDiagnosticos.map((d) => d.linea).filter((l): l is number => typeof l === 'number'),
    [todosDiagnosticos],
  );

  // Sincronización DOM + localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    localStorage.setItem(STORAGE_KEYS.tema, tema);
    const meta = document.getElementById('theme-color-meta');
    if (meta) meta.setAttribute('content', temaMeta.metaColor);
  }, [tema, temaMeta.metaColor]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-scale', escalaTexto);
    localStorage.setItem(STORAGE_KEYS.escala, escalaTexto);
  }, [escalaTexto]);

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-reduced-motion',
      movimientoReducido ? 'true' : 'false',
    );
    localStorage.setItem(STORAGE_KEYS.movimiento, String(movimientoReducido));
  }, [movimientoReducido]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.pestanas, JSON.stringify(pestanas));
    } catch {
      // ignorar
    }
  }, [pestanas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.misiones, JSON.stringify(misionesCompletadas));
    } catch {
      // ignorar
    }
  }, [misionesCompletadas]);

  // Sincronización de vista Inicio ↔ IDE con body class y hash de navegador
  useEffect(() => {
    document.body.classList.toggle('is-workbench', vistaApp === 'ide');
    if (vistaApp === 'ide') {
      if (window.location.hash !== '#ide') {
        window.history.pushState(null, '', '#ide');
      }
    } else if (window.location.hash === '#ide') {
      window.history.pushState(null, '', '#inicio');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    return () => {
      document.body.classList.remove('is-workbench');
    };
  }, [vistaApp]);

  useEffect(() => {
    const onHash = () => {
      setVistaApp(window.location.hash === '#ide' ? 'ide' : 'inicio');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Atajo global Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setComandosAbiertos((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const agregarSalida = (clase: ItemSalida['clase'], texto: string, linea: number | null = null) => {
    seqRef.current += 1;
    const id = seqRef.current;
    setSalidas((prev) => [...prev, { id, clase, texto, linea }]);
  };

  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }, [salidas, preguntaPendiente]);

  const guardarInstantanea = (etiqueta: string) => {
    const hora = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const nueva: InstantaneaCodigo = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
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

  const detenerEjecucion = useCallback(() => {
    sesionRef.current?.detener();
    sesionRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    limpiarAvisoConexion();
    lineaActivaRef.current = null;
    setPreguntaPendiente(null);
    setEstadoEjec('inactivo');
    setLineaActiva(null);
  }, [limpiarAvisoConexion]);

  useEffect(
    () => () => {
      detenerEjecucion();
      compCtrlRef.current?.cancelar();
    },
    [detenerEjecucion],
  );

  const iniciarEjecucion = async (modo: Exclude<ModoEjecucionRemota, 'normal'>, forzarRecompilar = false) => {
    detenerEjecucion();
    ultimaAccionRef.current = modo;

    const tabIdEjec = pestanaActualRef.current.id;
    const codigoEjec = pestanaActualRef.current.codigo;
    const urlEjec = urlApi;
    const conAnalisis = misionActiva !== null;
    const controller = new AbortController();
    abortRef.current = controller;

    const sigueVigente = () =>
      !controller.signal.aborted &&
      pestanaActualRef.current.id === tabIdEjec &&
      pestanaActualRef.current.codigo === codigoEjec;

    setRunSeq((n) => n + 1);
    setSalidas([]);
    setVariables([]);
    setPilaLlamadas(['programa']);
    setDiagnosticosEjec([]);
    setFalloConexionEjec(false);
    setFeedbackMision(null);
    guardarInstantanea(modo === 'paso' ? 'Paso a paso' : 'Ejecución');
    if (window.innerWidth <= 960 && modo !== 'paso') {
      setVistaMovil('salida');
    }

    setEstadoEjec('corriendo');
    iniciarAvisoConexion();

    const resComp = await compCtrlRef.current!.compilarAhora(tabIdEjec, urlEjec, codigoEjec, {
      analisis: conAnalisis,
      forzar: forzarRecompilar,
      signal: controller.signal,
    });
    if (!sigueVigente()) {
      limpiarAvisoConexion();
      return;
    }
    if (!resComp) {
      limpiarAvisoConexion();
      setEstadoEjec('inactivo');
      return;
    }

    setCompilacion(resComp);
    if (resComp.diagnosticos.length > 0 || !resComp.intermedio) {
      limpiarAvisoConexion();
      setEstadoEjec('inactivo');
      return;
    }

    const sesion = iniciarEjecucionRemota(urlEjec, resComp.intermedio, {
      modo,
      signal: controller.signal,
      onAbierto: () => {
        if (sigueVigente()) limpiarAvisoConexion();
      },
      onEvento: (ev) => {
        if (!sigueVigente()) return;
        if (ev.tipo === 'salida') {
          agregarSalida('salida', ev.texto, lineaActivaRef.current);
        } else if (ev.tipo === 'pregunta') {
          agregarSalida('pregunta', ev.mensaje, lineaActivaRef.current);
          setTextoRespuesta('');
          setPreguntaPendiente({ mensaje: ev.mensaje });
        } else if (ev.tipo === 'entrada_invalida') {
          agregarSalida('aviso', ev.mensaje, lineaActivaRef.current);
        } else if (ev.tipo === 'estado') {
          lineaActivaRef.current = ev.linea;
          setLineaActiva(ev.linea);
          setVariables(ev.variables);
          setPilaLlamadas(ev.pila);
          if (ev.pausado) {
            setEstadoEjec('esperando_paso');
          } else if (modo === 'paso') {
            setEstadoEjec('corriendo');
          }
        } else if (ev.tipo === 'fin') {
          limpiarAvisoConexion();
          lineaActivaRef.current = null;
          setTiempoUltEjec(Math.max(0.1, ev.duracionMs));
          setPreguntaPendiente(null);
          setEstadoEjec('inactivo');
          setLineaActiva(null);
        } else if (ev.tipo === 'error') {
          limpiarAvisoConexion();
          lineaActivaRef.current = null;
          setDiagnosticosEjec(ev.diagnosticos);
          setFalloConexionEjec(Boolean(ev.falloConexion));
          setPreguntaPendiente(null);
          setEstadoEjec('inactivo');
          setLineaActiva(null);
        }
      },
    });
    sesionRef.current = sesion;

    await sesion.promesa;
    if (sesionRef.current === sesion) {
      sesionRef.current = null;
    }
    if (sigueVigente()) {
      limpiarAvisoConexion();
      setEstadoEjec('inactivo');
      setLineaActiva(null);
    }
  };

  // Compila en Python tras 750 ms sin escribir (solo HTTP /compilar; nunca abre WebSocket al escribir)
  useEffect(() => {
    if (vistaApp !== 'ide') {
      compCtrlRef.current?.cancelar();
      limpiarAvisoConexion();
      return;
    }

    if (pendingPlayRef.current) {
      pendingPlayRef.current = false;
      void iniciarEjecucion('continuo');
      return;
    }

    const tabId = pestanaActual.id;
    const codigo = pestanaActual.codigo;
    const conAnalisis = misionActiva !== null;
    ultimaAccionRef.current = 'compilar';

    compCtrlRef.current?.programar(tabId, urlApi, codigo, {
      analisis: conAnalisis,
      delayMs: 750,
      onInicio: iniciarAvisoConexion,
      onResultado: (res) => {
        limpiarAvisoConexion();
        if (pestanaActualRef.current.id !== tabId || pestanaActualRef.current.codigo !== codigo) {
          return;
        }
        setCompilacion(res);
      },
    });

    return () => {
      compCtrlRef.current?.cancelar();
      limpiarAvisoConexion();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaApp, pestanaActual.id, pestanaActual.codigo, urlApi, misionActiva?.id]);

  const reintentarConexion = () => {
    compCtrlRef.current?.invalidarCache();
    setDiagnosticosEjec([]);
    setFalloConexionEjec(false);
    const accion = ultimaAccionRef.current;
    if (accion === 'continuo' || accion === 'paso') {
      void iniciarEjecucion(accion, true);
      return;
    }
    const tabId = pestanaActual.id;
    const codigo = pestanaActual.codigo;
    iniciarAvisoConexion();
    void compCtrlRef.current
      ?.compilarAhora(tabId, urlApi, codigo, {
        analisis: misionActiva !== null,
        forzar: true,
      })
      .then((res) => {
        limpiarAvisoConexion();
        if (!res) return;
        if (pestanaActualRef.current.id === tabId && pestanaActualRef.current.codigo === codigo) {
          setCompilacion(res);
        }
      });
  };

  const seleccionarJuegoDirecto = (juego: EscenaJuego2D) => {
    const mapa: Record<EscenaJuego2D, { nombre: string; codigo: string }> = {
      rpg: { nombre: 'duelo_rpg', codigo: EJEMPLOS_EDU[0].codigo },
      aventura: { nombre: 'dado', codigo: CODIGO_HERO_DEFAULT },
      torneo: { nombre: 'torneo', codigo: EJEMPLOS_EDU[1].codigo },
      cohete: { nombre: 'cohete', codigo: EJEMPLOS_EDU[2].codigo },
      boveda: { nombre: 'adivina_numero', codigo: EJEMPLOS_EDU[3].codigo },
      calculadora: { nombre: 'calculadora', codigo: EJEMPLOS_EDU[5].codigo },
      chispa: {
        nombre: 'mi_mundo',
        codigo: `# ¡Mundo libre Chispa! Escribe lo que quieras probar
crear variable heroe
asignar heroe valor de "Chispa"
crear variable energia
asignar energia valor de 100
mostrar "¡Bienvenido a tu mundo libre!"
mostrar heroe`,
      },
    };
    const meta = mapa[juego];
    const yaActiva = pestanaActual.nombre.replace(/\.edu$/i, '') === meta.nombre;
    if (yaActiva) {
      void iniciarEjecucion('continuo');
      return;
    }
    pendingPlayRef.current = true;
    abrirNuevaPestana(meta.nombre, meta.codigo);
  };

  const avanzarUnPaso = () => {
    if (estadoEjec === 'esperando_paso' && sesionRef.current) {
      if (sesionRef.current.siguiente()) {
        setEstadoEjec('corriendo');
      }
      return;
    }
    if (estadoEjec === 'inactivo') {
      void iniciarEjecucion('paso');
    }
  };

  const actualizarCodigoActual = (nuevo: string) => {
    setPestanas((prev) => prev.map((p) => (p.id === pestanaActual.id ? { ...p, codigo: nuevo } : p)));
  };

  const abrirNuevaPestana = (nombre?: string, codigo?: string) => {
    detenerEjecucion();
    setSalidas([]);
    setVariables([]);
    const nombreLimpio = (nombre ?? siguienteNombreJuego(pestanas)).replace(/\.edu$/i, '');
    if (nombre) {
      const existente = pestanas.find((p) => p.nombre.replace(/\.edu$/i, '') === nombreLimpio);
      if (existente) {
        setPestanaActivaId(existente.id);
        setVistaMovil('editor');
        return;
      }
    }
    const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPestanas((prev) => [
      ...prev,
      {
        id,
        nombre: nombre ? nombreLimpio : siguienteNombreJuego(prev),
        codigo: codigo ?? '# ¡Crea tu juego aquí!\nmostrar "¡Hola desde Chispa!"\n',
      },
    ]);
    setPestanaActivaId(id);
    setVistaMovil('editor');
  };

  const cerrarPestana = (id: string) => {
    detenerEjecucion();
    setPestanas((prev) => {
      const rest = prev.filter((p) => p.id !== id);
      if (rest.length === 0) return prev;
      if (pestanaActivaId === id) setPestanaActivaId(rest[0].id);
      return rest;
    });
  };

  const iniciarMision = (mision: MisionEdu) => {
    detenerEjecucion();
    setMisionActiva(mision);
    setFeedbackMision(null);
    const id = `mision-${mision.id}`;
    setPestanas((prev) => {
      const existe = prev.find((p) => p.id === id);
      if (existe) return prev.map((p) => (p.id === id ? { ...p, codigo: mision.codigoInicial } : p));
      return [...prev, { id, nombre: mision.id, codigo: mision.codigoInicial }];
    });
    setPestanaActivaId(id);
    setVistaMovil('editor');
  };

  const comprobarMisionActiva = async () => {
    if (!misionActiva || comprobandoMision) return;
    detenerEjecucion();
    setComprobandoMision(true);
    iniciarAvisoConexion();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await misionActiva.verificar(pestanaActual.codigo, urlApi, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setFeedbackMision({ ok: res.completada, texto: res.mensaje });
      if (res.completada) {
        setMisionesCompletadas((prev) =>
          prev.includes(misionActiva.id) ? prev : [...prev, misionActiva.id],
        );
        if (
          !movimientoReducido &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          void confetti({ particleCount: 70, spread: 68, origin: { y: 0.65 } });
        }
      }
    } finally {
      limpiarAvisoConexion();
      setComprobandoMision(false);
    }
  };

  const formatearActual = () => {
    const f = formatearCodigoEdu(pestanaActual.codigo);
    if (f !== pestanaActual.codigo) actualizarCodigoActual(f);
  };

  const enviarValorRespuesta = (val: string) => {
    if (!preguntaPendiente || !sesionRef.current) return;
    if (sesionRef.current.responder(val)) {
      setPreguntaPendiente(null);
      setTextoRespuesta('');
      agregarSalida('respuesta', val);
    }
  };

  const opcionesRapidasPregunta = useMemo(() => {
    if (!preguntaPendiente) return [];
    const msg = preguntaPendiente.mensaje.toLowerCase();
    const src = pestanaActual.codigo.toLowerCase();
    if (/ataque|jugada/.test(msg) && /rayo|llamarada|slime|pocion/.test(src)) {
      return [
        { val: '1', label: '1 · Rayo Chispa' },
        { val: '2', label: '2 · Llamarada' },
        { val: '3', label: '3 · Poción +25' },
      ];
    }
    if (/piedra|tijera|papel/.test(src) && /jugada|opcion/.test(msg)) {
      return [
        { val: '1', label: '1 · Piedra' },
        { val: '2', label: '2 · Papel' },
        { val: '3', label: '3 · Tijera' },
      ];
    }
    if (/operacion/.test(msg) && /suma|resta/.test(src)) {
      return [
        { val: '1', label: '1 · Suma (+)' },
        { val: '2', label: '2 · Resta (-)' },
        { val: '3', label: '3 · Multiplicar (×)' },
        { val: '4', label: '4 · Dividir (÷)' },
      ];
    }
    if (/1 al 10|tu número|tu numero/.test(msg)) {
      return Array.from({ length: 10 }, (_, i) => ({
        val: String(i + 1),
        label: String(i + 1),
      }));
    }
    return [];
  }, [preguntaPendiente, pestanaActual.codigo]);

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
      if (typeof reader.result === 'string') abrirNuevaPestana(file.name, reader.result);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const alternarPanelDerecho = (p: Exclude<PanelDerechoTipo, null>) => {
    setPanelDerecho((prev) => (prev === p ? null : p));
  };

  const historialPestana = historial.filter((h) => h.pestanaId === pestanaActual.id);

  const modalesCompartidos = (
    <>
      <ThemePickerDialog
        open={temasAbiertos}
        onClose={() => setTemasAbiertos(false)}
        temaActual={tema}
        onSeleccionarTema={setTema}
      />

      <CommandPalette
        open={comandosAbiertos}
        onClose={() => setComandosAbiertos(false)}
        onAbrirPanel={(p) => {
          setVistaApp('ide');
          setPanelDerecho(p);
        }}
        onCambiarTema={setTema}
        onAbrirEjemplo={(codigo, nombre) => {
          abrirNuevaPestana(nombre, codigo);
          setVistaApp('ide');
        }}
        onIniciarMision={(m) => {
          setVistaApp('ide');
          setPanelDerecho('misiones');
          iniciarMision(m);
        }}
        onFormatear={formatearActual}
        onAlternarLayout={() => setLayoutVertical((v) => !v)}
      />

      <CodeHelperModal
        open={ayudanteAbierto}
        onClose={() => setAyudanteAbierto(false)}
        onInsertarCodigo={(snippet) => {
          editorRef.current?.insertSnippet(snippet);
          setVistaMovil('editor');
        }}
      />

      <SettingsDialog
        open={ajustesAbiertos}
        onClose={() => setAjustesAbiertos(false)}
        tema={tema}
        onCambiarTema={setTema}
        onAbrirGaleriaTemas={() => setTemasAbiertos(true)}
        escalaTexto={escalaTexto}
        onCambiarEscala={setEscalaTexto}
        movimientoReducido={movimientoReducido}
        onCambiarMovimiento={setMovimientoReducido}
        urlApi={urlApi}
        onCambiarUrlApi={setUrlApi}
      />
    </>
  );

  return (
    <MotionConfig reducedMotion={movimientoReducido ? 'always' : 'never'}>
      <AnimatePresence mode="wait" initial={false}>
        {vistaApp === 'inicio' ? (
          <motion.div
            key="vista-inicio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.18 }}
          >
            <LandingHome
              tema={tema}
              urlApi={urlApi}
              movimientoReducido={movimientoReducido}
              onAbrirGaleriaTemas={() => setTemasAbiertos(true)}
              onAbrirBuscador={() => setComandosAbiertos(true)}
              misionesCompletadas={misionesCompletadas}
              onEntrarIde={() => setVistaApp('ide')}
              onEntrarConCodigo={(nombre, codigo) => {
                abrirNuevaPestana(nombre, codigo);
                setVistaApp('ide');
              }}
              onEntrarConMision={(m) => {
                setPanelDerecho('misiones');
                setVistaMovil('editor');
                iniciarMision(m);
                setVistaApp('ide');
              }}
              onEntrarConGuia={() => {
                setPanelDerecho('guia');
                setVistaApp('ide');
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="vista-ide"
            className="wb-root"
            initial={{ y: 8 }}
            animate={{ y: 0 }}
            exit={{ y: 8 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
        <input
          ref={fileInputRef}
          type="file"
          accept=".edu,.txt"
          onChange={importarArchivo}
          className="sr-only"
          aria-label="Abrir archivo de código"
        />

        {/* CUERPO DEL WORKBENCH: [Carril Scratch + Flyout] | [Editor + Salida] | [Drawer] | [Dock] */}
        <main className="wb-body">
          <ScratchRail
            categoriaActiva={categoriaScratch}
            onToggleCategoria={setCategoriaScratch}
            onInsertarBloque={(snippet) => {
              editorRef.current?.insertSnippet(snippet);
              setVistaMovil('editor');
            }}
            onAbrirEjemplos={() => alternarPanelDerecho('ejemplos')}
            onAbrirAyudante={() => setAyudanteAbierto(true)}
            mobileVisible={vistaMovil === 'bloques'}
          />

          {/* ÁREA CENTRAL: EDITOR + SALIDA/ESCENARIO */}
          <div
            ref={centroRef}
            className={`wb-center ${layoutVertical ? 'layout-vertical' : ''} ${
              vistaMovil === 'editor' || vistaMovil === 'salida' ? '' : 'mobile-hidden'
            }`}
            style={
              {
                '--flex-editor': String(paneles.editor),
                '--flex-salida': String(1 - paneles.editor),
              } as React.CSSProperties
            }
          >
            {/* PANEL EDITOR */}
            <section
              className={`wb-pane wb-editor-pane ${vistaMovil === 'editor' ? '' : 'mobile-hidden'}`}
              aria-label="Editor de código de Chispa"
            >
              <div className="wb-pane-header editor-tabs-bar">
                <button
                  type="button"
                  className="ide-icon-btn"
                  onClick={() => {
                    detenerEjecucion();
                    setVistaApp('inicio');
                  }}
                  aria-label="Volver a la página principal"
                  title="Volver a Inicio"
                >
                  <Home size={14} aria-hidden="true" />
                </button>
                <div className="overlay-scroll-host tab-strip-host">
                  <div
                    ref={tabStripRef}
                    className="tab-strip"
                    role="region"
                    aria-label="Pestañas de archivos"
                    onWheel={(e) => {
                      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                  >
                    {pestanas.map((tab) => (
                      <div
                        key={tab.id}
                        className={`file-tab-item ${tab.id === pestanaActual.id ? 'is-active' : ''}`}
                      >
                        <button
                          type="button"
                          className="file-tab"
                          aria-current={tab.id === pestanaActual.id ? 'true' : undefined}
                          onClick={() => {
                            detenerEjecucion();
                            setSalidas([]);
                            setVariables([]);
                            setPestanaActivaId(tab.id);
                          }}
                        >
                          <span className="file-tab-ext">2D</span>
                          <span>{tab.nombre.replace(/\.edu$/i, '')}</span>
                        </button>
                        {pestanas.length > 1 && (
                          <button
                            type="button"
                            className="file-tab-close"
                            aria-label={`Cerrar ${tab.nombre}`}
                            onClick={() => cerrarPestana(tab.id)}
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="ide-icon-btn"
                      onClick={() => abrirNuevaPestana()}
                      aria-label="Nuevo juego o programa"
                      title="Nuevo programa"
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <HorizontalOverlayScrollbar targetRef={tabStripRef} />
                </div>
              </div>

              <div className="wb-pane-header editor-toolbar-bar" role="toolbar" aria-label="Acciones del editor">
                <div className="ide-actions">
                  <button
                    type="button"
                    className="ide-icon-btn"
                    onClick={() => setAyudanteAbierto(true)}
                    aria-label="Abrir ayudante paso a paso"
                    title="Ayudante paso a paso: crea variables, preguntas y decisiones sin errores"
                  >
                    <Sparkles size={13} aria-hidden="true" style={{ color: 'var(--accent)' }} />
                    <span>Ayudante</span>
                  </button>

                  <button
                    type="button"
                    className="ide-icon-btn run-btn"
                    onClick={() => void iniciarEjecucion('continuo')}
                    title="Jugar y ejecutar programa en Python (Ctrl + Enter)"
                  >
                    <Play size={13} aria-hidden="true" />
                    <span>Jugar</span>
                  </button>

                  <button
                    type="button"
                    className="ide-icon-btn accent-btn"
                    onClick={avanzarUnPaso}
                    disabled={estadoEjec === 'corriendo'}
                    title="Ejecutar paso a paso en Python"
                  >
                    <SkipForward size={13} aria-hidden="true" />
                    <span className="hide-narrow">
                      {estadoEjec === 'esperando_paso' ? 'Siguiente' : 'Paso'}
                    </span>
                  </button>

                  {estadoEjec !== 'inactivo' && (
                    <button
                      type="button"
                      className="ide-icon-btn"
                      onClick={detenerEjecucion}
                      aria-label="Detener ejecución"
                      title="Detener"
                    >
                      <Square size={13} aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="ide-actions">
                  <button
                    type="button"
                    className="ide-icon-btn hide-narrow"
                    onClick={formatearActual}
                    aria-label="Ordenar código automáticamente"
                    title="Ordenar código (Ctrl + Shift + F)"
                  >
                    <Wand2 size={14} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="ide-icon-btn hide-narrow"
                    onClick={() => setLayoutVertical((v) => !v)}
                    aria-label={layoutVertical ? 'Cambiar a vista horizontal' : 'Cambiar a vista vertical'}
                    title={layoutVertical ? 'División horizontal' : 'División vertical'}
                  >
                    {layoutVertical ? (
                      <Columns2 size={14} aria-hidden="true" />
                    ) : (
                      <Rows2 size={14} aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    className="ide-icon-btn hide-narrow"
                    onClick={() =>
                      descargarArchivo(
                        `${pestanaActual.nombre.replace(/\.edu$/i, '')}.txt`,
                        pestanaActual.codigo,
                        'text/plain;charset=utf-8',
                      )
                    }
                    aria-label="Descargar código"
                    title="Guardar código en tu dispositivo"
                  >
                    <Download size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {misionActiva && (
                <div className="mission-strip" role="region" aria-label={`Misión activa: ${misionActiva.titulo}`}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span className="pill-mini">{misionActiva.etiquetaNivel}</span>
                      <strong style={{ fontSize: '0.82rem' }}>{misionActiva.titulo}</strong>
                    </div>
                    <span style={{ fontSize: '0.76rem', color: 'var(--ink-secondary)' }}>
                      {misionActiva.objetivo}
                    </span>
                    {misionActiva.pasos.length > 0 && (
                      <div className="mission-steps-live" aria-label="Pasos de la misión">
                        {misionActiva.pasos.map((paso, idx) => {
                          const ok = paso.cumplido(
                            compilacion?.analisis ?? null,
                            todosDiagnosticos,
                            pestanaActual.codigo,
                          );
                          return (
                            <div key={idx} className={`mission-step-row ${ok ? 'is-done' : ''}`}>
                              {ok ? (
                                <CheckCircle2 size={13} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                              ) : (
                                <Circle size={13} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
                              )}
                              <span>
                                {paso.etiqueta}{' '}
                                {!ok && <code className="mission-step-code">{paso.ejemplo}</code>}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => setAyudanteAbierto(true)}
                    >
                      <Sparkles size={13} aria-hidden="true" /> Ayudante
                    </button>
                    <button
                      type="button"
                      className="btn btn-ok btn-sm"
                      disabled={comprobandoMision}
                      onClick={() => void comprobarMisionActiva()}
                    >
                      <Trophy size={13} aria-hidden="true" />{' '}
                      {comprobandoMision ? 'Comprobando…' : 'Comprobar'}
                    </button>
                    <button
                      type="button"
                      className="ide-icon-btn"
                      onClick={() => {
                        setMisionActiva(null);
                        setFeedbackMision(null);
                      }}
                      aria-label="Salir de la misión"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              <Suspense
                fallback={
                  <div
                    className="edu-cm-wrapper"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--ink-secondary)',
                      fontSize: '0.86rem',
                    }}
                  >
                    Cargando editor…
                  </div>
                }
              >
                <EduEditor
                  ref={editorRef}
                  docId={pestanaActual.id}
                  value={pestanaActual.codigo}
                  onChange={actualizarCodigoActual}
                  activeLine={lineaActiva}
                  hoverLine={hoverLine}
                  errorLines={lineasError}
                  onShortcutRun={() => void iniciarEjecucion('continuo')}
                  onShortcutFormat={formatearActual}
                  onCursorChange={(linea, columna) => setCursorPos({ linea, columna })}
                />
              </Suspense>
            </section>

            <Divisor
              orientacion={layoutVertical ? 'horizontal' : 'vertical'}
              etiqueta="Tamaño del editor y del juego"
              valor={paneles.editor * 100}
              onArrastrar={(delta) => {
                const r = centroRef.current?.getBoundingClientRect();
                const total = r ? (layoutVertical ? r.height : r.width) : 1000;
                const next = {
                  ...panelesLiveRef.current,
                  editor: Math.min(0.72, Math.max(0.3, panelesLiveRef.current.editor + delta / total)),
                };
                panelesLiveRef.current = next;
                aplicarPanelesEnDom(next);
              }}
              onSoltar={confirmarPaneles}
              onReiniciar={() => setPaneles((p) => ({ ...p, editor: PANELES_INICIALES.editor }))}
            />

            {/* PANEL DERECHO UNIFICADO: ESCENARIO 2D + TERMINAL INTERACTIVA PERSISTENTE + CAJITAS */}
            <section
              ref={salidaRef}
              className={`wb-pane wb-output-pane ${layoutVertical ? 'salida-lado-a-lado' : ''} ${vistaMovil === 'salida' ? '' : 'mobile-hidden'}`}
              style={
                {
                  '--alto-juego': `${paneles.juego}px`,
                  '--ancho-juego': `${paneles.juegoAncho * 100}%`,
                } as React.CSSProperties
              }
              aria-label="Escenario 2D, terminal interactiva y cajitas"
            >
              {/* 1. ESCENARIO 2D CON DIRECTOR DE ESCENA Y SELECTOR DIRECTO DE JUEGOS */}
              <GameStage2D
                tema={tema}
                nombrePrograma={pestanaActual.nombre}
                codigo={pestanaActual.codigo}
                runSeq={runSeq}
                salidas={salidas}
                variables={variables}
                estadoEjec={estadoEjec}
                preguntaActiva={preguntaPendiente?.mensaje ?? null}
                opcionesRapidas={opcionesRapidasPregunta}
                onElegirOpcion={enviarValorRespuesta}
                onJugar={() => void iniciarEjecucion('continuo')}
                onDetener={detenerEjecucion}
                onSeleccionarJuego={seleccionarJuegoDirecto}
                desactivarAnimacion={movimientoReducido}
              />

              {layoutVertical ? (
                <Divisor
                  orientacion="vertical"
                  etiqueta="Ancho del juego y de la terminal"
                  valor={paneles.juegoAncho * 100}
                  onArrastrar={(delta) => {
                    const ancho = salidaRef.current?.getBoundingClientRect().width ?? 1000;
                    const next = {
                      ...panelesLiveRef.current,
                      juegoAncho: Math.min(0.75, Math.max(0.3, panelesLiveRef.current.juegoAncho + delta / ancho)),
                    };
                    panelesLiveRef.current = next;
                    aplicarPanelesEnDom(next);
                  }}
                  onSoltar={confirmarPaneles}
                  onReiniciar={() => setPaneles((p) => ({ ...p, juegoAncho: PANELES_INICIALES.juegoAncho }))}
                />
              ) : (
                <Divisor
                  orientacion="horizontal"
                  etiqueta="Tamaño del juego y de la terminal"
                  valor={((paneles.juego - 160) / 480) * 100}
                  onArrastrar={(delta) => {
                    const next = {
                      ...panelesLiveRef.current,
                      juego: Math.min(640, Math.max(160, panelesLiveRef.current.juego + delta)),
                    };
                    panelesLiveRef.current = next;
                    aplicarPanelesEnDom(next);
                  }}
                  onSoltar={confirmarPaneles}
                  onReiniciar={() => setPaneles((p) => ({ ...p, juego: PANELES_INICIALES.juego }))}
                />
              )}

              {/* 2. TERMINAL INTERACTIVA PERSISTENTE (NUNCA SE CIERRA: PERMITE RESPONDER Y REJUGAR AQUÍ TAMBIÉN) */}
              <div className="terminal-shell">
                <div className="wb-pane-header terminal-header">
                  <span className="wb-pane-title">
                    <Terminal size={14} aria-hidden="true" style={{ color: 'var(--accent)' }} />
                    <span>Terminal</span>
                    {conectandoPython ? (
                      <span className="pill-mini">Conectando con Python…</span>
                    ) : preguntaPendiente ? (
                      <span className="pill-mini ok">● Tu turno</span>
                    ) : estadoEjec === 'esperando_paso' ? (
                      <span className="pill-mini ok">● En pausa</span>
                    ) : estadoEjec !== 'inactivo' ? (
                      <span className="pill-mini">● En marcha</span>
                    ) : salidas.length > 0 ? (
                      <span className="pill-mini">✓ Finalizado</span>
                    ) : null}
                    {lineaActiva && <span className="pill-mini">L{lineaActiva}</span>}
                  </span>

                  <div className="ide-actions">
                    <button
                      type="button"
                      className="ide-icon-btn"
                      onClick={() => {
                        setSalidas([]);
                        setTiempoUltEjec(null);
                      }}
                      aria-label="Limpiar salida"
                      title="Limpiar terminal"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Historial vivo de líneas de la terminal */}
                <div className="overlay-scroll-host is-flex">
                  <div
                    ref={setWbOutputNode}
                    className="output-stream"
                    role="log"
                    aria-live="polite"
                    aria-label="Consola de salida"
                  >
                    {salidas.length === 0 && !preguntaPendiente && todosDiagnosticos.length === 0 && (
                      <div className="output-empty">
                        <p style={{ margin: '0 0 8px' }}>
                          Toca un juego arriba (<strong>RPG</strong>, <strong>Torneo</strong>,{' '}
                          <strong>Cohete</strong>, <strong>Bóveda</strong>, <strong>Dado</strong>,{' '}
                          <strong>Calcu</strong> o <strong>Libre</strong>) o pulsa <strong>Jugar</strong> para
                          empezar.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void iniciarEjecucion('continuo')}
                        >
                          <Play size={13} aria-hidden="true" /> Jugar ahora
                        </button>
                      </div>
                    )}

                    {salidas.map((item) => {
                      const valClass = item.clase === 'salida' ? clasificarValorSalida(item.texto) : '';
                      const rowClass =
                        item.clase === 'salida'
                          ? valClass
                          : `is-${item.clase}`;
                      const prefijo =
                        item.clase === 'pregunta'
                          ? '? '
                          : item.clase === 'respuesta'
                            ? '› '
                            : '';
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`output-row ${rowClass}`}
                          onMouseEnter={() => setHoverLine(item.linea)}
                          onMouseLeave={() => setHoverLine(null)}
                          onClick={() => {
                            if (item.linea) editorRef.current?.focusLine(item.linea, 1);
                          }}
                        >
                          <span className="output-ln">{item.linea ?? '·'}</span>
                          <span className="output-val">
                            {prefijo}
                            {item.texto}
                          </span>
                        </button>
                      );
                    })}
                    <div ref={outputEndRef} />
                  </div>
                  <ContainerOverlayScrollbar targetRef={wbOutputScrollRef} />
                </div>

                {/* Barra de entrada SIEMPRE ABIERTA en la terminal (los botones rápidos viven en el Escenario 2D para no duplicar espacio vertical) */}
                <div
                  className={`terminal-input-dock ${preguntaPendiente ? 'is-waiting' : ''}`}
                  role="region"
                  aria-label="Entrada de la terminal"
                >
                  <form
                    className="terminal-prompt-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (preguntaPendiente) {
                        enviarValorRespuesta(textoRespuesta);
                      } else if (estadoEjec !== 'inactivo') {
                        return;
                      } else {
                        setComandoTerminal('');
                        void iniciarEjecucion('continuo');
                      }
                    }}
                  >
                    <span className="terminal-prompt-sig" aria-hidden="true">
                      &gt;_
                    </span>
                    <label htmlFor="wb-prompt-input" className="sr-only">
                      {preguntaPendiente ? preguntaPendiente.mensaje : 'Comando de terminal'}
                    </label>
                    <input
                      id="wb-prompt-input"
                      type="text"
                      className="terminal-prompt-input"
                      value={preguntaPendiente ? textoRespuesta : comandoTerminal}
                      onChange={(e) => {
                        if (preguntaPendiente) setTextoRespuesta(e.target.value);
                        else setComandoTerminal(e.target.value);
                      }}
                      placeholder={
                        preguntaPendiente
                          ? `${preguntaPendiente.mensaje} (escribe aquí y pulsa Enter)`
                          : estadoEjec !== 'inactivo'
                            ? 'Ejecutando en Python…'
                            : salidas.length > 0
                              ? `Partida terminada · pulsa Enter o «${textoOtraVez(pestanaActual.nombre, pestanaActual.codigo, variables)}»`
                              : 'Pulsa Enter o Jugar para iniciar en la terminal...'
                      }
                    />
                    {preguntaPendiente ? (
                      <button type="submit" className="btn btn-primary btn-sm">
                        <Send size={13} aria-hidden="true" /> Enviar
                      </button>
                    ) : estadoEjec !== 'inactivo' ? (
                      <button type="button" className="btn btn-sm" disabled>
                        En marcha…
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                      >
                        {salidas.length > 0 ? (
                          <>
                            <RotateCcw size={13} aria-hidden="true" />{' '}
                            {textoOtraVez(pestanaActual.nombre, pestanaActual.codigo, variables)}
                          </>
                        ) : (
                          <>
                            <Play size={13} aria-hidden="true" /> Jugar
                          </>
                        )}
                      </button>
                    )}
                  </form>
                </div>
              </div>

              {/* Diagnósticos y pistas pedagógicas amigables con botón de arreglo en 1 clic */}
              {todosDiagnosticos.length > 0 && (
                <div className="diag-stack" role="alert" aria-label="Pistas de Chispa para corregir el código">
                  {todosDiagnosticos.map((d, idx) => {
                    const pista = obtenerPistaPedagogica(d, pestanaActual.codigo);
                    return (
                      <div key={idx} className="diag-item">
                        <div className="diag-item-head">
                          <strong style={{ fontSize: '0.8rem', color: 'var(--err)' }}>
                            <Lightbulb size={13} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4 }} />
                            Pista de Chispa · {d.linea ? `Línea ${d.linea}` : 'Revisa tu código'}
                          </strong>
                          {d.linea && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => {
                                editorRef.current?.focusLine(d.linea!, d.columna ?? 1);
                                setVistaMovil('editor');
                              }}
                            >
                              Ver línea {d.linea}
                            </button>
                          )}
                        </div>

                        <div className="diag-hint-box">
                          <div>
                            <strong>{pista.titulo}:</strong> {pista.explicacion}
                          </div>
                          {pista.ejemplo && (
                            <pre className="diag-example-code">{pista.ejemplo}</pre>
                          )}
                          <div className="diag-actions-row">
                            {falloConexionActual && (
                              <button
                                type="button"
                                className="diag-autofix-btn"
                                onClick={reintentarConexion}
                              >
                                <RotateCcw size={13} aria-hidden="true" />
                                Reintentar
                              </button>
                            )}
                            {pista.autoFix && (
                              <button
                                type="button"
                                className="diag-autofix-btn"
                                onClick={() => {
                                  const corregido = pista.autoFix!.aplicar(pestanaActual.codigo);
                                  actualizarCodigoActual(corregido);
                                  setVistaMovil('editor');
                                }}
                              >
                                <Sparkles size={13} aria-hidden="true" />
                                {pista.autoFix.etiqueta}
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setAyudanteAbierto(true)}
                            >
                              Abrir Ayudante
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cajitas de memoria acopladas abajo (formato amigable para niños) */}
              <div className="memory-dock" aria-label="Tus cajitas guardadas en vivo">
                <div className="memory-dock-head">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Box size={12} aria-hidden="true" /> Tus cajitas ({variables.length})
                  </span>
                  {pilaLlamadas.length > 1 && (
                    <span className="mono" style={{ textTransform: 'none' }}>
                      Receta: {pilaLlamadas.join(' → ')}
                    </span>
                  )}
                </div>
                {variables.length === 0 ? (
                  <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                    Cuando crees variables, aparecerán aquí como cajitas vivas.
                  </span>
                ) : (
                  <div ref={wbMemAnimRef} className="memory-chips">
                    {variables.map((v) => {
                      const badge =
                        v.tipo === 'numero'
                          ? '123'
                          : v.tipo === 'texto'
                            ? 'ABC'
                            : v.tipo === 'logico'
                              ? 'SÍ/NO'
                              : 'vacía';
                      return (
                        <span
                          key={v.idInterno}
                          className={`mem-chip ${v.cambioReciente ? 'changed' : ''}`}
                        >
                          <span className="mem-chip-badge">{badge}</span>
                          <span className="mem-chip-name">{v.nombre}</span>
                          <span>=</span>
                          <span className="mem-chip-val">{v.valor}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* PANEL LATERAL DERECHO ACOPLADO AL DOCK */}
          <RightDrawer
            panel={panelDerecho ?? (vistaMovil === 'misiones' ? 'misiones' : null)}
            onCerrar={() => setPanelDerecho(null)}
            misionesCompletadas={misionesCompletadas}
            misionActiva={misionActiva}
            onIniciarMision={iniciarMision}
            onComprobarMision={() => void comprobarMisionActiva()}
            feedbackMision={feedbackMision}
            onInsertarBloque={(snippet) => {
              editorRef.current?.insertSnippet(snippet);
              setVistaMovil('editor');
            }}
            onAbrirCodigoNuevo={(nombre, codigo) => abrirNuevaPestana(nombre, codigo)}
            onImportarArchivo={() => fileInputRef.current?.click()}
            onExportarEdu={() =>
              descargarArchivo(
                `${pestanaActual.nombre.replace(/\.edu$/i, '')}.txt`,
                pestanaActual.codigo,
                'text/plain;charset=utf-8',
              )
            }
            historial={historialPestana}
            onGuardarInstantanea={() => guardarInstantanea('Guardado manual')}
            onRestaurarInstantanea={(codigo) => actualizarCodigoActual(codigo)}
            nombrePestanaActual={pestanaActual.nombre}
            mobileVisible={vistaMovil === 'misiones'}
          />

          {/* DOCK VERTICAL DERECHO CON ETIQUETAS CLARAS PARA NIÑOS */}
          <nav className="wb-dock" aria-label="Herramientas del entorno">
            <div className="dock-group">
              <button
                type="button"
                className="dock-btn"
                onClick={() => {
                  detenerEjecucion();
                  setVistaApp('inicio');
                }}
                aria-label="Volver a la página principal"
                title="Volver a la página principal"
              >
                <Home size={16} aria-hidden="true" />
                <span className="dock-btn-label">Inicio</span>
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'ejemplos'}
                onClick={() => alternarPanelDerecho('ejemplos')}
                aria-label="Juegos 2D y proyectos"
                title="Juegos 2D y archivos"
              >
                <Gamepad2 size={16} aria-hidden="true" />
                <span className="dock-btn-label">Juegos</span>
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'misiones'}
                onClick={() => alternarPanelDerecho('misiones')}
                aria-label="Misiones educativas"
                title="Retos y XP"
              >
                <Trophy size={16} aria-hidden="true" />
                <span className="dock-btn-label">Retos</span>
                {misionesCompletadas.length > 0 && <span className="dock-dot-badge" aria-hidden="true" />}
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'guia'}
                onClick={() => alternarPanelDerecho('guia')}
                aria-label="Guía rápida de bloques"
                title="Guía de bloques"
              >
                <BookOpen size={16} aria-hidden="true" />
                <span className="dock-btn-label">Guía</span>
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'historial'}
                onClick={() => alternarPanelDerecho('historial')}
                aria-label="Copias guardadas"
                title="Copias guardadas"
              >
                <History size={16} aria-hidden="true" />
                <span className="dock-btn-label">Copias</span>
              </button>
            </div>

            <div className="dock-group">
              <button
                type="button"
                className="dock-btn"
                onClick={() => setComandosAbiertos(true)}
                aria-label="Paleta de comandos (Ctrl+K)"
                title="Buscar rápido (Ctrl + K)"
              >
                <Search size={16} aria-hidden="true" />
                <span className="dock-btn-label">Buscar</span>
              </button>

              <button
                type="button"
                className="dock-btn"
                onClick={() => setTemasAbiertos(true)}
                aria-label={`Galería de ${TEMAS_CATALOGO.length} temas`}
                title={`Temas (${temaMeta.nombre})`}
              >
                <Palette size={16} aria-hidden="true" />
                <span className="dock-btn-label">Temas</span>
              </button>

              <button
                type="button"
                className="dock-btn"
                onClick={() => setAjustesAbiertos(true)}
                aria-label="Ajustes"
                title="Ajustes y accesibilidad"
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                <span className="dock-btn-label">Ajustes</span>
              </button>
            </div>
          </nav>
        </main>

        {/* BARRA DE ESTADO INFERIOR IDE (28px — DESKTOP) */}
        <footer className="wb-statusbar" aria-label="Barra de estado del compilador">
          <div className="status-group">
            <a
              href="https://github.com/topional/code-compiler"
              target="_blank"
              rel="noreferrer"
              className="status-link"
              title="Repositorio topional/code-compiler"
            >
              <Zap size={12} aria-hidden="true" style={{ color: 'var(--accent)' }} />
              <span>Code Compiler · Chispa</span>
            </a>

            <span>
              {urlApi.includes('127.0.0.1') || urlApi.includes('localhost')
                ? 'Python · local'
                : 'Python · Render'}
            </span>

            {conectandoPython ? (
              <span className="status-ok">Conectando con Python…</span>
            ) : todosDiagnosticos.length === 0 ? (
              <span className="status-ok">
                ✓ Listo{' '}
                {tiempoUltEjec !== null
                  ? `en ${tiempoUltEjec.toFixed(1)} ms`
                  : compilacion
                    ? `(${compilacion.duracionMs.toFixed(1)} ms)`
                    : ''}
              </span>
            ) : (
              <span className="status-err">
                ⚠ {todosDiagnosticos.length} {todosDiagnosticos.length === 1 ? 'aviso' : 'avisos'}
              </span>
            )}
          </div>

          <div className="status-group">
            <span>
              Ln {cursorPos.linea}, Col {cursorPos.columna}
            </span>

            <button
              type="button"
              className="status-btn"
              onClick={() => setTemasAbiertos(true)}
              title={`Cambiar tema visual (${TEMAS_CATALOGO.length} disponibles)`}
            >
              <span className="swatch-dot" style={{ backgroundColor: temaMeta.muestras[2], width: 9, height: 9 }} aria-hidden="true" />
              <span>{temaMeta.nombre}</span>
              <ChevronDown size={12} aria-hidden="true" />
            </button>

            <span>Estudio 2D</span>
          </div>
        </footer>

        {/* DOCK INFERIOR EN MÓVIL / TABLET (< 960px — ESTILO GOJS.APP/APP/) */}
        <nav className="mobile-bottom-dock" aria-label="Navegación móvil">
          <button
            type="button"
            className="mob-dock-btn"
            aria-pressed={vistaMovil === 'editor'}
            onClick={() => setVistaMovil('editor')}
          >
            <Code2 size={17} aria-hidden="true" />
            <span>Código</span>
          </button>
          <button
            type="button"
            className="mob-dock-btn"
            aria-pressed={vistaMovil === 'salida'}
            onClick={() => setVistaMovil('salida')}
          >
            <Gamepad2 size={17} aria-hidden="true" />
            <span>Juego 2D</span>
          </button>
          <button
            type="button"
            className="mob-dock-btn"
            aria-pressed={vistaMovil === 'bloques'}
            onClick={() => setVistaMovil('bloques')}
          >
            <Blocks size={17} aria-hidden="true" />
            <span>Bloques</span>
          </button>
          <button
            type="button"
            className="mob-dock-btn"
            aria-pressed={vistaMovil === 'misiones'}
            onClick={() => {
              setPanelDerecho('misiones');
              setVistaMovil('misiones');
            }}
          >
            <Trophy size={17} aria-hidden="true" />
            <span>Misiones</span>
          </button>
          <button
            type="button"
            className="mob-dock-btn"
            onClick={() => {
              setPanelDerecho('ejemplos');
              setVistaMovil('misiones');
            }}
          >
            <FolderOpen size={17} aria-hidden="true" />
            <span>Juegos</span>
          </button>
          <button
            type="button"
            className="mob-dock-btn"
            onClick={() => setTemasAbiertos(true)}
          >
            <Palette size={17} aria-hidden="true" />
            <span>Temas</span>
          </button>
        </nav>

          </motion.div>
        )}
      </AnimatePresence>

      {/* MODALES NATIVOS (<dialog>) */}
      {modalesCompartidos}
    </MotionConfig>
  );
}
