import { useAutoAnimate } from '@formkit/auto-animate/react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Blocks,
  BookOpen,
  Box,
  ChevronDown,
  Code2,
  Columns2,
  Download,
  FolderOpen,
  Gamepad2,
  History,
  Home,
  Lightbulb,
  Palette,
  Pause,
  Play,
  Plus,
  Rows2,
  Search,
  Send,
  SkipForward,
  SlidersHorizontal,
  Square,
  Terminal,
  Trash2,
  Trophy,
  Wand2,
  X,
  Zap,
} from 'lucide-react';

import { ChispaMascota } from './components/ChispaLogo';
import { CommandPalette } from './components/CommandPalette';
import { EduEditor, type EduEditorHandle } from './components/EduEditor';
import { GameStage2D } from './components/GameStage2D';
import { LandingHome } from './components/LandingHome';
import { ContainerOverlayScrollbar } from './components/OverlayScrollbar';
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
  compilarConApiRemota,
  compilarEdu,
  obtenerPistaPedagogica,
} from './engine/compilador';
import { formatearCodigoEdu } from './engine/formateador';
import { ejecutarIntermedio } from './engine/interprete';
import type {
  Diagnostico,
  ProgramaIntermedio,
  TipoEdu,
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
  tipo: TipoEdu;
  resolver: (valor: string | null) => void;
}

type VistaMovil = 'editor' | 'salida' | 'bloques' | 'misiones';

const STORAGE_KEYS = {
  tema: 'chispa_edu_tema_v2',
  escala: 'chispa_edu_escala',
  movimiento: 'chispa_edu_reduced_motion',
  pestanas: 'chispa_edu_wb_pestanas_v5',
  misiones: 'chispa_edu_misiones_ok',
};

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
  const [vistaMovil, setVistaMovil] = useState<VistaMovil>('editor');

  // Modales nativos
  const [temasAbiertos, setTemasAbiertos] = useState(false);
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [comandosAbiertos, setComandosAbiertos] = useState(false);

  // Pestañas y archivos
  const [pestanas, setPestanas] = useState<PestanaCodigo[]>(() => leerPestanasIniciales());
  const [pestanaActivaId, setPestanaActivaId] = useState<string>(() => leerPestanasIniciales()[0].id);
  const pestanaActual = pestanas.find((p) => p.id === pestanaActivaId) ?? pestanas[0];

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

  // Motor y ejecución
  const [modoMotor, setModoMotor] = useState<'navegador' | 'api'>('navegador');
  const [urlApi, setUrlApi] = useState('http://127.0.0.1:8000');
  const [velocidadMs, setVelocidadMs] = useState(0);
  const [autoRun, setAutoRun] = useState(true);

  const [cursorPos, setCursorPos] = useState<{ linea: number; columna: number }>({ linea: 1, columna: 1 });
  const [estadoEjec, setEstadoEjec] = useState<'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso'>('inactivo');
  const [salidas, setSalidas] = useState<ItemSalida[]>([]);
  const [variables, setVariables] = useState<VariableMemoria[]>([]);
  const [pilaLlamadas, setPilaLlamadas] = useState<string[]>(['programa']);
  const [lineaActiva, setLineaActiva] = useState<number | null>(null);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [diagnosticosEjec, setDiagnosticosEjec] = useState<Diagnostico[]>([]);
  const [tiempoUltEjec, setTiempoUltEjec] = useState<number | null>(null);
  const [preguntaPendiente, setPreguntaPendiente] = useState<PreguntaPendiente | null>(null);
  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [historial, setHistorial] = useState<InstantaneaCodigo[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const pasoResolverRef = useRef<((continuar: boolean) => void) | null>(null);
  const modoPasoRef = useRef(false);
  const pausadoRef = useRef(false);
  const velocidadRef = useRef(velocidadMs);
  velocidadRef.current = velocidadMs;
  const seqRef = useRef(0);

  const temaMeta = obtenerTema(tema);

  // Compilación en vivo en navegador (< 1 ms)
  const compilacion = useMemo(
    () => compilarEdu(pestanaActual.codigo, 'intermedio'),
    [pestanaActual.codigo],
  );

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
    setSalidas([]);
    setVariables([]);
    setPilaLlamadas(['programa']);
    setDiagnosticosEjec([]);
    if (!silencioso) {
      setFeedbackMision(null);
      guardarInstantanea(pasoAPaso ? 'Paso a paso' : 'Ejecución');
      if (window.innerWidth <= 960 && !pasoAPaso) {
        setVistaMovil('salida');
      }
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
            mensaje: `No se pudo conectar con la API Python en ${urlApi}. Cambia a Navegador en Ajustes.`,
            linea: null,
            columna: null,
          },
        ]);
        return;
      }
    } else {
      if (compilacion.diagnosticos.length > 0 || !compilacion.intermedio) return;
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
        if (ev.tipo === 'salida') agregarSalida('salida', ev.texto, ev.linea);
        else if (ev.tipo === 'pregunta') agregarSalida('pregunta', ev.mensaje, ev.linea);
        else if (ev.tipo === 'entrada_invalida') agregarSalida('aviso', ev.mensaje, ev.linea);
        else if (ev.tipo === 'motivacion') {
          agregarSalida(
            'motivacion',
            ev.modo === 'juego' ? 'Modo juego activado' : 'Modo calculadora activado',
            ev.linea,
          );
        } else if (ev.tipo === 'paso') {
          setVariables(ev.estado.variables);
          setPilaLlamadas(ev.estado.pilaLlamadas);
          setLineaActiva(ev.estado.linea);
        } else if (ev.tipo === 'fin') {
          setTiempoUltEjec(Math.max(0.1, ev.duracionMs));
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

  // Auto-run inmediato al abrir o cambiar de pestaña sin `preguntar`, y debounce 450 ms al escribir
  const primeraCargaRef = useRef(true);
  useEffect(() => {
    if (!autoRun || tienePreguntar || compilacion.diagnosticos.length > 0) return;
    if (primeraCargaRef.current) {
      primeraCargaRef.current = false;
      void iniciarEjecucion(false, true);
      return;
    }
    const t = setTimeout(() => {
      void iniciarEjecucion(false, true);
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestanaActual.id, pestanaActual.codigo, autoRun, tienePreguntar]);

  const avanzarUnPaso = () => {
    if (pasoResolverRef.current) {
      const fn = pasoResolverRef.current;
      pasoResolverRef.current = null;
      fn(true);
    } else if (estadoEjec === 'inactivo') {
      void iniciarEjecucion(true);
    }
  };

  const actualizarCodigoActual = (nuevo: string) => {
    setPestanas((prev) => prev.map((p) => (p.id === pestanaActual.id ? { ...p, codigo: nuevo } : p)));
  };

  const abrirNuevaPestana = (nombre?: string, codigo?: string) => {
    detenerEjecucion();
    const id = `tab-${Date.now()}`;
    const nombreLimpio = (nombre ?? `mi_juego_${pestanas.length + 1}`).replace(/\.edu$/i, '');
    setPestanas((prev) => [
      ...prev,
      {
        id,
        nombre: nombreLimpio,
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
      return [...prev, { id, nombre: `${mision.id}.edu`, codigo: mision.codigoInicial }];
    });
    setPestanaActivaId(id);
    setVistaMovil('editor');
  };

  const comprobarMisionActiva = async () => {
    if (!misionActiva) return;
    const res = await misionActiva.verificar(pestanaActual.codigo);
    setFeedbackMision({ ok: res.completada, texto: res.mensaje });
    if (res.completada) {
      setMisionesCompletadas((prev) => (prev.includes(misionActiva.id) ? prev : [...prev, misionActiva.id]));
      if (
        !movimientoReducido &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        void confetti({ particleCount: 70, spread: 68, origin: { y: 0.65 } });
      }
    }
  };

  const formatearActual = () => {
    const f = formatearCodigoEdu(pestanaActual.codigo);
    if (f !== pestanaActual.codigo) actualizarCodigoActual(f);
  };

  const enviarValorRespuesta = (val: string) => {
    if (!preguntaPendiente) return;
    const { resolver } = preguntaPendiente;
    setPreguntaPendiente(null);
    setTextoRespuesta('');
    agregarSalida('respuesta', val);
    resolver(val);
  };

  const enviarRespuesta = (e: React.FormEvent) => {
    e.preventDefault();
    enviarValorRespuesta(textoRespuesta);
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
  const ultimaSalida = salidas.at(-1);

  const estadoMascota: 'feliz' | 'pensando' | 'celebrando' | 'alerta' =
    todosDiagnosticos.length > 0
      ? 'alerta'
      : estadoEjec !== 'inactivo'
        ? 'pensando'
        : salidas.length > 0
          ? 'celebrando'
          : 'feliz';

  const textoBurbujaChispa = preguntaPendiente
    ? `¿${preguntaPendiente.mensaje.replace(/^¿|\?$/g, '')}?`
    : todosDiagnosticos.length > 0
      ? `Encontré ${todosDiagnosticos.length} detalle(s) — haz clic en un aviso para ver la pista`
      : ultimaSalida
        ? ultimaSalida.texto
        : 'Escribe código .edu o toca un bloque Scratch a la izquierda';

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
        modoMotor={modoMotor}
        onCambiarModoMotor={setModoMotor}
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
          aria-label="Importar archivo .edu"
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
            mobileVisible={vistaMovil === 'bloques'}
          />

          {/* ÁREA CENTRAL: EDITOR + SALIDA/ESCENARIO */}
          <div
            className={`wb-center ${layoutVertical ? 'layout-vertical' : ''} ${
              vistaMovil === 'editor' || vistaMovil === 'salida' ? '' : 'mobile-hidden'
            }`}
          >
            {/* PANEL EDITOR */}
            <section
              className={`wb-pane wb-editor-pane ${vistaMovil === 'editor' ? '' : 'mobile-hidden'}`}
              aria-label="Editor de código .edu"
            >
              <div className="wb-pane-header">
                <div className="tab-strip" role="region" aria-label="Pestañas de archivos">
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
                  {pestanas.map((tab) => (
                    <div key={tab.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
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

                <div className="ide-actions">
                  <button
                    type="button"
                    className="ide-icon-btn run-btn"
                    onClick={() => void iniciarEjecucion(false)}
                    disabled={compilacion.diagnosticos.length > 0 && modoMotor === 'navegador'}
                    title="Jugar y ejecutar programa (Ctrl + Enter)"
                  >
                    <Play size={13} aria-hidden="true" />
                    <span>Jugar</span>
                  </button>

                  <button
                    type="button"
                    className="ide-icon-btn accent-btn"
                    onClick={avanzarUnPaso}
                    disabled={compilacion.diagnosticos.length > 0 && modoMotor === 'navegador'}
                    title="Ejecutar paso a paso"
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

                  <button
                    type="button"
                    className={`ide-icon-btn hide-narrow ${autoRun ? 'active-toggle' : ''}`}
                    aria-pressed={autoRun}
                    onClick={() => setAutoRun((v) => !v)}
                    aria-label={autoRun ? 'Pausar auto-ejecución' : 'Activar auto-ejecución'}
                    title={autoRun ? 'Auto-run activo (clic para pausar)' : 'Auto-run pausado'}
                  >
                    {autoRun ? <Pause size={13} aria-hidden="true" /> : <Zap size={13} aria-hidden="true" />}
                  </button>

                  <button
                    type="button"
                    className="ide-icon-btn hide-narrow"
                    onClick={formatearActual}
                    aria-label="Formatear código .edu"
                    title="Indentar código (Ctrl + Shift + F)"
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
                      descargarArchivo(pestanaActual.nombre, pestanaActual.codigo, 'text/plain;charset=utf-8')
                    }
                    aria-label="Descargar archivo .edu"
                    title="Descargar .edu"
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
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-ok btn-sm"
                      onClick={() => void comprobarMisionActiva()}
                    >
                      <Trophy size={13} aria-hidden="true" /> Comprobar
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

              <EduEditor
                ref={editorRef}
                value={pestanaActual.codigo}
                onChange={actualizarCodigoActual}
                activeLine={lineaActiva}
                hoverLine={hoverLine}
                errorLines={lineasError}
                onShortcutRun={() => void iniciarEjecucion(false)}
                onShortcutFormat={formatearActual}
                onCursorChange={(linea, columna) => setCursorPos({ linea, columna })}
              />
            </section>

            {/* PANEL SALIDA ANCLADA POR LÍNEA + ESCENARIO CHISPA + MEMORIA */}
            <section
              className={`wb-pane wb-output-pane ${vistaMovil === 'salida' ? '' : 'mobile-hidden'}`}
              aria-label="Salida, escenario y memoria"
            >
              <div className="wb-pane-header">
                <span className="wb-pane-title">
                  <Terminal size={14} aria-hidden="true" />
                  Salida
                  {lineaActiva && <span className="pill-mini">L{lineaActiva}</span>}
                </span>

                <div className="ide-actions">
                  <label htmlFor="wb-speed" className="sr-only">
                    Velocidad de ejecución
                  </label>
                  <select
                    id="wb-speed"
                    className="ide-icon-btn"
                    style={{
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-surface-alt)',
                      padding: '0 6px',
                    }}
                    value={String(velocidadMs)}
                    onChange={(e) => setVelocidadMs(Number(e.target.value))}
                    aria-label="Velocidad de ejecución"
                  >
                    <option value="0">Turbo</option>
                    <option value="180">Normal</option>
                    <option value="450">Lento</option>
                  </select>

                  <button
                    type="button"
                    className="ide-icon-btn"
                    onClick={() => {
                      setSalidas([]);
                      setTiempoUltEjec(null);
                    }}
                    aria-label="Limpiar salida"
                    title="Limpiar salida"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* ESCENARIO 2D INTERACTIVO ANIMADO (ESTILO SCRATCH × POKÉMON × MAKECODE) */}
              <GameStage2D
                tema={tema}
                nombrePrograma={pestanaActual.nombre}
                codigo={pestanaActual.codigo}
                salidas={salidas}
                variables={variables}
                estadoEjec={estadoEjec}
                desactivarAnimacion={movimientoReducido}
              />

              {/* Entrada interactiva para `preguntar` (con botones rápidos de juego 2D!) */}
              {preguntaPendiente && (
                <div className="inline-prompt" role="region" aria-label="Responder pregunta del juego">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                    <strong style={{ fontSize: '0.84rem' }}>{preguntaPendiente.mensaje}</strong>
                    <span className="pill-mini ok">Tu turno</span>
                  </div>
                  {opcionesRapidasPregunta.length > 0 && (
                    <div className="quick-choice-row" role="group" aria-label="Opciones rápidas del juego">
                      {opcionesRapidasPregunta.map((op) => (
                        <button
                          key={op.val}
                          type="button"
                          className="quick-choice-btn"
                          onClick={() => enviarValorRespuesta(op.val)}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <form className="inline-prompt-form" onSubmit={enviarRespuesta}>
                    <label htmlFor="wb-prompt-input" className="sr-only">
                      Tu respuesta
                    </label>
                    <input
                      id="wb-prompt-input"
                      type="text"
                      className="ide-input"
                      value={textoRespuesta}
                      onChange={(e) => setTextoRespuesta(e.target.value)}
                      placeholder={
                        preguntaPendiente.tipo === 'numero'
                          ? 'O escribe un número...'
                          : preguntaPendiente.tipo === 'logico'
                            ? 'verdadero o falso'
                            : 'Escribe aquí...'
                      }
                      autoFocus
                    />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Send size={13} aria-hidden="true" /> Enviar
                    </button>
                  </form>
                </div>
              )}

              {/* Mini barra de ánimo de Chispa */}
              <div className="stage-hero-strip" aria-live="polite">
                <ChispaMascota estado={estadoMascota} size={30} />
                <div className="stage-bubble" title={textoBurbujaChispa}>
                  {textoBurbujaChispa}
                </div>
              </div>

              {/* Salida anclada por número de línea (estilo GoJS.app) */}
              <div className="overlay-scroll-host is-flex">
                <div
                  ref={setWbOutputNode}
                  className="output-stream"
                  role="log"
                  aria-live="polite"
                  aria-label="Consola de salida"
                >
                  {salidas.length === 0 && !preguntaPendiente && todosDiagnosticos.length === 0 && (
                    <p className="output-empty">
                      Pulsa <strong>Jugar</strong> (`Ctrl + Enter`) para ver tu juego cobrar vida en
                      el Escenario 2D.
                    </p>
                  )}

                  {salidas.map((item) => {
                    const valClass = item.clase === 'salida' ? clasificarValorSalida(item.texto) : '';
                    const rowClass =
                      item.clase === 'salida'
                        ? valClass
                        : `is-${item.clase}`;
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
                          {item.clase === 'salida' && valClass === ''
                            ? `"${item.texto}"`
                            : item.texto}
                        </span>
                      </button>
                    );
                  })}
                  <div ref={outputEndRef} />
                </div>
                <ContainerOverlayScrollbar targetRef={wbOutputScrollRef} />
              </div>

              {/* Diagnósticos y pistas pedagógicas */}
              {todosDiagnosticos.length > 0 && (
                <div className="diag-stack" role="alert" aria-label="Errores del compilador">
                  {todosDiagnosticos.map((d, idx) => {
                    const pista = obtenerPistaPedagogica(d);
                    return (
                      <button
                        key={idx}
                        type="button"
                        className="diag-item"
                        onClick={() => {
                          if (d.linea) {
                            editorRef.current?.focusLine(d.linea, d.columna);
                            setVistaMovil('editor');
                          }
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                          <strong style={{ fontSize: '0.78rem', color: 'var(--err)' }}>
                            [{d.etapa}] {d.linea ? `Línea ${d.linea}:${d.columna ?? 1}` : 'General'}
                          </strong>
                          <span className="pill-mini">Ir</span>
                        </div>
                        <span className="mono" style={{ fontSize: '0.76rem' }}>
                          {d.mensaje}
                        </span>
                        <div className="diag-hint-box">
                          <Lightbulb size={12} aria-hidden="true" style={{ verticalAlign: -2, marginRight: 4 }} />
                          <strong>{pista.titulo}:</strong> {pista.explicacion}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Cajitas de memoria acopladas abajo */}
              <div className="memory-dock" aria-label="Cajitas de memoria en vivo">
                <div className="memory-dock-head">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Box size={12} aria-hidden="true" /> Memoria ({variables.length})
                  </span>
                  <span className="mono">Pila: {pilaLlamadas.join(' → ')}</span>
                </div>
                {variables.length === 0 ? (
                  <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                    Sin variables activas todavía.
                  </span>
                ) : (
                  <div ref={wbMemAnimRef} className="memory-chips">
                    {variables.map((v) => (
                      <span
                        key={v.idInterno}
                        className={`mem-chip ${v.cambioReciente ? 'changed' : ''}`}
                      >
                        <span className="mem-chip-name">{v.nombre}</span>
                        <span>=</span>
                        <span className="mem-chip-val">{v.valor}</span>
                        <span className="mem-chip-type">({v.tipo})</span>
                      </span>
                    ))}
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
              descargarArchivo(pestanaActual.nombre, pestanaActual.codigo, 'text/plain;charset=utf-8')
            }
            historial={historialPestana}
            onGuardarInstantanea={() => guardarInstantanea('Guardado manual')}
            onRestaurarInstantanea={(codigo) => actualizarCodigoActual(codigo)}
            nombrePestanaActual={pestanaActual.nombre}
            mobileVisible={vistaMovil === 'misiones'}
          />

          {/* DOCK VERTICAL DERECHO (46px EN DESKTOP — ESTILO GOJS.APP/APP/) */}
          <nav className="wb-dock" aria-label="Herramientas del entorno">
            <div className="dock-group">
              <button
                type="button"
                className="dock-btn"
                onClick={() => {
                  detenerEjecucion();
                  setVistaApp('inicio');
                }}
                aria-label="Página principal"
                title="Volver a la página principal"
              >
                <Home size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'ejemplos'}
                onClick={() => alternarPanelDerecho('ejemplos')}
                aria-label="Juegos 2D y proyectos"
                title="Juegos 2D y archivos"
              >
                <Gamepad2 size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'misiones'}
                onClick={() => alternarPanelDerecho('misiones')}
                aria-label="Misiones educativas"
                title="Misiones guiadas"
              >
                <Trophy size={18} aria-hidden="true" />
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
                <BookOpen size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="dock-btn"
                aria-pressed={panelDerecho === 'historial'}
                onClick={() => alternarPanelDerecho('historial')}
                aria-label="Historial de versiones"
                title="Historial de instantáneas"
              >
                <History size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="dock-group">
              <button
                type="button"
                className="dock-btn"
                onClick={() => setComandosAbiertos(true)}
                aria-label="Paleta de comandos (Ctrl+K)"
                title="Paleta rápida (Ctrl + K)"
              >
                <Search size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="dock-btn"
                onClick={() => setTemasAbiertos(true)}
                aria-label={`Galería de ${TEMAS_CATALOGO.length} temas`}
                title={`Temas (${temaMeta.nombre})`}
              >
                <Palette size={18} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="dock-btn"
                onClick={() => setAjustesAbiertos(true)}
                aria-label="Ajustes"
                title="Ajustes y accesibilidad"
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
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

            <span>{modoMotor === 'navegador' ? 'Navegador' : 'API Python'}</span>

            {todosDiagnosticos.length === 0 ? (
              <span className="status-ok">
                ✓ Listo {tiempoUltEjec !== null ? `en ${tiempoUltEjec.toFixed(1)} ms` : `(${compilacion.duracionMs.toFixed(1)} ms)`}
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
