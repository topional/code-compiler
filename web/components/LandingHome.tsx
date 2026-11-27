import { useAutoAnimate } from '@formkit/auto-animate/react';
import Lenis from 'lenis';
import { motion, useReducedMotion } from 'motion/react';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Code2,
  Cpu,
  Palette,
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  Trophy,
  Zap,
} from 'lucide-react';

import { EJEMPLOS_EDU, type EjemploEdu } from '../data/ejemplos';
import { MISIONES_EDU, type MisionEdu } from '../data/misiones';
import { obtenerTema, TEMAS_CATALOGO, type TemaId } from '../data/temas';
import { compilarEdu } from '../engine/compilador';
import { ejecutarIntermedio } from '../engine/interprete';
import type { VariableMemoria } from '../engine/types';
import {
  AnimatedNumber,
  RotatingPixelWord,
  ScrambleText,
  SplitRevealText,
  SpotlightCard,
  TypewriterCycle,
} from './MotionPrimitives';
import {
  HeroPixelBackdrop,
  PixelChispaCrt,
  PixelSparkCoin,
  QuestCardPixelBanner,
  type EscenaTarjeta,
} from './PixelScenes';

interface LandingHomeProps {
  tema: TemaId;
  onSeleccionarTema: (tema: TemaId) => void;
  onAbrirGaleriaTemas: () => void;
  misionesCompletadas: string[];
  onEntrarIde: () => void;
  onEntrarConCodigo: (nombre: string, codigo: string) => void;
  onEntrarConMision: (mision: MisionEdu) => void;
  onEntrarConRayosX: () => void;
}

type ModoDemo = 'aprender' | 'practicar' | 'rayosx';
type FiltroCatalogo = 'todos' | 'misiones' | 'ejemplos';

const PALABRAS_HERO = ['Código .edu', 'Bloques Scratch', 'Misiones XP', 'Rayos X'];

const FRASES_TYPEWRITER = [
  'Escribe código en español y compílalo en menos de 2 ms...',
  'Arrastra bloques tipo Scratch y descubre cómo se escriben en texto...',
  'Completa las 6 misiones con XP y descarga tu diploma SVG...',
  'Inspecciona Tokens, Árbol sintáctico, Símbolos e IR v1 en vivo...',
];

const SALUDOS_CHISPA = [
  '¡Listo para compilar!',
  '¡Toca Empezar y entramos al IDE!',
  '¡Cada línea responde al instante!',
  '¡Caza los 7 bugs en la Misión 6!',
];

const SNIPPETS_DEMO: Record<ModoDemo, { archivo: string; descripcion: string; codigo: string }> = {
  aprender: {
    archivo: 'hola_chispa.edu',
    descripcion: 'Edita el nombre o el número del dado y mira la respuesta al instante.',
    codigo: `# Tu primera aventura en español (.edu)
crear variable heroe
asignar heroe valor de "Sofía"
crear variable dado
asignar dado valor de numero aleatorio entre 1 y 6

mostrar "¡Bienvenida al laboratorio!"
mostrar heroe
mostrar dado

si dado es mayor o igual que 4 entonces
    mostrar "¡Tirada crítica! +100 XP"
sino
    mostrar "¡Buen intento! Lanza otra vez"
fin`,
  },
  practicar: {
    archivo: 'cohete_ciclo.edu',
    descripcion: 'Prueba cambiar el número de repeticiones o el texto final.',
    codigo: `# Cuenta regresiva con ciclos y funciones
definir doble(numero x) devuelve numero
    devolver x * 2
fin

crear variable cuenta
asignar cuenta valor de 3

repetir 3 veces
    mostrar cuenta
    asignar cuenta valor de cuenta - 1
fin

mostrar "¡Despegue! Energía:"
mostrar doble(50)`,
  },
  rayosx: {
    archivo: 'rayos_x.edu',
    descripcion: 'Inspecciona los tokens léxicos y la representación intermedia IR v1 reales.',
    codigo: `# El compilador analiza cada palabra clave
crear variable puntos
asignar puntos valor de 40 + 60

si puntos es igual a 100 entonces
    mostrar "Nivel completado"
fin`,
  },
};

const ESCENA_POR_MISION: Record<string, EscenaTarjeta> = {
  'm1-saludo': 'variables',
  'm2-decision': 'puente',
  'm3-cohete': 'cohete',
  'm4-dado': 'dado',
  'm5-funcion': 'fabrica',
  'm6-cazabugs': 'detective',
};

const ESCENA_POR_EJEMPLO: Record<string, EscenaTarjeta> = {
  basico: 'variables',
  principal: 'juego',
  piedra_papel_tijera: 'juego',
  calculadora: 'calculadora',
  avanzado: 'recursion',
  con_errores: 'detective',
};

interface SalidaDemo {
  id: string;
  linea: number | null;
  texto: string;
}

export const LandingHome: React.FC<LandingHomeProps> = ({
  tema,
  onSeleccionarTema,
  onAbrirGaleriaTemas,
  misionesCompletadas,
  onEntrarIde,
  onEntrarConCodigo,
  onEntrarConMision,
  onEntrarConRayosX,
}) => {
  const reducedMotion = useReducedMotion();
  const [modoDemo, setModoDemo] = useState<ModoDemo>('aprender');
  const [codigoDemo, setCodigoDemo] = useState<string>(SNIPPETS_DEMO.aprender.codigo);
  const [salidasDemo, setSalidasDemo] = useState<SalidaDemo[]>([]);
  const [varsDemo, setVarsDemo] = useState<VariableMemoria[]>([]);
  const [tiempoDemoMs, setTiempoDemoMs] = useState<number>(0);
  const [filtroCatalogo, setFiltroCatalogo] = useState<FiltroCatalogo>('todos');
  const [runSeq, setRunSeq] = useState(0);
  const [saludoIdx, setSaludoIdx] = useState(0);

  // @formkit/auto-animate (de awesome-design-stack) para listas y grillas dinámicas
  const [outputListRef] = useAutoAnimate<HTMLDivElement>({ duration: 220 });
  const [memListRef] = useAutoAnimate<HTMLDivElement>({ duration: 200 });
  const [questGridRef] = useAutoAnimate<HTMLDivElement>({ duration: 260 });

  // Lenis smooth scroll (de awesome-design-stack), desactivado si hay movimiento reducido
  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
    });
    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);
    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reducedMotion]);

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

    const salidasLocales: SalidaDemo[] = [];
    let ultimasVars: VariableMemoria[] = [];

    void ejecutarIntermedio(compilacionDemo.intermedio, {
      onEvento: (ev) => {
        if (ev.tipo === 'salida') {
          salidasLocales.push({
            id: `${runSeq}-${salidasLocales.length}-${ev.linea ?? 0}`,
            linea: ev.linea ?? null,
            texto: ev.texto,
          });
        } else if (ev.tipo === 'paso') {
          ultimasVars = ev.estado.variables;
        }
      },
      leerEntrada: async () => '1',
      maxPasos: 4000,
    }).then(() => {
      if (cancelado) return;
      setSalidasDemo(salidasLocales);
      setVarsDemo(ultimasVars);
      setTiempoDemoMs(performance.now() - t0);
    });

    return () => {
      cancelado = true;
    };
  }, [compilacionDemo, runSeq]);

  const cambiarModoDemo = (nuevo: ModoDemo) => {
    setModoDemo(nuevo);
    setCodigoDemo(SNIPPETS_DEMO[nuevo].codigo);
  };

  const xpGanado = misionesCompletadas.length * 150;
  const xpTotal = MISIONES_EDU.length * 150;
  const porcentajeXp = Math.round((xpGanado / xpTotal) * 100);

  const ejemplosMostrar: EjemploEdu[] = EJEMPLOS_EDU.slice(0, 6);

  return (
    <div className="lp-root">
      {/* NAVBAR PRINCIPAL */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#inicio-top" className="lp-brand" aria-label="Code Compiler Chispa .edu, Inicio">
            <motion.span
              whileHover={reducedMotion ? undefined : { rotate: [-8, 10, 0], scale: 1.12 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'inline-flex' }}
            >
              <PixelSparkCoin size={28} />
            </motion.span>
            <span className="lp-brand-text">
              <span className="lp-brand-title">Code Compiler</span>
              <span className="lp-brand-badge">.edu</span>
            </span>
          </a>

          <nav className="lp-nav-links" aria-label="Secciones de inicio">
            <a href="#probar" className="lp-nav-link">
              Probar código
            </a>
            <a href="#aventura" className="lp-nav-link">
              Misiones XP
            </a>
            <a href="#compilador" className="lp-nav-link">
              Compilador
            </a>
            <a href="#temas" className="lp-nav-link">
              10 Temas
            </a>
          </nav>

          <div className="lp-nav-actions">
            <motion.button
              type="button"
              className="lp-theme-trigger"
              whileHover={reducedMotion ? undefined : { scale: 1.03 }}
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              onClick={onAbrirGaleriaTemas}
              aria-label={`Cambiar tema visual. Actual: ${temaMeta.nombre}`}
              title="Cambiar tema (10 disponibles)"
            >
              <Palette size={15} aria-hidden="true" />
              <span className="lp-theme-trigger-label">{temaMeta.nombre}</span>
            </motion.button>

            <motion.button
              type="button"
              className="btn-pixel btn-pixel-gold btn-pixel-sm btn-pixel-sheen"
              whileHover={reducedMotion ? undefined : { scale: 1.04 }}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              onClick={onEntrarIde}
            >
              <span>Empezar</span>
              <ArrowRight size={15} aria-hidden="true" />
            </motion.button>
          </div>
        </div>
      </header>

      <main id="inicio-top">
        {/* HERO 16-BIT PIXEL-ART CON ANIMACIONES DE TEXTO EN VIVO */}
        <section className="lp-hero" aria-label="Portada de Code Compiler Chispa .edu">
          <HeroPixelBackdrop />
          <div className="lp-hero-scrim" aria-hidden="true" />

          <div className="lp-hero-inner">
            <motion.button
              type="button"
              className="lp-mascot-btn"
              onClick={() => setSaludoIdx((i) => (i + 1) % SALUDOS_CHISPA.length)}
              whileHover={reducedMotion ? undefined : { scale: 1.1, rotate: [-3, 3, 0] }}
              whileTap={reducedMotion ? undefined : { scale: 0.92, y: 4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              aria-label={`Chispa dice: ${SALUDOS_CHISPA[saludoIdx]}. Toca para cambiar mensaje`}
              title="¡Toca a Chispa!"
            >
              <PixelChispaCrt size={92} />
              <motion.span
                key={saludoIdx}
                className="lp-mascot-speech"
                initial={reducedMotion ? false : { opacity: 0, y: 6, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              >
                {SALUDOS_CHISPA[saludoIdx]}
              </motion.span>
            </motion.button>

            <span className="lp-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              <ScrambleText texto="Comienza tu" />
            </span>

            <h1 className="lp-hero-title">
              <span>Aventura en </span>
              <RotatingPixelWord
                palabras={PALABRAS_HERO}
                intervaloMs={2700}
                className="lp-hero-title-accent"
              />
            </h1>

            <p className="lp-hero-typewriter-bar">
              <TypewriterCycle frases={FRASES_TYPEWRITER} />
            </p>

            <div className="lp-hero-ctas">
              <motion.button
                type="button"
                className="btn-pixel btn-pixel-gold btn-pixel-sheen"
                whileHover={reducedMotion ? undefined : { scale: 1.04, y: -2 }}
                whileTap={reducedMotion ? undefined : { scale: 0.96, y: 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                onClick={onEntrarIde}
              >
                <Play size={16} aria-hidden="true" />
                <span>Empezar a programar</span>
              </motion.button>

              <motion.a
                href="#probar"
                className="btn-pixel btn-pixel-ghost"
                whileHover={reducedMotion ? undefined : { scale: 1.03, y: -2 }}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
              >
                <Terminal size={16} aria-hidden="true" />
                <span>Probar aquí primero</span>
              </motion.a>
            </div>

            <div className="lp-hero-facts" aria-label="Características principales">
              {[
                '⚡ Compilador nativo < 2 ms',
                '🧩 Bloques Scratch → .edu',
                '🏆 6 Misiones con XP',
                '🎨 10 Temas accesibles',
              ].map((fact, idx) => (
                <motion.span
                  key={fact}
                  className="lp-fact-chip"
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * idx, duration: 0.3 }}
                  whileHover={reducedMotion ? undefined : { y: -2, scale: 1.03 }}
                >
                  {fact}
                </motion.span>
              ))}
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: MINI-PLAYGROUND VIVO (CODÉDEX 3 TABS × GOJS LIVE RUNNER) */}
        <section id="probar" className="lp-section" aria-labelledby="demo-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">
              <ScrambleText texto="// prueba instantánea en vivo" />
            </span>
            <h2 id="demo-heading" className="lp-h2">
              <SplitRevealText texto="Escribe en español. Mira la respuesta." />
              <span className="lp-cursor-block" aria-hidden="true" />
            </h2>
            <p className="lp-lead">{SNIPPETS_DEMO[modoDemo].descripcion}</p>
          </div>

          <div className="lp-demo-tabs" role="tablist" aria-label="Modos de prueba rápida">
            {(
              [
                { id: 'aprender', label: '1. Aprender', icon: Sparkles },
                { id: 'practicar', label: '2. Practicar', icon: Code2 },
                { id: 'rayosx', label: '3. Rayos X', icon: Cpu },
              ] as const
            ).map((tab) => {
              const Icono = tab.icon;
              const activo = modoDemo === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  className="lp-demo-tab"
                  onClick={() => cambiarModoDemo(tab.id)}
                >
                  {activo && (
                    <motion.span
                      layoutId="lp-demo-tab-bg"
                      className="lp-tab-pill-bg"
                      transition={{ type: 'spring', stiffness: 460, damping: 32 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="lp-tab-pill-content">
                    <Icono size={15} aria-hidden="true" />
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <motion.div
            className="lp-demo-frame lp-beam-frame"
            initial={reducedMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="lp-demo-window">
              <div className="lp-demo-bar">
                <div className="lp-demo-file">
                  <span className="lp-dots" aria-hidden="true">
                    <span className="lp-dot" style={{ background: '#f87171' }} />
                    <span className="lp-dot" style={{ background: '#facc15' }} />
                    <span className="lp-dot" style={{ background: '#4ade80' }} />
                  </span>
                  <span>{SNIPPETS_DEMO[modoDemo].archivo}</span>
                </div>

                <div className="lp-demo-actions">
                  <motion.button
                    type="button"
                    className="btn-pixel btn-pixel-surface btn-pixel-sm"
                    whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                    onClick={() => setRunSeq((n) => n + 1)}
                  >
                    <Play size={13} aria-hidden="true" />
                    <span>Ejecutar</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    className="btn-pixel btn-pixel-surface btn-pixel-sm"
                    whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                    onClick={() => setCodigoDemo(SNIPPETS_DEMO[modoDemo].codigo)}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    <span>Reiniciar</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    className="btn-pixel btn-pixel-gold btn-pixel-sm btn-pixel-sheen"
                    whileHover={reducedMotion ? undefined : { scale: 1.03 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                    onClick={() => onEntrarConCodigo(SNIPPETS_DEMO[modoDemo].archivo, codigoDemo)}
                  >
                    <span>Abrir en el IDE completo</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </motion.button>
                </div>
              </div>

              <div className="lp-demo-grid">
                <div className="lp-demo-editor-wrap">
                  <div className="lp-demo-subbar">
                    <label htmlFor="lp-mini-editor">Editor interactivo .edu</label>
                    <span>{compilacionDemo.tokens.length} tokens</span>
                  </div>
                  <textarea
                    id="lp-mini-editor"
                    className="lp-demo-textarea"
                    value={codigoDemo}
                    onChange={(e) => setCodigoDemo(e.target.value)}
                    spellCheck={false}
                    aria-label="Editor interactivo .edu"
                  />
                </div>

                <div className="lp-demo-output-wrap">
                  <div className="lp-demo-subbar">
                    <span>
                      {modoDemo === 'rayosx' ? 'Rayos X · Tokens léxicos' : 'Salida en vivo'}
                    </span>
                    <span
                      style={{
                        color: compilacionDemo.diagnosticos.length ? 'var(--err)' : 'var(--ok)',
                      }}
                    >
                      {compilacionDemo.diagnosticos.length
                        ? `${compilacionDemo.diagnosticos.length} aviso(s)`
                        : `✓ ${tiempoDemoMs.toFixed(1)} ms`}
                    </span>
                  </div>

                  <div
                    ref={outputListRef}
                    className="lp-demo-output-body"
                    tabIndex={0}
                    aria-label="Resultado del mini compilador"
                  >
                    {compilacionDemo.diagnosticos.length > 0 ? (
                      compilacionDemo.diagnosticos.map((d, i) => (
                        <div
                          key={`err-${i}-${d.linea ?? 0}`}
                          className="lp-out-row"
                          style={{ borderLeftColor: 'var(--err)' }}
                        >
                          <span className="lp-out-ln">L{d.linea ?? '?'}</span>
                          <span className="lp-out-val">
                            [{d.etapa}] {d.mensaje}
                          </span>
                        </div>
                      ))
                    ) : modoDemo === 'rayosx' ? (
                      <table className="lp-token-table">
                        <thead>
                          <tr>
                            <th>Línea</th>
                            <th>Token</th>
                            <th>Lexema</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compilacionDemo.tokens.slice(0, 14).map((t, idx) => (
                            <tr key={`${t.linea}-${t.columna}-${idx}`}>
                              <td>L{t.linea}</td>
                              <td style={{ color: 'var(--accent-soft-ink)' }}>{t.tipo}</td>
                              <td>{t.texto}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      salidasDemo.map((s) => (
                        <div key={s.id} className="lp-out-row">
                          <span className="lp-out-ln">L{s.linea ?? '·'}</span>
                          <span className="lp-out-val">{s.texto}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div ref={memListRef} className="lp-demo-mem">
                    <span className="mono" style={{ color: 'var(--ink-muted)' }}>
                      Memoria:
                    </span>
                    {varsDemo.length === 0 ? (
                      <span style={{ color: 'var(--ink-muted)' }}>sin variables</span>
                    ) : (
                      varsDemo.map((v) => (
                        <span key={v.idInterno} className="mem-chip">
                          <span className="mem-chip-name">{v.nombre}</span>
                          <span>=</span>
                          <span className="mem-chip-val">{v.valor}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECCIÓN 3: BANDA MANIFIESTO ESTILO GOJS */}
        <section className="lp-manifesto" aria-label="Principios de Code Compiler Chispa .edu">
          <div className="lp-manifesto-inner">
            {[
              {
                titulo: 'Sin registros ni muros.',
                texto: 'Pulsa Empezar y escribe código .edu en menos de un segundo.',
              },
              {
                titulo: 'Compilador real en el navegador.',
                texto: 'Léxico, parser, semántico, IR v1 e intérprete con aritmética exacta.',
              },
              {
                titulo: 'De bloques Scratch a texto.',
                texto: 'Inserta estructuras con un clic y entiende cada error en español claro.',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.titulo}
                className="lp-manifesto-item"
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: idx * 0.08, duration: 0.32 }}
              >
                <strong>{item.titulo}</strong>
                <span>{item.texto}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* SECCIÓN 4: MAPA DE MISIONES XP Y PROYECTOS (ESTILO CODÉDEX) */}
        <section id="aventura" className="lp-section" aria-labelledby="aventura-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">
              <ScrambleText texto="// mapa de aventuras" />
            </span>
            <h2 id="aventura-heading" className="lp-h2">
              <SplitRevealText texto="Misiones guiadas con XP y proyectos reales" />
            </h2>
            <p className="lp-lead">
              Elige un reto o un programa oficial de <code>examples/</code> para abrirlo directamente
              en el IDE completo con verificación automática.
            </p>
          </div>

          <motion.div
            className="lp-xp-bar-card"
            role="region"
            aria-label="Tu progreso de experiencia"
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.32 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <div>
                <strong style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.05rem' }}>
                  Progreso de aventura: <AnimatedNumber valor={xpGanado} /> / {xpTotal} XP
                </strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  {misionesCompletadas.length} de {MISIONES_EDU.length} misiones completadas en este
                  navegador
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
              <motion.div
                className="lp-xp-fill"
                initial={{ width: 0 }}
                whileInView={{ width: `${porcentajeXp}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="mono" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
              <AnimatedNumber valor={porcentajeXp} sufijo="%" />
            </span>
          </motion.div>

          <div className="lp-filter-row" role="group" aria-label="Filtrar tarjetas de aventura">
            {(
              [
                { id: 'todos', label: `Todo (${MISIONES_EDU.length + ejemplosMostrar.length})` },
                { id: 'misiones', label: `Misiones XP (${MISIONES_EDU.length})` },
                { id: 'ejemplos', label: `Proyectos oficiales (${ejemplosMostrar.length})` },
              ] as const
            ).map((f) => {
              const activo = filtroCatalogo === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className="lp-filter-pill"
                  aria-pressed={activo}
                  onClick={() => setFiltroCatalogo(f.id)}
                >
                  {activo && (
                    <motion.span
                      layoutId="lp-filter-pill-bg"
                      className="lp-filter-pill-bg"
                      transition={{ type: 'spring', stiffness: 480, damping: 32 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="lp-tab-pill-content">{f.label}</span>
                </button>
              );
            })}
          </div>

          <div ref={questGridRef} className="lp-quest-grid">
            {(filtroCatalogo === 'todos' || filtroCatalogo === 'misiones') &&
              MISIONES_EDU.map((m, idx) => {
                const completada = misionesCompletadas.includes(m.id);
                return (
                  <SpotlightCard
                    key={m.id}
                    delay={idx * 0.04}
                    className={`lp-quest-card ${completada ? 'is-done' : ''}`}
                  >
                    <div className="lp-quest-banner">
                      <QuestCardPixelBanner escena={ESCENA_POR_MISION[m.id] ?? 'variables'} />
                      {completada && <span className="lp-quest-done-pill">✓ LISTO</span>}
                      <span className="lp-quest-xp">+150 XP</span>
                    </div>
                    <div className="lp-quest-body">
                      <span className="lp-quest-meta">{m.etiquetaNivel}</span>
                      <h3 className="lp-quest-title">{m.titulo}</h3>
                      <p className="lp-quest-desc">{m.historia}</p>
                      <div className="lp-quest-foot">
                        <span
                          className="mono"
                          style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}
                        >
                          🏅 {m.insignia}
                        </span>
                        <motion.button
                          type="button"
                          className="btn-pixel btn-pixel-surface btn-pixel-sm"
                          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                          onClick={() => onEntrarConMision(m)}
                        >
                          <span>{completada ? 'Repetir' : 'Jugar'}</span>
                          <ArrowRight size={13} aria-hidden="true" />
                        </motion.button>
                      </div>
                    </div>
                  </SpotlightCard>
                );
              })}

            {(filtroCatalogo === 'todos' || filtroCatalogo === 'ejemplos') &&
              ejemplosMostrar.map((ej, idx) => (
                <SpotlightCard key={ej.id} delay={idx * 0.04} className="lp-quest-card">
                  <div className="lp-quest-banner">
                    <QuestCardPixelBanner escena={ESCENA_POR_EJEMPLO[ej.id] ?? 'juego'} />
                    <span className="lp-quest-xp">{ej.nivel}</span>
                  </div>
                  <div className="lp-quest-body">
                    <span className="lp-quest-meta">{ej.archivo}</span>
                    <h3 className="lp-quest-title">{ej.titulo}</h3>
                    <p className="lp-quest-desc">{ej.subtitulo}</p>
                    <div className="lp-quest-foot">
                      <span
                        className="mono"
                        style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}
                      >
                        {ej.etiquetas.slice(0, 2).join(' · ')}
                      </span>
                      <motion.button
                        type="button"
                        className="btn-pixel btn-pixel-surface btn-pixel-sm"
                        whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                        onClick={() =>
                          onEntrarConCodigo(ej.archivo.replace(/^examples\//, ''), ej.codigo)
                        }
                      >
                        <span>Abrir</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </motion.button>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
          </div>
        </section>

        {/* SECCIÓN 5: ARQUITECTURA DEL COMPILADOR EN 4 FASES */}
        <section id="compilador" className="lp-section" aria-labelledby="compilador-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">
              <ScrambleText texto="// rayos x del lenguaje .edu" />
            </span>
            <h2 id="compilador-heading" className="lp-h2">
              <SplitRevealText texto="Mira qué ocurre dentro del compilador" />
            </h2>
            <p className="lp-lead">
              Cada vez que escribes en el IDE puedes abrir el panel de Rayos X y recorrer las cuatro
              etapas reales del proyecto académico <code>topional/code-compiler</code>.
            </p>
          </div>

          <div className="lp-pipeline-grid">
            {[
              {
                num: '01 // LEXER',
                titulo: 'Tokens en español',
                desc: 'Reconoce frases naturales como crear variable, es mayor o igual que y numero aleatorio entre.',
              },
              {
                num: '02 // PARSER',
                titulo: 'Árbol sintáctico',
                desc: 'Verifica bloques si ... fin, ciclos y funciones construyendo un árbol inspeccionable línea por línea.',
              },
              {
                num: '03 // SEMÁNTICO',
                titulo: 'Tipos y pistas claras',
                desc: 'Comprueba variables, tipos (numero, texto, logico) y explica cada error con consejos pedagógicos.',
              },
              {
                num: '04 // IR v1 & RUNTIME',
                titulo: 'Ejecución paso a paso',
                desc: 'Genera el JSON intermedio v1 compatible con el backend Python y ejecuta con aritmética racional exacta.',
              },
            ].map((st, idx) => (
              <SpotlightCard key={st.num} delay={idx * 0.06} className="lp-stage-card">
                <span className="lp-stage-num">
                  <ScrambleText texto={st.num} />
                </span>
                <h3>{st.titulo}</h3>
                <p>{st.desc}</p>
              </SpotlightCard>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <motion.button
              type="button"
              className="btn-pixel btn-pixel-surface"
              whileHover={reducedMotion ? undefined : { scale: 1.03, y: -2 }}
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              onClick={onEntrarConRayosX}
            >
              <Cpu size={16} aria-hidden="true" />
              <span>Abrir Rayos X en el IDE</span>
              <ArrowRight size={15} aria-hidden="true" />
            </motion.button>
          </div>
        </section>

        {/* SECCIÓN 6: GALERÍA RÁPIDA DE 10 TEMAS + CTA FINAL */}
        <section id="temas" className="lp-section" aria-labelledby="temas-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">
              <ScrambleText texto="// personaliza tu estudio" />
            </span>
            <h2 id="temas-heading" className="lp-h2">
              <SplitRevealText texto="10 temas verificados listos al instante" />
            </h2>
            <p className="lp-lead">
              Cambia entre temas oscuros, luminosos, arcade retro y Alto Contraste AAA (21:1). Tu
              elección se mantiene al entrar al IDE.
            </p>
          </div>

          <div className="lp-themes-grid" role="group" aria-label="Selector rápido de temas">
            {TEMAS_CATALOGO.map((t) => (
              <motion.button
                key={t.id}
                type="button"
                className="lp-theme-chip"
                aria-pressed={tema === t.id}
                whileHover={reducedMotion ? undefined : { y: -2, scale: 1.03 }}
                whileTap={reducedMotion ? undefined : { scale: 0.96 }}
                onClick={() => onSeleccionarTema(t.id)}
              >
                <span className="lp-swatches" aria-hidden="true">
                  {t.muestras.map((hex, i) => (
                    <span key={i} className="lp-swatch" style={{ backgroundColor: hex }} />
                  ))}
                </span>
                <span>{t.nombre}</span>
              </motion.button>
            ))}
          </div>

          <motion.div
            className="lp-closing-card"
            initial={reducedMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.span
              animate={reducedMotion ? undefined : { y: [0, -5, 0] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-flex' }}
            >
              <PixelSparkCoin size={36} />
            </motion.span>
            <h2 className="lp-h2">
              <SplitRevealText texto="¿Listo para tu primer programa en .edu?" />
            </h2>
            <p className="lp-lead">
              Entra al entorno completo con bloques Scratch, depuración paso a paso, Rayos X y
              exportación de archivos <code>.edu</code> e <code>.ir.json</code>.
            </p>
            <motion.button
              type="button"
              className="btn-pixel btn-pixel-gold btn-pixel-sheen"
              whileHover={reducedMotion ? undefined : { scale: 1.05, y: -2 }}
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              onClick={onEntrarIde}
            >
              <Zap size={16} aria-hidden="true" />
              <span>Empezar a programar ahora</span>
              <ArrowRight size={16} aria-hidden="true" />
            </motion.button>
          </motion.div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PixelSparkCoin size={18} />
            <strong>Code Compiler · Chispa .edu</strong> — Hecho con TypeScript, React, Motion,
            Lenis y Auto-Animate.
          </span>
          <div className="lp-footer-links">
            <button type="button" onClick={onEntrarIde}>
              Abrir IDE
            </button>
            <button type="button" onClick={onEntrarConRayosX}>
              Rayos X
            </button>
            <button type="button" onClick={onAbrirGaleriaTemas}>
              10 Temas
            </button>
            <a
              href="https://github.com/topional/code-compiler"
              target="_blank"
              rel="noreferrer"
            >
              GitHub (topional/code-compiler)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
