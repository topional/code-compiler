import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';

/**
 * Primitivas de animación interactiva para Code Compiler · Chispa .edu
 * Basadas en los patrones de:
 * - Motion (motion.dev)
 * - React Bits (DavidHDev/react-bits): RotatingText, DecryptedText, SpotlightCard
 * - Magic UI (magicuidesign/magicui): TypingAnimation, TextAnimate, NumberTicker
 * - Motion Primitives (ibelick/motion-primitives): TextLoop, TextScramble
 */

/* --------------------------------------------------------------------------
   1. RotatingPixelWord: letras que aparecen y desaparecen una por una
   -------------------------------------------------------------------------- */
interface RotatingPixelWordProps {
  palabras: string[];
  intervaloMs?: number;
  className?: string;
}

export const RotatingPixelWord: React.FC<RotatingPixelWordProps> = ({
  palabras,
  intervaloMs = 2800,
  className = '',
}) => {
  const reduced = useReducedMotion();
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (reduced || palabras.length <= 1) return;
    const id = window.setInterval(() => {
      setIndice((prev) => (prev + 1) % palabras.length);
    }, intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs, palabras.length, reduced]);

  const actual = palabras[indice] ?? palabras[0];

  if (reduced) {
    return <span className={className}>{palabras[0]}</span>;
  }

  return (
    <span className={`anim-rotating-wrap ${className}`} aria-live="off">
      <span className="sr-only">{palabras[0]}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={actual}
          className="anim-rotating-word"
          aria-hidden="true"
          initial="enter"
          animate="center"
          exit="exit"
          variants={{
            enter: {},
            center: {
              transition: { staggerChildren: 0.035, delayChildren: 0.02 },
            },
            exit: {
              transition: { staggerChildren: 0.024, staggerDirection: -1 },
            },
          }}
        >
          {Array.from(actual).map((char, i) => (
            <motion.span
              key={`${actual}-${i}`}
              className="anim-char"
              variants={{
                enter: {
                  opacity: 0,
                  y: 16,
                  scale: 0.72,
                  filter: 'blur(5px)',
                },
                center: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: 'blur(0px)',
                  transition: { type: 'spring', stiffness: 420, damping: 24 },
                },
                exit: {
                  opacity: 0,
                  y: -14,
                  scale: 0.78,
                  filter: 'blur(5px)',
                  transition: { duration: 0.16, ease: 'easeIn' },
                },
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
};

/* --------------------------------------------------------------------------
   2. TypewriterCycle: máquina de escribir que escribe y borra frases en ciclo
   -------------------------------------------------------------------------- */
interface TypewriterCycleProps {
  frases: string[];
  velEscribirMs?: number;
  velBorrarMs?: number;
  pausaMs?: number;
  className?: string;
}

export const TypewriterCycle: React.FC<TypewriterCycleProps> = ({
  frases,
  velEscribirMs = 46,
  velBorrarMs = 26,
  pausaMs = 1750,
  className = '',
}) => {
  const reduced = useReducedMotion();
  const [fraseIdx, setFraseIdx] = useState(0);
  const [subLen, setSubLen] = useState(frases[0]?.length ?? 0);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    if (reduced || frases.length === 0) return;
    const objetivo = frases[fraseIdx];

    if (!borrando && subLen === objetivo.length) {
      const pauseTimer = window.setTimeout(() => setBorrando(true), pausaMs);
      return () => window.clearTimeout(pauseTimer);
    }

    if (borrando && subLen === 0) {
      const nextTimer = window.setTimeout(() => {
        setBorrando(false);
        setFraseIdx((i) => (i + 1) % frases.length);
      }, 220);
      return () => window.clearTimeout(nextTimer);
    }

    const stepTimer = window.setTimeout(
      () => setSubLen((n) => n + (borrando ? -1 : 1)),
      borrando ? velBorrarMs : velEscribirMs,
    );
    return () => window.clearTimeout(stepTimer);
  }, [borrando, fraseIdx, frases, pausaMs, reduced, subLen, velBorrarMs, velEscribirMs]);

  if (reduced) {
    return <span className={className}>{frases[0]}</span>;
  }

  const textoVisible = frases[fraseIdx].slice(0, subLen);

  return (
    <span className={`anim-typewriter ${className}`} aria-live="off">
      <span className="sr-only">{frases[0]}</span>
      <span aria-hidden="true">{textoVisible}</span>
      <span className="anim-caret" aria-hidden="true" />
    </span>
  );
};

/* --------------------------------------------------------------------------
   3. ScrambleText: efecto decodificador / glitch retro al entrar o pasar mouse
   -------------------------------------------------------------------------- */
const GLIFOS_SCRAMBLE = '01<>/{}[]#*+=?%&$';

interface ScrambleTextProps {
  texto: string;
  className?: string;
  alPasarMouse?: boolean;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  texto,
  className = '',
  alPasarMouse = true,
}) => {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const enVista = useInView(ref, { once: true, amount: 0.4 });
  const [mostrado, setMostrado] = useState(texto);
  const [disparo, setDisparo] = useState(0);

  useEffect(() => {
    if (reduced || !enVista) {
      setMostrado(texto);
      return;
    }

    let frame = 0;
    const totalFrames = Math.max(12, texto.length * 2);
    const id = window.setInterval(() => {
      frame += 1;
      const reveladas = Math.floor((frame / totalFrames) * texto.length);
      const next = Array.from(texto)
        .map((ch, idx) => {
          if (ch === ' ') return ' ';
          if (idx < reveladas) return ch;
          return GLIFOS_SCRAMBLE[(idx * 7 + frame * 3) % GLIFOS_SCRAMBLE.length];
        })
        .join('');
      setMostrado(next);
      if (frame >= totalFrames) {
        setMostrado(texto);
        window.clearInterval(id);
      }
    }, 28);

    return () => window.clearInterval(id);
  }, [disparo, enVista, reduced, texto]);

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={alPasarMouse && !reduced ? () => setDisparo((d) => d + 1) : undefined}
    >
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">{mostrado}</span>
    </span>
  );
};

/* --------------------------------------------------------------------------
   4. SplitRevealText: palabras que emergen con desenfoque + resorte al scrollear
   -------------------------------------------------------------------------- */
interface SplitRevealTextProps {
  texto: string;
  className?: string;
}

export const SplitRevealText: React.FC<SplitRevealTextProps> = ({ texto, className = '' }) => {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{texto}</span>;

  const palabras = texto.split(' ');
  return (
    <motion.span
      className={`anim-split-wrap ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.055 } },
      }}
    >
      {palabras.map((palabra, idx) => (
        <span key={`${palabra}-${idx}`} className="anim-split-mask">
          <motion.span
            className="anim-split-word"
            variants={{
              hidden: { y: '108%', filter: 'blur(3px)' },
              visible: {
                y: '0%',
                filter: 'blur(0px)',
                transition: { type: 'spring', stiffness: 360, damping: 28 },
              },
            }}
          >
            {palabra}
            {idx < palabras.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
};

/* --------------------------------------------------------------------------
   5. AnimatedNumber: contador numérico animado (estilo Magic UI NumberTicker)
   -------------------------------------------------------------------------- */
interface AnimatedNumberProps {
  valor: number;
  sufijo?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  valor,
  sufijo = '',
  className = '',
}) => {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement | null>(null);
  const enVista = useInView(ref, { once: true, amount: 0.3 });
  const [actual, setActual] = useState(valor);

  useEffect(() => {
    if (reduced || !enVista) {
      setActual(valor);
      return;
    }
    const inicio = performance.now();
    const duracion = 650;
    const desde = 0;
    let raf = 0;

    const tick = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / duracion);
      const eased = 1 - Math.pow(1 - p, 3);
      setActual(Math.round(desde + (valor - desde) * eased));
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [enVista, reduced, valor]);

  return (
    <span ref={ref} className={className}>
      {actual}
      {sufijo}
    </span>
  );
};

/* --------------------------------------------------------------------------
   6. SpotlightCard: tarjeta interactiva con resplandor que sigue al cursor
      + física de resorte (React Bits SpotlightCard + Motion)
   -------------------------------------------------------------------------- */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  delay = 0,
}) => {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLElement | null>(null);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.article
      ref={cardRef}
      className={`anim-spotlight-card ${className}`}
      onMouseMove={onMove}
      initial={reduced ? false : { opacity: 0, y: 18, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.34, delay: Math.min(delay, 0.25), ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -5, transition: { type: 'spring', stiffness: 420, damping: 24 } }}
    >
      {children}
    </motion.article>
  );
};
