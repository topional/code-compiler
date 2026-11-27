import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Code2, Home, Palette, Search, Sparkles, Trophy, X } from 'lucide-react';

import { EJEMPLOS_EDU } from '../data/ejemplos';
import { MISIONES_EDU, type MisionEdu } from '../data/misiones';
import { TEMAS_CATALOGO, type TemaId } from '../data/temas';

interface AccionComando {
  id: string;
  grupo: 'Navegación' | 'Temas (10)' | 'Ejemplos .edu' | 'Misiones';
  titulo: string;
  subtitulo: string;
  ejecutar: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavegar: (ruta: 'inicio' | 'estudio' | 'misiones' | 'guia') => void;
  onCambiarTema: (tema: TemaId) => void;
  onAbrirEjemplo: (codigo: string, nombre: string) => void;
  onIniciarMision: (mision: MisionEdu) => void;
}

export function CommandPalette({
  open,
  onClose,
  onNavegar,
  onCambiarTema,
  onAbrirEjemplo,
  onIniciarMision,
}: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      setQuery('');
      el.showModal();
      setTimeout(() => inputRef.current?.focus(), 30);
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const acciones = useMemo<AccionComando[]>(() => {
    const lista: AccionComando[] = [
      {
        id: 'nav-inicio',
        grupo: 'Navegación',
        titulo: 'Ir a Inicio (Portada interactiva)',
        subtitulo: 'Playground en vivo, puente Scratch y demostraciones',
        ejecutar: () => onNavegar('inicio'),
      },
      {
        id: 'nav-estudio',
        grupo: 'Navegación',
        titulo: 'Ir al Estudio .edu (Code Compiler)',
        subtitulo: 'Editor, bloques, escenario paso a paso y Rayos X',
        ejecutar: () => onNavegar('estudio'),
      },
      {
        id: 'nav-misiones',
        grupo: 'Navegación',
        titulo: 'Ir a Misiones guiadas',
        subtitulo: '6 retos progresivos con verificación e insignias',
        ejecutar: () => onNavegar('misiones'),
      },
      {
        id: 'nav-guia',
        grupo: 'Navegación',
        titulo: 'Ir a la Guía Visual Scratch ↔ .edu',
        subtitulo: 'Diccionario interactivo de comandos en español',
        ejecutar: () => onNavegar('guia'),
      },
      ...TEMAS_CATALOGO.map((t) => ({
        id: `tema-${t.id}`,
        grupo: 'Temas (10)' as const,
        titulo: `Tema: ${t.nombre}`,
        subtitulo: `${t.grupo} · ${t.descripcion}`,
        ejecutar: () => onCambiarTema(t.id),
      })),
      ...EJEMPLOS_EDU.map((ej) => ({
        id: `ej-${ej.id}`,
        grupo: 'Ejemplos .edu' as const,
        titulo: `Abrir ${ej.titulo} (${ej.archivo})`,
        subtitulo: ej.subtitulo,
        ejecutar: () => onAbrirEjemplo(ej.codigo, `${ej.id}.edu`),
      })),
      ...MISIONES_EDU.map((m) => ({
        id: `mis-${m.id}`,
        grupo: 'Misiones' as const,
        titulo: `Misión: ${m.titulo}`,
        subtitulo: m.etiquetaNivel,
        ejecutar: () => onIniciarMision(m),
      })),
    ];
    return lista;
  }, [onNavegar, onCambiarTema, onAbrirEjemplo, onIniciarMision]);

  const fuse = useMemo(
    () =>
      new Fuse(acciones, {
        keys: ['titulo', 'subtitulo', 'grupo'],
        threshold: 0.36,
      }),
    [acciones],
  );

  const filtradas = useMemo(() => {
    if (!query.trim()) return acciones.slice(0, 14);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 14);
  }, [acciones, fuse, query]);

  const iconoDe = (grupo: AccionComando['grupo']) => {
    if (grupo === 'Temas (10)') return <Palette size={15} aria-hidden="true" />;
    if (grupo === 'Ejemplos .edu') return <Code2 size={15} aria-hidden="true" />;
    if (grupo === 'Misiones') return <Trophy size={15} aria-hidden="true" />;
    return <Sparkles size={15} aria-hidden="true" />;
  };

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog cmd-dialog"
      aria-labelledby="cmd-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="cmd-head">
        <Search size={18} aria-hidden="true" style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <label id="cmd-title" htmlFor="cmd-input" className="sr-only">
          Paleta de comandos rápida
        </label>
        <input
          ref={inputRef}
          id="cmd-input"
          type="text"
          className="cmd-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
          placeholder="Buscar tema (Dracula, Tokyo...), ejemplo, misión o sección..."
        />
        <button
          type="button"
          className="btn btn-icon btn-sm"
          onClick={onClose}
          aria-label="Cerrar paleta de comandos"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="cmd-list" role="region" aria-label="Resultados de comandos">
        {filtradas.length === 0 ? (
          <p style={{ padding: 18, margin: 0, textAlign: 'center', color: 'var(--ink-muted)' }}>
            No se encontraron acciones para «{query}».
          </p>
        ) : (
          filtradas.map((item) => (
            <button
              key={item.id}
              type="button"
              className="cmd-item"
              onClick={() => {
                item.ejecutar();
                onClose();
              }}
            >
              <span className="cmd-item-icon">
                {item.id === 'nav-inicio' ? (
                  <Home size={15} aria-hidden="true" />
                ) : item.id === 'nav-guia' ? (
                  <BookOpen size={15} aria-hidden="true" />
                ) : (
                  iconoDe(item.grupo)
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{item.titulo}</strong>
                <span style={{ display: 'block', fontSize: '0.77rem', color: 'var(--ink-muted)' }}>
                  {item.subtitulo}
                </span>
              </span>
              <span className="pill">{item.grupo}</span>
            </button>
          ))
        )}
      </div>
    </dialog>
  );
}
