import Lenis from 'lenis';
import { MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  Code2,
  ExternalLink,
  Home,
  Search,
  SlidersHorizontal,
  Trophy,
} from 'lucide-react';

import { ChispaLogo } from './components/ChispaLogo';
import { CommandPalette } from './components/CommandPalette';
import { GuideView } from './components/GuideView';
import { HeroLanding } from './components/HeroLanding';
import { MissionsView } from './components/MissionsView';
import { SettingsDialog, type EscalaTexto } from './components/SettingsDialog';
import { StudioView, type PestanaCodigo } from './components/StudioView';
import { ThemePickerDialog } from './components/ThemePickerDialog';
import { EJEMPLOS_EDU } from './data/ejemplos';
import { MISIONES_EDU, type MisionEdu } from './data/misiones';
import { obtenerTema, TEMAS_VALIDOS, type TemaId } from './data/temas';

type RutaApp = 'inicio' | 'estudio' | 'misiones' | 'guia';

const STORAGE_KEYS = {
  tema: 'chispa_edu_tema_v2',
  escala: 'chispa_edu_escala',
  movimiento: 'chispa_edu_reduced_motion',
  pestanas: 'chispa_edu_pestanas',
  misiones: 'chispa_edu_misiones_ok',
};

function leerRutaHash(): RutaApp {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (hash === 'estudio' || hash === 'misiones' || hash === 'guia') return hash;
  return 'inicio';
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
    { id: 'tab-basico', nombre: 'basico.edu', codigo: EJEMPLOS_EDU[0].codigo },
    { id: 'tab-adivina', nombre: 'adivina.edu', codigo: EJEMPLOS_EDU[1].codigo },
  ];
}

export function App() {
  const [ruta, setRuta] = useState<RutaApp>(() => leerRutaHash());
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
  const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
  const [temasAbiertos, setTemasAbiertos] = useState(false);
  const [comandosAbiertos, setComandosAbiertos] = useState(false);

  const [pestanas, setPestanas] = useState<PestanaCodigo[]>(() => leerPestanasIniciales());
  const [pestanaActivaId, setPestanaActivaId] = useState<string>(() => leerPestanasIniciales()[0].id);
  const [misionesCompletadas, setMisionesCompletadas] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.misiones);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [misionActiva, setMisionActiva] = useState<MisionEdu | null>(null);

  const [modoMotor, setModoMotor] = useState<'navegador' | 'api'>('navegador');
  const [urlApi, setUrlApi] = useState('http://127.0.0.1:8000');
  const [velocidadMs, setVelocidadMs] = useState(180);

  const temaMeta = obtenerTema(tema);

  // Scroll suave con Lenis (se desactiva automáticamente si el usuario pide movimiento reducido)
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (movimientoReducido || prefersReduced) return;

    const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [movimientoReducido]);

  // Atajo global Ctrl+K / Cmd+K para abrir la paleta de comandos
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

  useEffect(() => {
    const onHash = () => setRuta(leerRutaHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navegar = (destino: RutaApp) => {
    setRuta(destino);
    window.location.hash = `#${destino}`;
    window.scrollTo({ top: 0, behavior: movimientoReducido ? 'auto' : 'smooth' });
  };

  const abrirEnEstudio = (codigo?: string, titulo?: string) => {
    if (codigo !== undefined) {
      const id = `tab-${Date.now()}`;
      const nombre = titulo ?? `programa_${pestanas.length + 1}.edu`;
      setPestanas((prev) => [...prev, { id, nombre, codigo }]);
      setPestanaActivaId(id);
    }
    navegar('estudio');
  };

  const iniciarMision = (mision: MisionEdu) => {
    setMisionActiva(mision);
    const id = `mision-${mision.id}`;
    setPestanas((prev) => {
      const existe = prev.find((p) => p.id === id);
      if (existe) return prev;
      return [...prev, { id, nombre: `${mision.id}.edu`, codigo: mision.codigoInicial }];
    });
    setPestanaActivaId(id);
    navegar('estudio');
  };

  return (
    <MotionConfig reducedMotion={movimientoReducido ? 'always' : 'user'}>
    <div className="app-shell">
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido principal
      </a>

      <header className="topbar">
        <div className="topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="brand-btn"
              onClick={() => navegar('inicio')}
              title="Ir a inicio"
            >
              <ChispaLogo />
              <span className="sr-only"> — Ir a inicio</span>
            </button>

            <a
              href="https://github.com/topional/code-compiler"
              target="_blank"
              rel="noreferrer"
              className="repo-context-pill"
              title="Repositorio base: topional/code-compiler"
            >
              <span>code-compiler</span>
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>

          <nav className="nav-pills" aria-label="Navegación principal">
            <button
              type="button"
              className="nav-pill"
              aria-current={ruta === 'inicio' ? 'page' : undefined}
              onClick={() => navegar('inicio')}
            >
              <Home size={16} aria-hidden="true" /> Inicio
            </button>
            <button
              type="button"
              className="nav-pill"
              aria-current={ruta === 'estudio' ? 'page' : undefined}
              onClick={() => navegar('estudio')}
            >
              <Code2 size={16} aria-hidden="true" /> Estudio
            </button>
            <button
              type="button"
              className="nav-pill"
              aria-current={ruta === 'misiones' ? 'page' : undefined}
              onClick={() => navegar('misiones')}
            >
              <Trophy size={16} aria-hidden="true" /> Misiones
              <span className="nav-badge">
                {misionesCompletadas.length}/{MISIONES_EDU.length}
              </span>
            </button>
            <button
              type="button"
              className="nav-pill"
              aria-current={ruta === 'guia' ? 'page' : undefined}
              onClick={() => navegar('guia')}
            >
              <BookOpen size={16} aria-hidden="true" /> Guía
            </button>
          </nav>

          <div className="topbar-tools">
            <button
              type="button"
              className="btn btn-sm cmd-trigger-btn"
              onClick={() => setComandosAbiertos(true)}
              title="Buscar comandos, temas o ejemplos (Ctrl + K)"
            >
              <Search size={15} aria-hidden="true" />
              <span className="cmd-label">Buscar</span>
              <kbd className="kbd-pill hide-mobile" aria-hidden="true">Ctrl K</kbd>
            </button>

            <button
              type="button"
              className="btn btn-sm theme-trigger-btn"
              onClick={() => setTemasAbiertos(true)}
              title={`Tema: ${temaMeta.nombre} (10 temas disponibles)`}
            >
              <span className="theme-swatches mini" aria-hidden="true">
                {temaMeta.muestras.slice(0, 3).map((hex, i) => (
                  <span key={i} className="swatch-dot" style={{ backgroundColor: hex }} />
                ))}
              </span>
              <span className="sr-only">Cambiar tema: </span>
              <span className="hide-tablet">{temaMeta.nombre}</span>
              <span className="sr-only"> (10 temas)</span>
            </button>

            <button
              type="button"
              className="btn btn-icon"
              onClick={() => setAjustesAbiertos(true)}
              aria-label="Abrir ajustes de accesibilidad y motor"
              title="Ajustes"
            >
              <SlidersHorizontal size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="contenido-principal" className="app-main">
        {ruta === 'inicio' && (
          <HeroLanding
            onAbrirEstudio={abrirEnEstudio}
            onIrMisiones={() => navegar('misiones')}
            onIrGuia={() => navegar('guia')}
            misionesCompletadas={misionesCompletadas.length}
            totalMisiones={MISIONES_EDU.length}
            temaActual={tema}
            onCambiarTema={setTema}
          />
        )}

        {ruta === 'estudio' && (
          <StudioView
            pestanas={pestanas}
            pestanaActivaId={pestanaActivaId}
            onCambiarPestana={setPestanaActivaId}
            onActualizarCodigo={(id, codigo) =>
              setPestanas((prev) => prev.map((p) => (p.id === id ? { ...p, codigo } : p)))
            }
            onNuevaPestana={(nombre, codigo) => {
              const id = `tab-${Date.now()}`;
              setPestanas((prev) => [
                ...prev,
                {
                  id,
                  nombre: nombre ?? `nuevo_${prev.length + 1}.edu`,
                  codigo: codigo ?? '# Escribe aquí tu programa .edu\nmostrar "¡Hola!"\n',
                },
              ]);
              setPestanaActivaId(id);
            }}
            onCerrarPestana={(id) => {
              setPestanas((prev) => {
                const rest = prev.filter((p) => p.id !== id);
                if (rest.length === 0) return prev;
                if (pestanaActivaId === id) {
                  setPestanaActivaId(rest[0].id);
                }
                return rest;
              });
            }}
            misionActiva={misionActiva}
            onSalirMision={() => setMisionActiva(null)}
            onCompletarMision={(id) =>
              setMisionesCompletadas((prev) => (prev.includes(id) ? prev : [...prev, id]))
            }
            modoMotor={modoMotor}
            urlApi={urlApi}
            velocidadMs={velocidadMs}
            onCambiarVelocidad={setVelocidadMs}
            movimientoReducido={movimientoReducido}
          />
        )}

        {ruta === 'misiones' && (
          <MissionsView
            completadas={misionesCompletadas}
            onIniciarMision={iniciarMision}
          />
        )}

        {ruta === 'guia' && (
          <GuideView
            onProbarEnEstudio={(codigo, titulo) => {
              setMisionActiva(null);
              abrirEnEstudio(codigo, titulo);
            }}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>
            <strong>Chispa .edu · Code Compiler</strong> — Compilador e intérprete educativo en
            español (100 % GitHub Pages + backend Python ANTLR4).
          </span>
          <span className="mono">10 Temas · Contrato IR v1 · WCAG AAA</span>
        </div>
      </footer>

      <ThemePickerDialog
        open={temasAbiertos}
        onClose={() => setTemasAbiertos(false)}
        temaActual={tema}
        onSeleccionarTema={setTema}
      />

      <CommandPalette
        open={comandosAbiertos}
        onClose={() => setComandosAbiertos(false)}
        onNavegar={navegar}
        onCambiarTema={setTema}
        onAbrirEjemplo={(codigo, nombre) => {
          setMisionActiva(null);
          abrirEnEstudio(codigo, nombre);
        }}
        onIniciarMision={iniciarMision}
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
    </div>
    </MotionConfig>
  );
}
