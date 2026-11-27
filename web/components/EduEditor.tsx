/**
 * Editor `.edu` basado en CodeMirror 6 (MIT):
 * - Coloreado sintáctico por categoría Scratch adaptado a los 10 temas.
 * - Autocompletado en español, línea activa paso a paso, hover-line desde consola
 *   (estilo GoJS.app), líneas de error y atajos Ctrl+Enter / Ctrl+Shift+F.
 */

import { autocompletion, type Completion, type CompletionContext } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { StateEffect, StateField, type Range } from '@codemirror/state';
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
  { label: 'crear variable', type: 'keyword', apply: 'crear variable ', detail: 'Declara una variable' },
  { label: 'asignar', type: 'keyword', apply: 'asignar nombre valor de ', detail: 'Guarda un valor' },
  { label: 'mostrar', type: 'keyword', apply: 'mostrar ', detail: 'Muestra en el escenario' },
  { label: 'preguntar', type: 'keyword', apply: 'preguntar "¿...?" guardar en ', detail: 'Pide un dato' },
  {
    label: 'si ... entonces',
    type: 'keyword',
    apply: 'si condicion entonces\n    mostrar "Sí"\nfin',
    detail: 'Condicional',
  },
  {
    label: 'repetir ... veces',
    type: 'keyword',
    apply: 'repetir 3 veces\n    mostrar "Hola"\nfin',
    detail: 'Ciclo fijo',
  },
  {
    label: 'mientras ... hacer',
    type: 'keyword',
    apply: 'mientras condicion hacer\n    mostrar "Paso"\nfin',
    detail: 'Ciclo condicional',
  },
  {
    label: 'definir función',
    type: 'function',
    apply: 'definir nombre(numero x) devuelve numero\n    devolver x\nfin',
    detail: 'Crea una función',
  },
  {
    label: 'numero aleatorio entre',
    type: 'function',
    apply: 'numero aleatorio entre 1 y 6',
    detail: 'Entero al azar',
  },
  { label: 'es igual a', type: 'operator', detail: 'Comparación ==' },
  { label: 'es diferente de', type: 'operator', detail: 'Comparación !=' },
  { label: 'es mayor que', type: 'operator', detail: 'Comparación >' },
  { label: 'es menor que', type: 'operator', detail: 'Comparación <' },
  { label: 'es mayor o igual que', type: 'operator', detail: 'Comparación >=' },
  { label: 'es menor o igual que', type: 'operator', detail: 'Comparación <=' },
  { label: 'verdadero', type: 'constant', detail: 'Valor lógico' },
  { label: 'falso', type: 'constant', detail: 'Valor lógico' },
];

function eduCompleter(context: CompletionContext) {
  const word = context.matchBefore(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_]+/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: COMPLETIONS_EDU,
    validFor: /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ_]*$/,
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
}

export const EduEditor = forwardRef<EduEditorHandle, EduEditorProps>(function EduEditor(
  {
    value,
    onChange,
    activeLine = null,
    hoverLine = null,
    errorLines = [],
    compact = false,
    ariaLabel = 'Editor de código en lenguaje educativo .edu',
    onShortcutRun,
    onShortcutFormat,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onShortcutRun);
  const onFormatRef = useRef(onShortcutFormat);
  onChangeRef.current = onChange;
  onRunRef.current = onShortcutRun;
  onFormatRef.current = onShortcutFormat;

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
        autocompletion({ override: [eduCompleter] }),
        lineDecorationsField,
        placeholder('# Escribe tu programa .edu o haz clic en un bloque de la paleta...'),
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
        EditorView.lineWrapping,
        EditorView.contentAttributes.of({
          'aria-label': ariaLabel,
          spellcheck: 'false',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
    });

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
