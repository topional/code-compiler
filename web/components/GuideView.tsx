import Fuse from 'fuse.js';
import { useMemo, useState } from 'react';
import { ArrowRight, Play, Search } from 'lucide-react';

import { BLOQUES_EDU, CATEGORIAS_BLOQUE, type CategoriaBloque } from '../data/bloques';

interface GuideViewProps {
  onProbarEnEstudio: (codigo: string, titulo: string) => void;
}

export function GuideView({ onProbarEnEstudio }: GuideViewProps) {
  const [consulta, setConsulta] = useState('');
  const [categoria, setCategoria] = useState<CategoriaBloque | 'todas'>('todas');

  const fuse = useMemo(
    () =>
      new Fuse(BLOQUES_EDU, {
        keys: [
          { name: 'titulo', weight: 0.35 },
          { name: 'etiquetaCorta', weight: 0.25 },
          { name: 'bloqueScratch', weight: 0.2 },
          { name: 'palabrasClave', weight: 0.2 },
        ],
        threshold: 0.38,
        ignoreLocation: true,
      }),
    [],
  );

  const resultados = useMemo(() => {
    const base = consulta.trim() ? fuse.search(consulta.trim()).map((r) => r.item) : BLOQUES_EDU;
    if (categoria === 'todas') return base;
    return base.filter((b) => b.categoria === categoria);
  }, [consulta, categoria, fuse]);

  return (
    <section aria-labelledby="guide-heading">
      <div className="panel" style={{ padding: 22, marginBottom: 18 }}>
        <span className="section-tag">// diccionario visual con búsqueda aproximada (Fuse.js)</span>
        <h1 id="guide-heading" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 8 }}>
          Guía Visual Scratch ↔ .edu
        </h1>
        <p style={{ margin: '0 0 16px', color: 'var(--ink-secondary)' }}>
          Busca cualquier comando aunque escribas con faltas (por ejemplo: <em>bucle</em>,{' '}
          <em>dado</em>, <em>imprimir</em> o <em>receta</em>) y pruébalo al instante en el Estudio.
        </p>

        <div className="guide-search-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <label htmlFor="guide-search" className="sr-only">
              Buscar comando o bloque
            </label>
            <Search
              size={18}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--ink-muted)',
              }}
            />
            <input
              id="guide-search"
              type="search"
              className="text-input"
              style={{ width: '100%', paddingLeft: 38 }}
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar: repetir, dado, preguntar, si, funcion..."
            />
          </div>
        </div>

        <div className="cat-filter-row" role="group" aria-label="Filtrar guía por categoría">
          <button
            type="button"
            className="cat-chip"
            aria-pressed={categoria === 'todas'}
            onClick={() => setCategoria('todas')}
          >
            Todas ({BLOQUES_EDU.length})
          </button>
          {CATEGORIAS_BLOQUE.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className="cat-chip"
              aria-pressed={categoria === cat.id}
              onClick={() => setCategoria(cat.id)}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      </div>

      {resultados.length === 0 ? (
        <div className="panel" style={{ padding: 28, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No encontramos ese bloque</h2>
          <p style={{ margin: '0 0 14px', color: 'var(--ink-secondary)' }}>
            Prueba con palabras como <strong>variable</strong>, <strong>mostrar</strong>,{' '}
            <strong>aleatorio</strong> o <strong>repetir</strong>.
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setConsulta('');
              setCategoria('todas');
            }}
          >
            Mostrar toda la guía
          </button>
        </div>
      ) : (
        <div className="guide-grid">
          {resultados.map((item) => {
            const cat = CATEGORIAS_BLOQUE.find((c) => c.id === item.categoria)!;
            return (
              <article key={item.id} className="panel guide-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="pill">{cat.nombre}</span>
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                      {item.etiquetaCorta}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.15rem' }}>{item.titulo}</h2>

                  <span
                    className="scratch-brick"
                    style={{
                      borderColor: cat.colorVar,
                      color: cat.colorVar,
                      background: 'var(--bg-surface-alt)',
                    }}
                  >
                    Scratch: {item.bloqueScratch}
                  </span>

                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--ink-secondary)' }}>
                    {item.descripcion}
                  </p>

                  <pre className="bridge-code" tabIndex={0}>
                    <code>{item.ejemploCompleto}</code>
                  </pre>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onProbarEnEstudio(item.ejemploCompleto, `${item.id}.edu`)}
                >
                  <Play size={14} aria-hidden="true" />
                  Probar en el Estudio
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
