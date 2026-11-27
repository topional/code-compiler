/**
 * Editor `.edu` basado en CodeMirror 6 (MIT):
 * - Coloreado sintáctico por categoría Scratch adaptado a los 10 temas.
 * - Autocompletado en español, línea activa paso a paso, hover-line desde consola
 *   (estilo GoJS.app), líneas de error y atajos Ctrl+Enter / Ctrl+Shift+F.
 */

import {
  acceptCompletion,
  autocompletion,
  closeCompletion,
  moveCompletionSelection,
  nextSnippetField,
  prevSnippetField,
  snippetCompletion,
  startCompletion,
  type Completion,
  type CompletionContext,
} from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { Prec, StateEffect, StateField, type Range } from '@codemirror/state';
import {
  Decoration,
  type DecorationSet,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from '@codemirror/view';
import { tags } from '@lezer/highlight';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const KW_VARIABLE = new Set(['crear', 'variable', 'con', 'asignar', 'valor', 'de']);
const KW_IO = new Set(['mostrar', 'preguntar', 'guardar', 'en']);
const KW_CONTROL = new Set([
  'si',
  'entonces',
  'sino',
  'fin',
  'repetir',
  'veces',
  'mientras',
  'hacer',
  'juego',
  'calculadora',
]);
const KW_OPERADOR = new Set([
  'es',
  'igual',
  'a',
  'diferente',
  'mayor',
  'menor',
  'que',
  'y',
  'o',
  'no',
  'aleatorio',
  'entre',
  'verdadero',
  'falso',
]);
const KW_FUNCION = new Set(['definir', 'devuelve', 'devolver', 'numero', 'texto', 'logico']);

const eduStreamLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;
    if (stream.peek() === '#') {
      stream.skipToEnd();
      return 'comment';
    }
    if (stream.peek() === '"') {
      stream.next();
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '\\') stream.next();
        else if (ch === '"') break;
      }
      return 'string';
    }
    if (stream.match(/^[0-9]+(\.[0-9]+)?/)) return 'number';
    if (stream.match(/^[+\-*/(),]/)) return 'operator';
    if (stream.match(/^[a-zA-Z_áéíóúüñÁÉÍÓÚÜÑ][a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]*/)) {
      const word = stream.current().toLowerCase();
      if (KW_VARIABLE.has(word)) return 'variableName.definition';
      if (KW_IO.has(word)) return 'keyword';
      if (KW_CONTROL.has(word)) return 'controlKeyword';
      if (KW_OPERADOR.has(word)) return 'operatorKeyword';
      if (KW_FUNCION.has(word)) return 'typeName';
      return 'variableName';
    }
    stream.next();
    return null;
  },
});

const eduHighlightStyle = HighlightStyle.define([
  { tag: tags.definition(tags.variableName), class: 'tok-edu-variable' },
  { tag: tags.keyword, class: 'tok-edu-io' },
  { tag: tags.controlKeyword, class: 'tok-edu-control' },
  { tag: tags.operatorKeyword, class: 'tok-edu-operador' },
  { tag: tags.typeName, class: 'tok-edu-funcion' },
  { tag: tags.string, class: 'tok-edu-string' },
  { tag: tags.number, class: 'tok-edu-number' },
  { tag: tags.comment, class: 'tok-edu-comment' },
]);

const COMPLETIONS_EDU: Completion[] = [
  snippetCompletion('crear variable ${nombre}', {
    label: 'crear variable',
    type: 'keyword',
    detail: 'Crea una cajita nueva',
    boost: 10,
  }),
  snippetCompletion('crear variable ${nombre}\nasignar ${nombre} valor de "${Sofía}"', {
    label: 'crear variable (texto)',
    type: 'keyword',
    detail: 'Cajita para palabras " "',
    boost: 9,
  }),
  snippetCompletion('crear variable ${edad}\nasignar ${edad} valor de ${10}', {
    label: 'crear variable (número)',
    type: 'keyword',
    detail: 'Cajita para números',
    boost: 9,
  }),
  snippetCompletion('asignar ${nombre} valor de ${valor}', {
    label: 'asignar valor de',
    type: 'keyword',
    detail: 'Guarda un valor en una cajita',
    boost: 8,
  }),
  snippetCompletion('mostrar ${"¡Hola!"}', {
    label: 'mostrar',
    type: 'keyword',
    detail: 'Muestra en pantalla',
    boost: 8,
  }),
  snippetCompletion(
    'crear variable ${numero1}\nasignar ${numero1} valor de 0\npreguntar "${¿Cuál es tu número?}" guardar en ${numero1}',
    {
      label: 'preguntar (número)',
      type: 'keyword',
      detail: 'Pide un número para sumar',
      boost: 8,
    },
  ),
  snippetCompletion('preguntar "${¿Cómo te llamas?}" guardar en ${nombre}', {
    label: 'preguntar (texto)',
    type: 'keyword',
    detail: 'Pide palabras al jugador',
    boost: 7,
  }),
  snippetCompletion('si ${puntos} es mayor o igual que ${10} entonces\n    mostrar "${¡Ganaste!}"\nsino\n    mostrar "${Sigue intentando}"\nfin', {
    label: 'si ... entonces ... sino',
    type: 'keyword',
    detail: 'Decisión con 2 caminos',
    boost: 7,
  }),
  snippetCompletion('si ${puntos} es mayor que ${10} entonces\n    mostrar "${¡Genial!}"\nfin', {
    label: 'si ... entonces',
    type: 'keyword',
    detail: 'Decisión simple',
    boost: 6,
  }),
  snippetCompletion('repetir ${3} veces\n    mostrar "${¡Salto!}"\nfin', {
    label: 'repetir ... veces',
    type: 'keyword',
    detail: 'Ciclo fijo',
    boost: 7,
  }),
  snippetCompletion('mientras ${energia} es mayor que ${0} hacer\n    mostrar ${energia}\n    asignar ${energia} valor de ${energia} - 1\nfin', {
    label: 'mientras ... hacer',
    type: 'keyword',
    detail: 'Ciclo con condición',
    boost: 6,
  }),
  snippetCompletion('definir ${doble}(numero ${x}) devuelve numero\n    devolver ${x} * 2\nfin', {
    label: 'definir función',
    type: 'function',
    detail: 'Crea tu propia receta',
    boost: 6,
  }),
  snippetCompletion('numero aleatorio entre ${1} y ${6}', {
    label: 'numero aleatorio entre',
    type: 'function',
    detail: 'Número al azar (dado)',
    boost: 6,
  }),
  { label: 'es igual a', type: 'operator', detail: 'Comparar (=)' },
  { label: 'es diferente de', type: 'operator', detail: 'Comparar (≠)' },
  { label: 'es mayor que', type: 'operator', detail: 'Comparar (>)' },
  { label: 'es menor que', type: 'operator', detail: 'Comparar (<)' },
  { label: 'es mayor o igual que', type: 'operator', detail: 'Comparar (≥)' },
  { label: 'es menor o igual que', type: 'operator', detail: 'Comparar (≤)' },
  { label: 'verdadero', type: 'constant', detail: 'Valor lógico' },
  { label: 'falso', type: 'constant', detail: 'Valor lógico' },
];

const MULTIWORD_PREFIXES = [
  'crear',
  'asignar',
  'numero',
  'es',
  'preguntar',
  'definir',
];

function extraerSimbolosDelDoc(docTexto: string): Completion[] {
  const encontrados = new Map<string, 'variable' | 'function'>();
  for (const m of docTexto.matchAll(/\bcrear\s+variable\s+([a-zA-Z_áéíóúüñÁÉÍÓÚÜÑ][a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]*)/gi)) {
    encontrados.set(m[1], 'variable');
  }
  for (const m of docTexto.matchAll(/\bdefinir\s+([a-zA-Z_áéíóúüñÁÉÍÓÚÜÑ][a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]*)\s*\(/gi)) {
    encontrados.set(m[1], 'function');
  }
  return Array.from(encontrados.entries()).map(([nombre, tipo]) => ({
    label: nombre,
    type: tipo,
    detail: tipo === 'function' ? 'Tu función' : 'Tu cajita',
    boost: 12,
  }));
}

function eduCompleter(context: CompletionContext) {
  const line = context.state.doc.lineAt(context.pos);
  const beforeCursor = line.text.slice(0, context.pos - line.from);

  // No abrir autocompletado dentro de comentarios ni dentro de comillas de texto
  if (/^\s*#/.test(beforeCursor)) return null;
  const quotesCount = (beforeCursor.match(/"/g) ?? []).length;
  if (quotesCount % 2 === 1) return null;

  // Si el usuario escribió una frase compuesta como "crear var" o "es may", reemplazar la frase entera sin duplicar
  const multiMatch = /\b([a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_]+(?:\s+[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_]+)+)$/.exec(beforeCursor);
  const firstWord = multiMatch ? multiMatch[1].split(/\s+/)[0].toLowerCase() : '';
  if (multiMatch && MULTIWORD_PREFIXES.includes(firstWord)) {
    const phrase = multiMatch[1].toLowerCase();
    const matchingMulti = COMPLETIONS_EDU.filter((c) => c.label.toLowerCase().startsWith(phrase));
    if (matchingMulti.length > 0) {
      return {
        from: context.pos - multiMatch[1].length,
        options: matchingMulti,
        validFor: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_\s]*$/,
      };
    }
  }

  const word = context.matchBefore(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_][a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const simbolosUsuario = extraerSimbolosDelDoc(context.state.doc.toString()).filter(
    (s) => s.label !== word.text,
  );

  return {
    from: word.from,
    options: [...simbolosUsuario, ...COMPLETIONS_EDU],
    validFor: /^[a-zA-Z0-9_áéíóúüñÁÉÍÓÚÜÑ]*$/,
  };
}

const setDecorationsEffect = StateEffect.define<{
  activeLine: number | null;
  hoverLine: number | null;
  errorLines: number[];
}>();

const lineDecorationsField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decos, tr) {
    for (const ef of tr.effects) {
      if (ef.is(setDecorationsEffect)) {
        const ranges: Range<Decoration>[] = [];
        const { activeLine, hoverLine, errorLines } = ef.value;
        const maxLines = tr.state.doc.lines;

        if (activeLine && activeLine >= 1 && activeLine <= maxLines) {
          const line = tr.state.doc.line(activeLine);
          ranges.push(Decoration.line({ class: 'cm-exec-line' }).range(line.from));
        }

        if (hoverLine && hoverLine >= 1 && hoverLine <= maxLines && hoverLine !== activeLine) {
          const line = tr.state.doc.line(hoverLine);
          ranges.push(Decoration.line({ class: 'cm-hover-line' }).range(line.from));
        }

        const uniqueErrors = Array.from(new Set(errorLines)).sort((a, b) => a - b);
        for (const errLine of uniqueErrors) {
          if (errLine >= 1 && errLine <= maxLines) {
            const line = tr.state.doc.line(errLine);
            ranges.push(Decoration.line({ class: 'cm-err-line' }).range(line.from));
          }
        }

        ranges.sort((a, b) => a.from - b.from);
        return Decoration.set(ranges, true);
      }
    }
    if (tr.docChanged) return decos.map(tr.changes);
    return decos;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export interface EduEditorHandle {
  insertSnippet: (snippet: string) => void;
  focusLine: (linea: number, columna?: number | null) => void;
}

interface EduEditorProps {
  value: string;
  onChange: (value: string) => void;
  activeLine?: number | null;
  hoverLine?: number | null;
  errorLines?: number[];
  compact?: boolean;
  ariaLabel?: string;
  onShortcutRun?: () => void;
  onShortcutFormat?: () => void;
  onCursorChange?: (linea: number, columna: number) => void;
}

export const EduEditor = forwardRef<EduEditorHandle, EduEditorProps>(function EduEditor(
  {
    value,
    onChange,
    activeLine = null,
    hoverLine = null,
    errorLines = [],
    compact = false,
    ariaLabel = 'Editor de código de Chispa',
    onShortcutRun,
    onShortcutFormat,
    onCursorChange,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onShortcutRun);
  const onFormatRef = useRef(onShortcutFormat);
  const onCursorRef = useRef(onCursorChange);
  onChangeRef.current = onChange;
  onRunRef.current = onShortcutRun;
  onFormatRef.current = onShortcutFormat;
  onCursorRef.current = onCursorChange;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      doc: value,
      parent: host,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        history(),
        eduStreamLanguage,
        syntaxHighlighting(eduHighlightStyle),
        autocompletion({
          override: [eduCompleter],
          defaultKeymap: false,
          icons: true,
          maxRenderedOptions: 7,
        }),
        lineDecorationsField,
        placeholder('# Escribe tu programa o toca Ayudante / Bloques a la izquierda...'),
        // Autocompletado estilo VS Code: ↓/↑ para elegir, TAB para aceptar (y Enter siempre baja de línea)
        Prec.highest(
          keymap.of([
            { key: 'Ctrl-Space', run: startCompletion },
            { key: 'Escape', run: closeCompletion },
            { key: 'ArrowDown', run: moveCompletionSelection(true) },
            { key: 'ArrowUp', run: moveCompletionSelection(false) },
            { key: 'PageDown', run: moveCompletionSelection(true, 'page') },
            { key: 'PageUp', run: moveCompletionSelection(false, 'page') },
            {
              key: 'Tab',
              run: (v) => acceptCompletion(v) || nextSnippetField(v),
            },
            {
              key: 'Shift-Tab',
              run: prevSnippetField,
            },
          ]),
        ),
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onRunRef.current?.();
              return true;
            },
          },
          {
            key: 'Mod-Shift-f',
            run: () => {
              onFormatRef.current?.();
              return true;
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
          indentWithTab,
        ]),
        EditorView.theme({
          '&': {
            backgroundColor: 'var(--bg-editor)',
            color: 'var(--ink-primary)',
          },
          '.cm-content': {
            caretColor: 'var(--accent)',
          },
          '.cm-cursor, .cm-dropCursor': {
            borderLeftColor: 'var(--accent)',
            borderLeftWidth: '2.5px',
          },
          '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
            {
              backgroundColor: 'color-mix(in srgb, var(--accent) 28%, transparent)',
            },
        }),
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': ariaLabel,
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
          if (update.selectionSet || update.docChanged) {
            const head = update.state.selection.main.head;
            const line = update.state.doc.lineAt(head);
            onCursorRef.current?.(line.number, head - line.from + 1);
          }
        }),
      ],
    });

    view.scrollDOM.setAttribute('tabindex', '0');
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: setDecorationsEffect.of({ activeLine, hoverLine, errorLines }),
    });
  }, [activeLine, hoverLine, errorLines]);

  useImperativeHandle(ref, () => ({
    insertSnippet(snippet: string) {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      const doc = view.state.doc;
      const line = doc.lineAt(from);
      const prefix = line.text.trim().length > 0 && from === line.to ? '\n' : '';
      const text = `${prefix}${snippet}\n`;
      view.dispatch({
        changes: { from, to, insert: text },
        selection: { anchor: from + text.length },
      });
      view.focus();
    },
    focusLine(linea: number, columna?: number | null) {
      const view = viewRef.current;
      if (!view) return;
      const safeLine = Math.max(1, Math.min(linea, view.state.doc.lines));
      const lineObj = view.state.doc.line(safeLine);
      const colOffset = Math.max(0, Math.min((columna ?? 1) - 1, lineObj.length));
      const pos = lineObj.from + colOffset;
      view.dispatch({
        selection: { anchor: pos },
        scrollIntoView: true,
      });
      view.focus();
    },
  }));

  return (
    <div
      ref={hostRef}
      className={`edu-cm-wrapper ${compact ? 'compact' : ''}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('text/x-edu-snippet')) {
          e.preventDefault();
        }
      }}
      onDrop={(e) => {
        const snippet = e.dataTransfer.getData('text/x-edu-snippet');
        if (snippet && viewRef.current) {
          e.preventDefault();
          const { from, to } = viewRef.current.state.selection.main;
          const text = `\n${snippet}\n`;
          viewRef.current.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
          });
          viewRef.current.focus();
        }
      }}
    />
  );
});
