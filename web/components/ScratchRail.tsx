/**
 * Carril de categorías estilo Scratch con iconos intuitivos para niños
 * + Flyout plegable de fichas rompecabezas listas para insertar o arrastrar.
 */

import { useRef } from 'react';
import {
  Box,
  Dices,
  GitBranch,
  MessageCircle,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react';

import { BLOQUES_EDU, CATEGORIAS_BLOQUE, type BloqueEdu, type CategoriaBloque } from '../data/bloques';
import { ChispaLogo } from './ChispaLogo';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';

interface ScratchRailProps {
  categoriaActiva: CategoriaBloque | null;
  onToggleCategoria: (cat: CategoriaBloque | null) => void;
  onInsertarBloque: (plantilla: string) => void;
  onAbrirEjemplos: () => void;
  onAbrirAyudante: () => void;
  mobileVisible?: boolean;
}

const CAT_VISUAL: Record<
  CategoriaBloque,
  { corto: string; colorVar: string; bgVar: string; icono: React.ReactNode }
> = {
  variables: {
    corto: 'Cajitas',
    colorVar: 'var(--cat-variable)',
    bgVar: 'var(--cat-variable-bg)',
    icono: <Box size={15} aria-hidden="true" />,
  },
  io: {
    corto: 'Hablar',
    colorVar: 'var(--cat-io)',
    bgVar: 'var(--cat-io-bg)',
    icono: <MessageCircle size={15} aria-hidden="true" />,
  },
  control: {
    corto: 'Ciclos',
    colorVar: 'var(--cat-control)',
    bgVar: 'var(--cat-control-bg)',
    icono: <GitBranch size={15} aria-hidden="true" />,
  },
  operadores: {
    corto: 'Azar',
    colorVar: 'var(--cat-operador)',
    bgVar: 'var(--cat-operador-bg)',
    icono: <Dices size={15} aria-hidden="true" />,
  },
  funciones: {
    corto: 'Recetas',
    colorVar: 'var(--cat-funcion)',
    bgVar: 'var(--cat-funcion-bg)',
    icono: <Wand2 size={15} aria-hidden="true" />,
  },
};

const FICHAS_PARTES: Record<string, { texto: string; slot?: string }[]> = {
  'crear-variable-texto': [{ texto: 'texto', slot: 'nombre = "Sofía"' }],
  'crear-variable': [{ texto: 'número', slot: 'edad = 10' }],
  'asignar-valor': [{ texto: 'asignar', slot: 'puntos' }, { texto: 'valor de', slot: 'puntos + 1' }],
  mostrar: [{ texto: 'mostrar', slot: '"¡Hola!"' }],
  'preguntar-numero': [{ texto: 'preguntar número', slot: 'numero1 = 0' }],
  preguntar: [{ texto: 'preguntar texto', slot: 'nombre' }],
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
  onAbrirAyudante,
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
      {/* Carril vertical izquierdo con medallas de icono y color estilo Scratch */}
      <nav className="scratch-rail" aria-label="Categorías de bloques">
        <button
          type="button"
          className="rail-brand"
          onClick={onAbrirEjemplos}
          title="Chispa · Code Compiler — Abrir juegos 2D"
          aria-label="Chispa Code Compiler — Ver juegos 2D"
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
              style={{ '--cat-color': vis.colorVar, '--cat-bg': vis.bgVar } as React.CSSProperties}
              aria-pressed={activo}
              onClick={() => onToggleCategoria(activo ? null : cat.id)}
              title={`${cat.nombre}: ${cat.resumen}`}
            >
              <span className="scratch-cat-badge" aria-hidden="true">
                {vis.icono}
              </span>
              <span className="scratch-cat-label">{vis.corto}</span>
            </button>
          );
        })}
      </nav>

      {/* Flyout plegable de fichas rompecabezas */}
      {(categoriaActiva !== null || mobileVisible) && (
        <aside
          className={`wb-pane blocks-flyout ${mobileVisible ? '' : 'mobile-hidden'}`}
          aria-label="Paleta de bloques"
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

              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={onAbrirAyudante}
              >
                <Sparkles size={14} aria-hidden="true" />
                Ayudante paso a paso
              </button>

              <p className="blocks-flyout-hint">
                {catMeta
                  ? `${catMeta.resumen} Toca o arrastra una ficha al editor.`
                  : 'Toca o arrastra cualquier ficha para insertarla en tu juego.'}
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
