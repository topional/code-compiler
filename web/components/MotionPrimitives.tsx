import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';

/**
 * Primitivas de animación cinética para Code Compiler · Chispa .edu
 * Inspiradas en Motion.dev, React Bits, Magic UI y Motion Primitives.
 * Se desactivan únicamente cuando el usuario activa explícitamente "Movimiento reducido" en Ajustes.
 */

/* --------------------------------------------------------------------------
   1. KineticLetterStage: letras que aparecen y desaparecen UNA POR UNA
      de forma continua e inequívoca (estilo GSAP SplitText + React Bits)
   -------------------------------------------------------------------------- */
interface KineticLetterStageProps {
  frases: string[];
  desactivarAnimacion?: boolean;
  className?: string;
}

export const KineticLetterStage: React.FC<KineticLetterStageProps> = ({
  frases,
  desactivarAnimacion = false,
  className = '',
}) => {
  const [fraseIdx, setFraseIdx] = useState(0);
  const [visibles, setVisibles] = useState(0);
  const [fase, setFase] = useState<'entrando' | 'pausa' | 'saliendo'>('entrando');

  const actual = frases[fraseIdx] ?? frases[0] ?? '';
  const letras = Array.from(actual);

  useEffect(() => {
    if (desactivarAnimacion) {
      setVisibles(letras.length);
      return;
    }

    if (fase === 'entrando') {
      if (visibles < letras.length) {
        const t = window.setTimeout(() => setVisibles((v) => v + 1), 46);
        return () => window.clearTimeout(t);
      }
      const p = window.setTimeout(() => setFase('pausa'), 120);
      return () => window.clearTimeout(p);
    }

    if (fase === 'pausa') {
      const p = window.setTimeout(() => setFase('saliendo'), 1650);
      return () => window.clearTimeout(p);
    }

    // saliendo: desaparecen una por una
    if (visibles > 0) {
      const t = window.setTimeout(() => setVisibles((v) => v - 1), 30);
      return () => window.clearTimeout(t);
    }
    const next = window.setTimeout(() => {
      setFraseIdx((i) => (i + 1) % frases.length);
      setFase('entrando');
    }, 140);
    return () => window.clearTimeout(next);
  }, [desactivarAnimacion, fase, frases.length, letras.length, visibles]);

  if (desactivarAnimacion) {
    return <span className={className}>{frases[0]}</span>;
  }

  return (
    <span className={`kinetic-stage ${className}`} aria-live="off">
      <span className="sr-only">{frases[0]}</span>
      <span className="kinetic-line" aria-hidden="true">
        {letras.map((char, idx) => {
          const activa = idx < visibles;
          return (
            <span
              key={`${fraseIdx}-${idx}`}
              className={`kinetic-char ${activa ? 'is-in' : 'is-out'}`}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
        <span className="kinetic-caret" />
      </span>
    </span>
  );
};

/* --------------------------------------------------------------------------
   2. TypewriterCycle: escribe y borra líneas de código .edu letra por letra
   -------------------------------------------------------------------------- */
interface TypewriterCycleProps {
  frases: string[];
  velEscribirMs?: number;
  velBorrarMs?: number;
  pausaMs?: number;
  desactivarAnimacion?: boolean;
  className?: string;
}

export const TypewriterCycle: React.FC<TypewriterCycleProps> = ({
  frases,
  velEscribirMs = 42,
  velBorrarMs = 22,
  pausaMs = 1500,
  desactivarAnimacion = false,
  className = '',
}) => {
  const [fraseIdx, setFraseIdx] = useState(0);
  const [subLen, setSubLen] = useState(0);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    if (desactivarAnimacion || frases.length === 0) return;
    const objetivo = frases[fraseIdx];

    if (!borrando && subLen === objetivo.length) {
      const pauseTimer = window.setTimeout(() => setBorrando(true), pausaMs);
      return () => window.clearTimeout(pauseTimer);
    }

    if (borrando && subLen === 0) {
      const nextTimer = window.setTimeout(() => {
        setBorrando(false);
        setFraseIdx((i) => (i + 1) % frases.length);
      }, 180);
      return () => window.clearTimeout(nextTimer);
    }

    const stepTimer = window.setTimeout(
      () => setSubLen((n) => n + (borrando ? -1 : 1)),
      borrando ? velBorrarMs : velEscribirMs,
    );
    return () => window.clearTimeout(stepTimer);
  }, [borrando, desactivarAnimacion, fraseIdx, frases, pausaMs, subLen, velBorrarMs, velEscribirMs]);

  if (desactivarAnimacion) {
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
   3. ScrambleText: efecto decodificador retro al entrar en vista o en hover
   -------------------------------------------------------------------------- */
const GLIFOS_SCRAMBLE = '01<>/{}[]#*+=?%&$';

interface ScrambleTextProps {
  texto: string;
  desactivarAnimacion?: boolean;
  className?: string;
}

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  texto,
  desactivarAnimacion = false,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const enVista = useInView(ref, { once: true, amount: 0.3 });
  const [mostrado, setMostrado] = useState(texto);
  const [disparo, setDisparo] = useState(0);

  useEffect(() => {
    if (desactivarAnimacion || !enVista) {
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
    }, 26);

    return () => window.clearInterval(id);
  }, [desactivarAnimacion, disparo, enVista, texto]);

  return (
    <span
      ref={ref}
      className={className}
      onMouseEnter={!desactivarAnimacion ? () => setDisparo((d) => d + 1) : undefined}
    >
      <span className="sr-only">{texto}</span>
      <span aria-hidden="true">{mostrado}</span>
    </span>
  );
};

/* --------------------------------------------------------------------------
   4. SplitRevealText: palabras con revelación enmascarada (100% contraste)
   -------------------------------------------------------------------------- */
interface SplitRevealTextProps {
  texto: string;
  desactivarAnimacion?: boolean;
  className?: string;
}

export const SplitRevealText: React.FC<SplitRevealTextProps> = ({
  texto,
  desactivarAnimacion = false,
  className = '',
}) => {
  if (desactivarAnimacion) return <span className={className}>{texto}</span>;

  const palabras = texto.split(' ');
  return (
    <motion.span
      className={`anim-split-wrap ${className}`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.35 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
      }}
    >
      {palabras.map((palabra, idx) => (
        <span key={`${palabra}-${idx}`} className="anim-split-mask">
          <motion.span
            className="anim-split-word"
            variants={{
              hidden: { y: '108%' },
              visible: {
                y: '0%',
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
   5. AnimatedNumber: contador numérico fluido
   -------------------------------------------------------------------------- */
interface AnimatedNumberProps {
  valor: number;
  sufijo?: string;
  desactivarAnimacion?: boolean;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  valor,
  sufijo = '',
  desactivarAnimacion = false,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement | null>(null);
  const enVista = useInView(ref, { once: true, amount: 0.3 });
  const [actual, setActual] = useState(valor);

  useEffect(() => {
    if (desactivarAnimacion || !enVista) {
      setActual(valor);
      return;
    }
    const inicio = performance.now();
    const duracion = 620;
    let raf = 0;

    const tick = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / duracion);
      const eased = 1 - Math.pow(1 - p, 3);
      setActual(Math.round(valor * eased));
      if (p < 1) raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [desactivarAnimacion, enVista, valor]);

  return (
    <span ref={ref} className={className}>
      {actual}
      {sufijo}
    </span>
  );
};

/* --------------------------------------------------------------------------
   6. SpotlightCard: tarjeta con resplandor que persigue al cursor + resorte
   -------------------------------------------------------------------------- */
interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  desactivarAnimacion?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  delay = 0,
  desactivarAnimacion = false,
}) => {
  const cardRef = useRef<HTMLElement | null>(null);

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    if (desactivarAnimacion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.article
      ref={cardRef}
      className={`anim-spotlight-card ${className}`}
      onMouseMove={onMove}
      initial={desactivarAnimacion ? false : { y: 16 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.32, delay: Math.min(delay, 0.22), ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        desactivarAnimacion
          ? undefined
          : { y: -5, transition: { type: 'spring', stiffness: 420, damping: 24 } }
      }
    >
      {children}
    </motion.article>
  );
};
