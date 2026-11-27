import Fuse from 'fuse.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Code2,
  Columns2,
  FolderOpen,
  History,
  Palette,
  Search,
  Trophy,
  Wand2,
  X,
} from 'lucide-react';

import { EJEMPLOS_EDU } from '../data/ejemplos';
import { MISIONES_EDU, type MisionEdu } from '../data/misiones';
import { TEMAS_CATALOGO, type TemaId } from '../data/temas';
import { ContainerOverlayScrollbar } from './OverlayScrollbar';
import type { PanelDerechoTipo } from './RightDrawer';

interface AccionComando {
  id: string;
  grupo: 'Herramientas' | 'Temas' | 'Juegos 2D' | 'Misiones';
  titulo: string;
  subtitulo: string;
  ejecutar: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onAbrirPanel: (panel: Exclude<PanelDerechoTipo, null>) => void;
  onCambiarTema: (tema: TemaId) => void;
  onAbrirEjemplo: (codigo: string, nombre: string) => void;
  onIniciarMision: (mision: MisionEdu) => void;
  onFormatear: () => void;
  onAlternarLayout: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onAbrirPanel,
  onCambiarTema,
  onAbrirEjemplo,
  onIniciarMision,
  onFormatear,
  onAlternarLayout,
}: CommandPaletteProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      setQuery('');
      el.showModal();
      setTimeout(() => inputRef.current?.focus(), 20);
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const acciones = useMemo<AccionComando[]>(() => {
    return [
      {
        id: 'panel-misiones',
        grupo: 'Herramientas',
        titulo: 'Abrir Misiones guiadas (XP)',
        subtitulo: '6 retos progresivos con comprobación automática',
        ejecutar: () => onAbrirPanel('misiones'),
      },
      {
        id: 'panel-guia',
        grupo: 'Herramientas',
        titulo: 'Abrir Guía de Bloques',
        subtitulo: 'Diccionario buscable de comandos en español',
        ejecutar: () => onAbrirPanel('guia'),
      },
      {
        id: 'panel-ejemplos',
        grupo: 'Herramientas',
        titulo: 'Abrir Juegos 2D y Archivos',
        subtitulo: 'Cargar juegos 2D listos o importar archivos',
        ejecutar: () => onAbrirPanel('ejemplos'),
      },
      {
        id: 'panel-historial',
        grupo: 'Herramientas',
        titulo: 'Abrir Historial de instantáneas',
        subtitulo: 'Restaurar versiones anteriores de tu código',
        ejecutar: () => onAbrirPanel('historial'),
      },
      {
        id: 'cmd-format',
        grupo: 'Herramientas',
        titulo: 'Ordenar código automáticamente',
        subtitulo: 'Indenta bloques si, repetir, mientras y definir',
        ejecutar: onFormatear,
      },
      {
        id: 'cmd-layout',
        grupo: 'Herramientas',
        titulo: 'Alternar división Horizontal / Vertical',
        subtitulo: 'Cambia la orientación de Editor y Escenario 2D',
        ejecutar: onAlternarLayout,
      },
      ...TEMAS_CATALOGO.map((t) => ({
        id: `tema-${t.id}`,
        grupo: 'Temas' as const,
        titulo: `Tema: ${t.nombre}`,
        subtitulo: `${t.grupo} · ${t.descripcion}`,
        ejecutar: () => onCambiarTema(t.id),
      })),
      ...EJEMPLOS_EDU.map((ej) => ({
        id: `ej-${ej.id}`,
        grupo: 'Juegos 2D' as const,
        titulo: `Jugar ${ej.titulo}`,
        subtitulo: ej.subtitulo,
        ejecutar: () => onAbrirEjemplo(ej.codigo, ej.archivo),
      })),
      ...MISIONES_EDU.map((m) => ({
        id: `mis-${m.id}`,
        grupo: 'Misiones' as const,
        titulo: `Misión: ${m.titulo}`,
        subtitulo: m.etiquetaNivel,
        ejecutar: () => onIniciarMision(m),
      })),
    ];
  }, [onAbrirPanel, onCambiarTema, onAbrirEjemplo, onIniciarMision, onFormatear, onAlternarLayout]);

  const fuse = useMemo(
    () => new Fuse(acciones, { keys: ['titulo', 'subtitulo', 'grupo'], threshold: 0.36 }),
    [acciones],
  );

  const filtradas = useMemo(() => {
    if (!query.trim()) return acciones.slice(0, 14);
    return fuse.search(query.trim()).map((r) => r.item).slice(0, 14);
  }, [acciones, fuse, query]);

  const iconoDe = (item: AccionComando) => {
    if (item.id === 'panel-guia') return <BookOpen size={15} aria-hidden="true" />;
    if (item.id === 'panel-ejemplos') return <FolderOpen size={15} aria-hidden="true" />;
    if (item.id === 'panel-historial') return <History size={15} aria-hidden="true" />;
    if (item.id === 'cmd-format') return <Wand2 size={15} aria-hidden="true" />;
    if (item.id === 'cmd-layout') return <Columns2 size={15} aria-hidden="true" />;
    if (item.grupo === 'Temas') return <Palette size={15} aria-hidden="true" />;
    if (item.grupo === 'Juegos 2D') return <Code2 size={15} aria-hidden="true" />;
    return <Trophy size={15} aria-hidden="true" />;
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
        <Search size={16} aria-hidden="true" style={{ color: 'var(--accent)', flexShrink: 0 }} />
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
          placeholder="Buscar tema (Dracula, Tokyo...), ejemplo, misión o herramienta..."
        />
        <button
          type="button"
          className="ide-icon-btn"
          onClick={onClose}
          aria-label="Cerrar paleta de comandos"
        >
          <X size={15} aria-hidden="true" />
        </button>
      </div>

      <div className="overlay-scroll-host">
        <div
          ref={listRef}
          className="cmd-list"
          style={{ overscrollBehavior: 'contain' }}
          role="region"
          aria-label="Resultados de comandos"
        >
          {filtradas.length === 0 ? (
            <p style={{ padding: 16, margin: 0, textAlign: 'center', color: 'var(--ink-muted)' }}>
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
                <span className="cmd-item-icon">{iconoDe(item)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.86rem' }}>{item.titulo}</strong>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                    {item.subtitulo}
                  </span>
                </span>
                <span className="pill-mini">{item.grupo}</span>
              </button>
            ))
          )}
        </div>
        <ContainerOverlayScrollbar targetRef={listRef} />
      </div>
    </dialog>
  );
}
