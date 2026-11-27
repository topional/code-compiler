/**
 * Divisor arrastrable entre dos paneles. Se mueve con el ratón, el dedo o las
 * flechas del teclado; doble clic vuelve al tamaño original.
 */

import React, { useRef } from 'react';

export interface DivisorProps {
  /** 'vertical' separa izquierda/derecha (se arrastra en X); 'horizontal' separa arriba/abajo (en Y). */
  orientacion: 'vertical' | 'horizontal';
  etiqueta: string;
  /** Valor actual 0..100 para lectores de pantalla. */
  valor: number;
  /** Desplazamiento del puntero en píxeles desde el último movimiento. */
  onArrastrar: (delta: number) => void;
  onReiniciar: () => void;
}

export const Divisor: React.FC<DivisorProps> = ({ orientacion, etiqueta, valor, onArrastrar, onReiniciar }) => {
  const ultimo = useRef<number | null>(null);
  const pendiente = useRef(0);
  const cuadro = useRef(0);
  const eje = (e: React.PointerEvent) => (orientacion === 'vertical' ? e.clientX : e.clientY);
  // El ratón puede mover el divisor muchas veces por cuadro: se aplica una sola vez por cuadro.
  const acumular = (delta: number) => {
    pendiente.current += delta;
    if (cuadro.current) return;
    cuadro.current = window.requestAnimationFrame(() => {
      cuadro.current = 0;
      const d = pendiente.current;
      pendiente.current = 0;
      if (d) onArrastrar(d);
    });
  };

  return (
    <div
      className={`divisor divisor-${orientacion}`}
      role="separator"
      tabIndex={0}
      aria-orientation={orientacion}
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(valor)}
      title={`${etiqueta} · arrastra para ajustar, doble clic para restaurar`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        ultimo.current = eje(e);
        document.body.classList.add('arrastrando-divisor');
      }}
      onPointerMove={(e) => {
        if (ultimo.current === null) return;
        const actual = eje(e);
        acumular(actual - ultimo.current);
        ultimo.current = actual;
      }}
      onPointerUp={() => {
        ultimo.current = null;
        document.body.classList.remove('arrastrando-divisor');
      }}
      onPointerCancel={() => {
        ultimo.current = null;
        document.body.classList.remove('arrastrando-divisor');
      }}
      onDoubleClick={onReiniciar}
      onKeyDown={(e) => {
        const menos = orientacion === 'vertical' ? 'ArrowLeft' : 'ArrowUp';
        const mas = orientacion === 'vertical' ? 'ArrowRight' : 'ArrowDown';
        if (e.key === menos || e.key === mas) {
          e.preventDefault();
          onArrastrar((e.key === mas ? 1 : -1) * (e.shiftKey ? 60 : 20));
        } else if (e.key === 'Home' || e.key === 'Enter') {
          e.preventDefault();
          onReiniciar();
        }
      }}
    >
      <span className="divisor-asa" aria-hidden="true" />
    </div>
  );
};
