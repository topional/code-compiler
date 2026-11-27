/**
 * Escenario de juegos del IDE.
 * Cada juego es un módulo propio en `./juegos/` con su personaje, su mundo y su
 * lógica. Este componente solo elige el juego activo, le pasa lo que imprime el
 * programa y lo que responde el jugador, y dibuja a 60 fps en un canvas.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Dices,
  Hand,
  KeyRound,
  Maximize2,
  Minimize2,
  Play,
  Rocket,
  RotateCcw,
  Sparkles,
  Square,
  Swords,
} from 'lucide-react';

import { obtenerTema, type TemaId } from '../data/temas';
import type { VariableMemoria } from '../engine/types';
import { crearBoveda } from './juegos/boveda';
import { crearCalculadora } from './juegos/calculadora';
import { crearCohete } from './juegos/cohete';
import { crearDado } from './juegos/dado';
import { crearLibre } from './juegos/libre';
import type { EscenaJuego2D, InfoPrograma, Juego } from './juegos/motor';
import { crearRpg } from './juegos/rpg';
import { crearTorneo } from './juegos/torneo';

export type { EscenaJuego2D } from './juegos/motor';

export interface OpcionRapidaJuego {
  val: string;
  label: string;
}

export interface GameStage2DProps {
  tema: TemaId;
  nombrePrograma: string;
  codigo: string;
  runSeq: number;
  salidas: { id: number; clase: string; texto: string; linea: number | null }[];
  variables: VariableMemoria[];
  estadoEjec: 'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso';
  preguntaActiva: string | null;
  opcionesRapidas: OpcionRapidaJuego[];
  onElegirOpcion: (val: string) => void;
  onJugar: () => void;
  onDetener: () => void;
  onSeleccionarJuego: (juegoId: EscenaJuego2D) => void;
  desactivarAnimacion: boolean;
}

/** Elige el juego según el nombre del archivo, el código y sus variables. */
export function detectarEscena2D(nombre: string, codigo: string, variables: VariableMemoria[]): EscenaJuego2D {
  const fuente = `${nombre} ${codigo}`.toLowerCase();
  if (/vida_rival|vida_heroe|slime|duelo_rpg|llamarada|pocion|contraataca/.test(fuente)) return 'rpg';
  if (/piedra|tijera|torneo/.test(fuente)) return 'torneo';
  if (/cohete|despeg|cuenta\s*regresiva/.test(fuente)) return 'cohete';
  if (/calculadora|operaci[oó]n|primero|segundo/.test(fuente)) return 'calculadora';
  if (/secreto|adivina|boveda|bóveda/.test(fuente)) return 'boveda';
  if (/\bdado\b|tesoro|estrella/.test(fuente)) return 'aventura';
  const nombres = variables.map((v) => v.nombre).join(' ').toLowerCase();
  if (/vida_rival|vida_heroe/.test(nombres)) return 'rpg';
  if (/computadora|jugador/.test(nombres)) return 'torneo';
  if (/cuenta|piloto/.test(nombres)) return 'cohete';
  if (/opcion|primero/.test(nombres)) return 'calculadora';
  if (/secreto|intento/.test(nombres)) return 'boveda';
  if (/dado/.test(nombres)) return 'aventura';
  return 'chispa';
}

// `otraVez`: texto del botón cuando la partida terminó; dice exactamente lo que pasa al pulsarlo.
const JUEGOS: { id: EscenaJuego2D; label: string; titulo: string; otraVez: string; icon: React.ReactNode; crear: () => Juego }[] = [
  { id: 'rpg', label: 'RPG', titulo: 'Duelo RPG: Kira contra el Slime Rey', otraVez: 'Nuevo duelo', icon: <Swords size={11} aria-hidden="true" />, crear: crearRpg },
  { id: 'torneo', label: 'Torneo', titulo: 'Torneo de Piedra, Papel o Tijera: Leo contra Byte', otraVez: 'Otra ronda', icon: <Hand size={11} aria-hidden="true" />, crear: crearTorneo },
  { id: 'cohete', label: 'Cohete', titulo: 'Despegue espacial con la piloto Nova', otraVez: 'Lanzar de nuevo', icon: <Rocket size={11} aria-hidden="true" />, crear: crearCohete },
  { id: 'boveda', label: 'Bóveda', titulo: 'Adivina el número con el búho Lupa', otraVez: 'Nuevo número secreto', icon: <KeyRound size={11} aria-hidden="true" />, crear: crearBoveda },
  { id: 'aventura', label: 'Dado', titulo: 'Aventura del Dado Mágico con la rana Saltín', otraVez: 'Lanzar otra vez', icon: <Dices size={11} aria-hidden="true" />, crear: crearDado },
  { id: 'calculadora', label: 'Calcu', titulo: 'Calculadora Mágica con el robot Calcu', otraVez: 'Otra cuenta', icon: <Calculator size={11} aria-hidden="true" />, crear: crearCalculadora },
  { id: 'chispa', label: 'Libre', titulo: 'Mundo libre con Chispa', otraVez: 'Volver a jugar', icon: <Sparkles size={11} aria-hidden="true" />, crear: crearLibre },
];

/** Texto del botón para repetir la partida del juego activo (lo usan el escenario y la terminal). */
export function textoOtraVez(nombre: string, codigo: string, variables: VariableMemoria[]): string {
  const escena = detectarEscena2D(nombre, codigo, variables);
  return JUEGOS.find((j) => j.id === escena)?.otraVez ?? 'Volver a jugar';
}

export const GameStage2D: React.FC<GameStage2DProps> = ({
  tema,
  nombrePrograma,
  codigo,
  runSeq,
  salidas,
  variables,
  estadoEjec,
  preguntaActiva,
  opcionesRapidas,
  onElegirOpcion,
  onJugar,
  onDetener,
  onSeleccionarJuego,
  desactivarAnimacion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ampliado, setAmpliado] = useState(false);
  const escena = detectarEscena2D(nombrePrograma, codigo, variables);
  const meta = JUEGOS.find((j) => j.id === escena) ?? JUEGOS[JUEGOS.length - 1];
  const acento = obtenerTema(tema).muestras[2];

  // Una instancia por juego: cada uno conserva su estado (marcador, estrellas…) al cambiar de pestaña.
  const juegos = useMemo(
    () => Object.fromEntries(JUEGOS.map((j) => [j.id, j.crear()])) as Record<EscenaJuego2D, Juego>,
    [],
  );

  const info: InfoPrograma = {
    variables,
    estado: estadoEjec,
    pregunta: preguntaActiva,
    acento,
    reducido: desactivarAnimacion,
  };
  const vivo = useRef({ escena, info });
  vivo.current = { escena, info };

  // Nueva ejecución: el juego activo vuelve a su estado inicial.
  const ultimaEjecucion = useRef(runSeq);
  const leidas = useRef(0);
  useEffect(() => {
    if (ultimaEjecucion.current === runSeq) return;
    ultimaEjecucion.current = runSeq;
    leidas.current = 0;
    juegos[escena].reiniciar();
  }, [runSeq, escena, juegos]);

  // Cada línea nueva de la terminal llega al juego activo, en orden.
  useEffect(() => {
    if (salidas.length < leidas.current) leidas.current = 0;
    const juego = juegos[vivo.current.escena];
    for (const s of salidas.slice(leidas.current)) juego.alEvento(s.clase, s.texto, vivo.current.info);
    leidas.current = salidas.length;
  }, [salidas, juegos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const g = canvas?.getContext('2d');
    if (!canvas || !g) return undefined;
    let w = 480;
    let h = 280;
    let id = 0;
    let antes = performance.now();
    let t = 0;

    const pintar = (dt: number) => {
      const { escena: e, info: i } = vivo.current;
      g.save();
      g.clearRect(0, 0, w, h);
      juegos[e].dibujar(g, w, h, dt, t, i);
      g.restore();
    };

    const medir = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nw = Math.max(200, Math.floor(r.width));
      const nh = Math.max(150, Math.floor(r.height));
      if (nw === w && nh === h && canvas.width === Math.floor(nw * dpr)) return;
      w = nw;
      h = nh;
      // Cambiar el tamaño del canvas lo borra: se redibuja enseguida, antes de que
      // el navegador pinte, para que no se vea un cuadro vacío (parpadeo).
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.imageSmoothingEnabled = true;
      pintar(0);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(canvas);

    const cuadro = (ahora: number) => {
      const dt = Math.min(0.05, Math.max(0, (ahora - antes) / 1000));
      antes = ahora;
      t += dt;
      pintar(dt);
      id = window.requestAnimationFrame(cuadro);
    };
    id = window.requestAnimationFrame(cuadro);
    return () => {
      window.cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [juegos]);

  const alClic = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    juegos[escena].alClic?.((e.clientX - r.left) / Math.max(1, r.width), (e.clientY - r.top) / Math.max(1, r.height));
  };

  const alTeclado = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onJugar();
    }
  };

  const puedeReiniciar = estadoEjec === 'inactivo' && salidas.length > 0;

  return (
    <div className={`game-stage-shell ${ampliado ? 'is-expanded' : ''}`} data-stage-scene={escena}>
      <div className="game-stage-bar">
        <div className="game-stage-modes" role="group" aria-label="Elegir juego">
          {JUEGOS.map((j) => (
            <button
              key={j.id}
              type="button"
              className="stage-mode-pill"
              aria-pressed={escena === j.id}
              onClick={() => onSeleccionarJuego(j.id)}
              title={j.titulo}
            >
              {j.icon}
              <span>{j.label}</span>
            </button>
          ))}
        </div>

        <div className="stage-hw-controls">
          <button
            type="button"
            className="stage-play-pill"
            onClick={onJugar}
            title={puedeReiniciar ? meta.otraVez : 'Jugar'}
          >
            {puedeReiniciar ? <RotateCcw size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
            <span>{puedeReiniciar ? meta.otraVez : 'Jugar'}</span>
          </button>
          {estadoEjec !== 'inactivo' && (
            <button type="button" className="stage-stop-pill" onClick={onDetener} aria-label="Detener juego" title="Detener">
              <Square size={11} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="stage-size-pill"
            onClick={() => setAmpliado((v) => !v)}
            aria-label={ampliado ? 'Reducir escenario' : 'Ampliar escenario'}
            title={ampliado ? 'Tamaño normal' : 'Ampliar escenario'}
          >
            {ampliado ? <Minimize2 size={12} aria-hidden="true" /> : <Maximize2 size={12} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="game-stage-viewport">
        <canvas
          ref={canvasRef}
          className="game-stage-canvas"
          tabIndex={0}
          onClick={alClic}
          onKeyDown={alTeclado}
          aria-label={`${meta.titulo}. Pulsa Enter para jugar.`}
          title={meta.titulo}
        />
      </div>

      {preguntaActiva && opcionesRapidas.length > 0 && (
        <div className="stage-controller-deck" role="group" aria-label="Elegir jugada">
          <span className="stage-controller-label">Tu turno:</span>
          <div className="stage-controller-btns">
            {opcionesRapidas.map((op) => (
              <button key={op.val} type="button" className="quick-choice-btn" onClick={() => onElegirOpcion(op.val)}>
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
