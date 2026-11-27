/**
 * Carril de categorías Scratch + Flyout plegable de fichas rompecabezas `.edu`.
 * Cada ficha muestra cápsulas visuales de parámetros y se inserta al cursor con clic o arrastre.
 */

import { useRef } from 'react';
import { X } from 'lucide-react';

import { BLOQUES_EDU, CATEGORIAS_BLOQUE, type BloqueEdu, type CategoriaBloque } from '../data/bloques';
import { ChispaLogo } from './ChispaLogo';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';

interface ScratchRailProps {
  categoriaActiva: CategoriaBloque | null;
  onToggleCategoria: (cat: CategoriaBloque | null) => void;
  onInsertarBloque: (plantilla: string) => void;
  onAbrirEjemplos: () => void;
  mobileVisible?: boolean;
}

const CAT_VISUAL: Record<
  CategoriaBloque,
  { corto: string; colorVar: string; bgVar: string }
> = {
  variables: { corto: 'Vars', colorVar: 'var(--cat-variable)', bgVar: 'var(--cat-variable-bg)' },
  io: { corto: 'Hablar', colorVar: 'var(--cat-io)', bgVar: 'var(--cat-io-bg)' },
  control: { corto: 'Control', colorVar: 'var(--cat-control)', bgVar: 'var(--cat-control-bg)' },
  operadores: { corto: 'Azar', colorVar: 'var(--cat-operador)', bgVar: 'var(--cat-operador-bg)' },
  funciones: { corto: 'Func', colorVar: 'var(--cat-funcion)', bgVar: 'var(--cat-funcion-bg)' },
};

const FICHAS_PARTES: Record<string, { texto: string; slot?: string }[]> = {
  'crear-variable': [{ texto: 'crear variable', slot: 'puntos' }],
  'asignar-valor': [{ texto: 'asignar', slot: 'puntos' }, { texto: 'valor de', slot: 'puntos + 1' }],
  mostrar: [{ texto: 'mostrar', slot: '"¡Hola!"' }],
  preguntar: [{ texto: 'preguntar', slot: '"¿Nombre?"' }, { texto: 'en', slot: 'respuesta' }],
  'si-entonces': [{ texto: 'si', slot: 'puntos > 10' }, { texto: 'entonces ... fin' }],
  'repetir-veces': [{ texto: 'repetir', slot: '3' }, { texto: 'veces ... fin' }],
  'mientras-hacer': [{ texto: 'mientras', slot: 'energia > 0' }, { texto: 'hacer ... fin' }],
  aleatorio: [{ texto: 'aleatorio entre', slot: '1' }, { texto: 'y', slot: '6' }],
  comparaciones: [{ texto: 'edad', slot: 'es mayor o igual que' }, { texto: '', slot: '10' }],
  logica: [{ texto: 'si', slot: 'A y no B' }, { texto: 'entonces' }],
  'definir-funcion': [{ texto: 'definir', slot: 'doble(numero x)' }, { texto: '→ numero' }],
};

function PuzzleBlockCard({
  bloque,
  onInsertar,
}: {
  bloque: BloqueEdu;
  onInsertar: (plantilla: string) => void;
}) {
  const vis = CAT_VISUAL[bloque.categoria];
  const partes = FICHAS_PARTES[bloque.id] ?? [{ texto: bloque.etiquetaCorta }];

  return (
    <button
      type="button"
      className="puzzle-block"
      style={
        {
          '--cat-color': vis.colorVar,
          '--cat-bg': vis.bgVar,
        } as React.CSSProperties
      }
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/x-edu-snippet', bloque.plantilla)}
      onClick={() => onInsertar(bloque.plantilla)}
      title={`Clic o arrastra para insertar: ${bloque.titulo}`}
    >
      <span className="puzzle-row">
        {partes.map((p, idx) => (
          <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {p.texto && <span>{p.texto}</span>}
            {p.slot && <span className="puzzle-slot">{p.slot}</span>}
          </span>
        ))}
      </span>
      <span className="puzzle-sub">{bloque.descripcion}</span>
    </button>
  );
}

export function ScratchRail({
  categoriaActiva,
  onToggleCategoria,
  onInsertarBloque,
  onAbrirEjemplos,
  mobileVisible = false,
}: ScratchRailProps) {
  const flyoutBodyRef = useRef<HTMLDivElement | null>(null);

  const catMeta = categoriaActiva
    ? CATEGORIAS_BLOQUE.find((c) => c.id === categoriaActiva) ?? null
    : null;

  const bloques = categoriaActiva
    ? BLOQUES_EDU.filter((b) => b.categoria === categoriaActiva)
    : BLOQUES_EDU;

  return (
    <>
      {/* Carril vertical izquierdo con círculos de color estilo Scratch */}
      <nav className="scratch-rail" aria-label="Categorías de bloques .edu">
        <button
          type="button"
          className="rail-brand"
          onClick={onAbrirEjemplos}
          title="Chispa .edu · Code Compiler — Abrir ejemplos"
          aria-label="Chispa .edu Code Compiler — Ver ejemplos"
        >
          <ChispaLogo compact />
        </button>

        <span className="rail-divider" aria-hidden="true" />

        {CATEGORIAS_BLOQUE.map((cat) => {
          const vis = CAT_VISUAL[cat.id];
          const activo = categoriaActiva === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              className="scratch-cat-btn"
              style={{ '--cat-color': vis.colorVar } as React.CSSProperties}
              aria-pressed={activo}
              onClick={() => onToggleCategoria(activo ? null : cat.id)}
              title={`${cat.nombre}: ${cat.resumen}`}
            >
              <span className="scratch-cat-dot" aria-hidden="true" />
              <span className="scratch-cat-label">{vis.corto}</span>
            </button>
          );
        })}
      </nav>

      {/* Flyout plegable de fichas rompecabezas */}
      {(categoriaActiva !== null || mobileVisible) && (
        <aside
          className={`wb-pane blocks-flyout ${mobileVisible ? '' : 'mobile-hidden'}`}
          aria-label="Paleta de fichas .edu"
        >
          <div className="wb-pane-header">
            <span className="wb-pane-title">
              <span
                className="swatch-dot"
                style={{
                  backgroundColor: categoriaActiva
                    ? CAT_VISUAL[categoriaActiva].colorVar
                    : 'var(--accent)',
                }}
                aria-hidden="true"
              />
              {catMeta ? catMeta.nombre : 'Todos los bloques'}
            </span>

            {categoriaActiva && (
              <button
                type="button"
                className="ide-icon-btn hide-narrow"
                onClick={() => onToggleCategoria(null)}
                aria-label="Ocultar paleta de bloques"
                title="Plegar bloques"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="overlay-scroll-host is-flex">
            <div ref={flyoutBodyRef} className="blocks-flyout-body">
              {/* Filtro rápido en móvil donde el carril izquierdo está oculto */}
              {mobileVisible && (
                <div className="sub-tabs-row" role="group" aria-label="Filtrar categoría de bloques">
                  <button
                    type="button"
                    className="sub-pill"
                    aria-pressed={categoriaActiva === null}
                    onClick={() => onToggleCategoria(null)}
                  >
                    Todos
                  </button>
                  {CATEGORIAS_BLOQUE.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="sub-pill"
                      aria-pressed={categoriaActiva === c.id}
                      onClick={() => onToggleCategoria(c.id)}
                    >
                      {CAT_VISUAL[c.id].corto}
                    </button>
                  ))}
                </div>
              )}

              <p className="blocks-flyout-hint">
                {catMeta
                  ? `${catMeta.resumen} Haz clic o arrastra una ficha al editor.`
                  : 'Haz clic o arrastra cualquier ficha para insertarla en tu programa.'}
              </p>

              {bloques.map((b) => (
                <PuzzleBlockCard key={b.id} bloque={b} onInsertar={onInsertarBloque} />
              ))}
            </div>
            <ContainerOverlayScrollbar targetRef={flyoutBodyRef} />
          </div>
        </aside>
      )}
    </>
  );
}
