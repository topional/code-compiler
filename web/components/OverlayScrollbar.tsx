import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Barra de desplazamiento flotante (Overlay Scrollbar estilo macOS / Linear).
 * Flota POR ENCIMA de la página sin ocupar ni un píxel de ancho ni cortar el fondo WebGL.
 * Permite arrastrar el pulgar o hacer clic en el carril y toma el color del tema activo.
 */
export const OverlayScrollbar: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [metrics, setMetrics] = useState({ thumbHeight: 0, thumbTop: 0, hasScroll: false });

  const hideTimerRef = useRef<number | null>(null);
  const dragStartYRef = useRef(0);
  const dragStartScrollRef = useRef(0);

  const recalcular = useCallback(() => {
    const doc = document.documentElement;
    const scrollHeight = doc.scrollHeight;
    const clientHeight = window.innerHeight;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 4) {
      setMetrics({ thumbHeight: 0, thumbTop: 0, hasScroll: false });
      return;
    }

    const trackHeight = clientHeight - 16;
    const ratio = clientHeight / scrollHeight;
    const thumbHeight = Math.max(42, Math.round(trackHeight * ratio));
    const maxTop = trackHeight - thumbHeight;
    const thumbTop = Math.round((window.scrollY / maxScroll) * maxTop);

    setMetrics({ thumbHeight, thumbTop, hasScroll: true });
  }, []);

  const mostrarTemporal = useCallback(() => {
    setVisible(true);
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 1100);
  }, []);

  useEffect(() => {
    recalcular();
    const onScroll = () => {
      recalcular();
      mostrarTemporal();
    };
    const onResize = () => recalcular();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    const ro = new ResizeObserver(() => recalcular());
    ro.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    };
  }, [mostrarTemporal, recalcular]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - window.innerHeight;
      const trackHeight = window.innerHeight - 16;
      const maxTop = Math.max(1, trackHeight - metrics.thumbHeight);
      const deltaY = e.clientY - dragStartYRef.current;
      const nextScroll = dragStartScrollRef.current + (deltaY / maxTop) * maxScroll;
      window.scrollTo({ top: Math.max(0, Math.min(maxScroll, nextScroll)), behavior: 'auto' });
    };

    const onUp = () => setDragging(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, metrics.thumbHeight]);

  if (!metrics.hasScroll) return null;

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).dataset.thumb === 'true') return;
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const ratio = Math.max(0, Math.min(1, (e.clientY - 8) / Math.max(1, window.innerHeight - 16)));
    window.scrollTo({ top: ratio * maxScroll, behavior: 'smooth' });
  };

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragStartYRef.current = e.clientY;
    dragStartScrollRef.current = window.scrollY;
    setDragging(true);
  };

  const activo = visible || hovered || dragging;

  return (
    <div
      className={`overlay-scroll-rail ${activo ? 'is-visible' : ''} ${dragging ? 'is-dragging' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPointerDown={onTrackPointerDown}
      aria-hidden="true"
    >
      <div
        data-thumb="true"
        className="overlay-scroll-thumb"
        style={{
          height: `${metrics.thumbHeight}px`,
          transform: `translateY(${metrics.thumbTop}px)`,
        }}
        onPointerDown={onThumbPointerDown}
      />
    </div>
  );
};
