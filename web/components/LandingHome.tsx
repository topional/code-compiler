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
  const [modoDemo, setModoDemo] = useState<ModoDemo>('aprender');
  const [codigoDemo, setCodigoDemo] = useState<string>(SNIPPETS_DEMO.aprender.codigo);
  const [salidasDemo, setSalidasDemo] = useState<SalidaDemo[]>([]);
  const [varsDemo, setVarsDemo] = useState<VariableMemoria[]>([]);
  const [tiempoDemoMs, setTiempoDemoMs] = useState<number>(0);
  const [filtroCatalogo, setFiltroCatalogo] = useState<FiltroCatalogo>('todos');
  const [runSeq, setRunSeq] = useState(0);

  const temaMeta = obtenerTema(tema);

  const compilacionDemo = useMemo(() => compilarEdu(codigoDemo, 'intermedio'), [codigoDemo]);

  // Ejecuta el mini-playground automáticamente cuando cambia el código o se pulsa Ejecutar
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
          salidasLocales.push({ linea: ev.linea ?? null, texto: ev.texto });
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
            <PixelSparkCoin size={28} />
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
            <button
              type="button"
              className="lp-theme-trigger"
              onClick={onAbrirGaleriaTemas}
              aria-label={`Cambiar tema visual. Actual: ${temaMeta.nombre}`}
              title="Cambiar tema (10 disponibles)"
            >
              <Palette size={15} aria-hidden="true" />
              <span className="lp-theme-trigger-label">{temaMeta.nombre}</span>
            </button>

            <button
              type="button"
              className="btn-pixel btn-pixel-gold btn-pixel-sm"
              onClick={onEntrarIde}
            >
              <span>Empezar</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main id="inicio-top">
        {/* HERO 16-BIT PIXEL-ART (CODÉDEX) */}
        <section className="lp-hero" aria-label="Portada de Code Compiler Chispa .edu">
          <HeroPixelBackdrop />
          <div className="lp-hero-scrim" aria-hidden="true" />

          <div className="lp-hero-inner">
            <PixelChispaCrt size={92} />

            <span className="lp-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Comienza tu
            </span>

            <h1 className="lp-hero-title">
              Aventura en <span className="lp-hero-title-accent">Código .edu</span>
            </h1>

            <p className="lp-hero-sub">
              Un compilador real en español diseñado como un videojuego educativo: combina bloques
              estilo Scratch, misiones con XP y un entorno IDE instantáneo en tu navegador.
            </p>

            <div className="lp-hero-ctas">
              <button
                type="button"
                className="btn-pixel btn-pixel-gold"
                onClick={onEntrarIde}
              >
                <Play size={16} aria-hidden="true" />
                <span>Empezar a programar</span>
              </button>

              <a href="#probar" className="btn-pixel btn-pixel-ghost">
                <Terminal size={16} aria-hidden="true" />
                <span>Probar aquí primero</span>
              </a>
            </div>

            <div className="lp-hero-facts" aria-label="Características principales">
              <span className="lp-fact-chip">⚡ Compilador nativo &lt; 2 ms</span>
              <span className="lp-fact-chip">🧩 Bloques Scratch → .edu</span>
              <span className="lp-fact-chip">🏆 6 Misiones con XP</span>
              <span className="lp-fact-chip">🎨 10 Temas accesibles</span>
            </div>
          </div>
        </section>

        {/* SECCIÓN 2: MINI-PLAYGROUND VIVO (CODÉDEX 3 TABS × GOJS LIVE RUNNER) */}
        <section id="probar" className="lp-section" aria-labelledby="demo-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">// prueba instantánea en vivo</span>
            <h2 id="demo-heading" className="lp-h2">
              Escribe en español. Mira la respuesta.
              <span className="lp-cursor-block" aria-hidden="true" />
            </h2>
            <p className="lp-lead">{SNIPPETS_DEMO[modoDemo].descripcion}</p>
          </div>

          <div className="lp-demo-tabs" role="tablist" aria-label="Modos de prueba rápida">
            <button
              type="button"
              role="tab"
              aria-selected={modoDemo === 'aprender'}
              className="lp-demo-tab"
              onClick={() => cambiarModoDemo('aprender')}
            >
              <Sparkles size={15} aria-hidden="true" />
              <span>1. Aprender</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modoDemo === 'practicar'}
              className="lp-demo-tab"
              onClick={() => cambiarModoDemo('practicar')}
            >
              <Code2 size={15} aria-hidden="true" />
              <span>2. Practicar</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={modoDemo === 'rayosx'}
              className="lp-demo-tab"
              onClick={() => cambiarModoDemo('rayosx')}
            >
              <Cpu size={15} aria-hidden="true" />
              <span>3. Rayos X</span>
            </button>
          </div>

          <div className="lp-demo-frame">
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
                  <button
                    type="button"
                    className="btn-pixel btn-pixel-surface btn-pixel-sm"
                    onClick={() => setRunSeq((n) => n + 1)}
                  >
                    <Play size={13} aria-hidden="true" />
                    <span>Ejecutar</span>
                  </button>
                  <button
                    type="button"
                    className="btn-pixel btn-pixel-surface btn-pixel-sm"
                    onClick={() => setCodigoDemo(SNIPPETS_DEMO[modoDemo].codigo)}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    <span>Reiniciar</span>
                  </button>
                  <button
                    type="button"
                    className="btn-pixel btn-pixel-gold btn-pixel-sm"
                    onClick={() => onEntrarConCodigo(SNIPPETS_DEMO[modoDemo].archivo, codigoDemo)}
                  >
                    <span>Abrir en el IDE completo</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
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
                    <span style={{ color: compilacionDemo.diagnosticos.length ? 'var(--err)' : 'var(--ok)' }}>
                      {compilacionDemo.diagnosticos.length
                        ? `${compilacionDemo.diagnosticos.length} aviso(s)`
                        : `✓ ${tiempoDemoMs.toFixed(1)} ms`}
                    </span>
                  </div>

                  <div className="lp-demo-output-body" tabIndex={0} aria-label="Resultado del mini compilador">
                    {compilacionDemo.diagnosticos.length > 0 ? (
                      compilacionDemo.diagnosticos.map((d, i) => (
                        <div
                          key={i}
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
                            <tr key={idx}>
                              <td>L{t.linea}</td>
                              <td style={{ color: 'var(--accent-soft-ink)' }}>{t.tipo}</td>
                              <td>{t.texto}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      salidasDemo.map((s, idx) => (
                        <div key={idx} className="lp-out-row">
                          <span className="lp-out-ln">L{s.linea ?? '·'}</span>
                          <span className="lp-out-val">{s.texto}</span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="lp-demo-mem">
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
          </div>
        </section>

        {/* SECCIÓN 3: BANDA MANIFIESTO ESTILO GOJS */}
        <section className="lp-manifesto" aria-label="Principios de Code Compiler Chispa .edu">
          <div className="lp-manifesto-inner">
            <div className="lp-manifesto-item">
              <strong>Sin registros ni muros.</strong>
              <span>Pulsa Empezar y escribe código .edu en menos de un segundo.</span>
            </div>
            <div className="lp-manifesto-item">
              <strong>Compilador real en el navegador.</strong>
              <span>Léxico, parser, semántico, IR v1 e intérprete con aritmética exacta.</span>
            </div>
            <div className="lp-manifesto-item">
              <strong>De bloques Scratch a texto.</strong>
              <span>Inserta estructuras con un clic y entiende cada error en español claro.</span>
            </div>
          </div>
        </section>

        {/* SECCIÓN 4: MAPA DE MISIONES XP Y PROYECTOS (ESTILO CODÉDEX) */}
        <section id="aventura" className="lp-section" aria-labelledby="aventura-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">// mapa de aventuras</span>
            <h2 id="aventura-heading" className="lp-h2">
              Misiones guiadas con XP y proyectos reales
            </h2>
            <p className="lp-lead">
              Elige un reto o un programa oficial de <code>examples/</code> para abrirlo directamente
              en el IDE completo con verificación automática.
            </p>
          </div>

          <div className="lp-xp-bar-card" role="region" aria-label="Tu progreso de experiencia">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Trophy size={20} style={{ color: 'var(--accent)' }} aria-hidden="true" />
              <div>
                <strong style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.05rem' }}>
                  Progreso de aventura: {xpGanado} / {xpTotal} XP
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
              <div className="lp-xp-fill" style={{ width: `${porcentajeXp}%` }} />
            </div>
            <span className="mono" style={{ fontWeight: 700, fontSize: '0.86rem' }}>
              {porcentajeXp}%
            </span>
          </div>

          <div className="lp-filter-row" role="group" aria-label="Filtrar tarjetas de aventura">
            <button
              type="button"
              className="lp-filter-pill"
              aria-pressed={filtroCatalogo === 'todos'}
              onClick={() => setFiltroCatalogo('todos')}
            >
              Todo ({MISIONES_EDU.length + ejemplosMostrar.length})
            </button>
            <button
              type="button"
              className="lp-filter-pill"
              aria-pressed={filtroCatalogo === 'misiones'}
              onClick={() => setFiltroCatalogo('misiones')}
            >
              Misiones XP ({MISIONES_EDU.length})
            </button>
            <button
              type="button"
              className="lp-filter-pill"
              aria-pressed={filtroCatalogo === 'ejemplos'}
              onClick={() => setFiltroCatalogo('ejemplos')}
            >
              Proyectos oficiales ({ejemplosMostrar.length})
            </button>
          </div>

          <div className="lp-quest-grid">
            {(filtroCatalogo === 'todos' || filtroCatalogo === 'misiones') &&
              MISIONES_EDU.map((m) => {
                const completada = misionesCompletadas.includes(m.id);
                return (
                  <article
                    key={m.id}
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
                        <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                          🏅 {m.insignia}
                        </span>
                        <button
                          type="button"
                          className="btn-pixel btn-pixel-surface btn-pixel-sm"
                          onClick={() => onEntrarConMision(m)}
                        >
                          <span>{completada ? 'Repetir' : 'Jugar'}</span>
                          <ArrowRight size={13} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}

            {(filtroCatalogo === 'todos' || filtroCatalogo === 'ejemplos') &&
              ejemplosMostrar.map((ej) => (
                <article key={ej.id} className="lp-quest-card">
                  <div className="lp-quest-banner">
                    <QuestCardPixelBanner escena={ESCENA_POR_EJEMPLO[ej.id] ?? 'juego'} />
                    <span className="lp-quest-xp">{ej.nivel}</span>
                  </div>
                  <div className="lp-quest-body">
                    <span className="lp-quest-meta">{ej.archivo}</span>
                    <h3 className="lp-quest-title">{ej.titulo}</h3>
                    <p className="lp-quest-desc">{ej.subtitulo}</p>
                    <div className="lp-quest-foot">
                      <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                        {ej.etiquetas.slice(0, 2).join(' · ')}
                      </span>
                      <button
                        type="button"
                        className="btn-pixel btn-pixel-surface btn-pixel-sm"
                        onClick={() =>
                          onEntrarConCodigo(ej.archivo.replace(/^examples\//, ''), ej.codigo)
                        }
                      >
                        <span>Abrir</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        </section>

        {/* SECCIÓN 5: ARQUITECTURA DEL COMPILADOR EN 4 FASES */}
        <section id="compilador" className="lp-section" aria-labelledby="compilador-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">// rayos x del lenguaje .edu</span>
            <h2 id="compilador-heading" className="lp-h2">
              Mira qué ocurre dentro del compilador
            </h2>
            <p className="lp-lead">
              Cada vez que escribes en el IDE puedes abrir el panel de Rayos X y recorrer las cuatro
              etapas reales del proyecto académico <code>topional/code-compiler</code>.
            </p>
          </div>

          <div className="lp-pipeline-grid">
            <article className="lp-stage-card">
              <span className="lp-stage-num">01 // LEXER</span>
              <h3>Tokens en español</h3>
              <p>
                Reconoce frases naturales como <code>crear variable</code>,{' '}
                <code>es mayor o igual que</code> y <code>numero aleatorio entre</code>.
              </p>
            </article>
            <article className="lp-stage-card">
              <span className="lp-stage-num">02 // PARSER</span>
              <h3>Árbol sintáctico</h3>
              <p>
                Verifica bloques <code>si ... fin</code>, ciclos y funciones construyendo un árbol
                inspeccionable línea por línea.
              </p>
            </article>
            <article className="lp-stage-card">
              <span className="lp-stage-num">03 // SEMÁNTICO</span>
              <h3>Tipos y pistas claras</h3>
              <p>
                Comprueba variables, tipos (<code>numero</code>, <code>texto</code>,{' '}
                <code>logico</code>) y explica cada error con consejos pedagógicos.
              </p>
            </article>
            <article className="lp-stage-card">
              <span className="lp-stage-num">04 // IR v1 &amp; RUNTIME</span>
              <h3>Ejecución paso a paso</h3>
              <p>
                Genera el JSON intermedio v1 compatible con el backend Python y ejecuta con aritmética
                racional exacta y memoria visible.
              </p>
            </article>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
            <button
              type="button"
              className="btn-pixel btn-pixel-surface"
              onClick={onEntrarConRayosX}
            >
              <Cpu size={16} aria-hidden="true" />
              <span>Abrir Rayos X en el IDE</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>

        {/* SECCIÓN 6: GALERÍA RÁPIDA DE 10 TEMAS + CTA FINAL */}
        <section id="temas" className="lp-section" aria-labelledby="temas-heading">
          <div className="lp-section-head">
            <span className="lp-kicker">// personaliza tu estudio</span>
            <h2 id="temas-heading" className="lp-h2">
              10 temas verificados listos al instante
            </h2>
            <p className="lp-lead">
              Cambia entre temas oscuros, luminosos, arcade retro y Alto Contraste AAA (21:1). Tu
              elección se mantiene al entrar al IDE.
            </p>
          </div>

          <div className="lp-themes-grid" role="group" aria-label="Selector rápido de temas">
            {TEMAS_CATALOGO.map((t) => (
              <button
                key={t.id}
                type="button"
                className="lp-theme-chip"
                aria-pressed={tema === t.id}
                onClick={() => onSeleccionarTema(t.id)}
              >
                <span className="lp-swatches" aria-hidden="true">
                  {t.muestras.map((hex, i) => (
                    <span key={i} className="lp-swatch" style={{ backgroundColor: hex }} />
                  ))}
                </span>
                <span>{t.nombre}</span>
              </button>
            ))}
          </div>

          <div className="lp-closing-card">
            <PixelSparkCoin size={36} />
            <h2 className="lp-h2">¿Listo para tu primer programa en .edu?</h2>
            <p className="lp-lead">
              Entra al entorno completo con bloques Scratch, depuración paso a paso, Rayos X y
              exportación de archivos <code>.edu</code> e <code>.ir.json</code>.
            </p>
            <button
              type="button"
              className="btn-pixel btn-pixel-gold"
              onClick={onEntrarIde}
            >
              <Zap size={16} aria-hidden="true" />
              <span>Empezar a programar ahora</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <PixelSparkCoin size={18} />
            <strong>Code Compiler · Chispa .edu</strong> — Hecho con TypeScript, React, HTML y CSS.
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
