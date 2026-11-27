/**
 * Ayudante Interactivo Paso a Paso para niños (Chispa Tutor):
 * Enseña visualmente cómo crear variables de texto vs número, cómo preguntar números
 * para poder sumarlos, y cómo armar decisiones o ciclos viendo el código en vivo antes de insertarlo.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Hash,
  HelpCircle,
  MessageSquare,
  Plus,
  Repeat,
  Sparkles,
  Split,
  Type,
  X,
} from 'lucide-react';

interface CodeHelperModalProps {
  open: boolean;
  onClose: () => void;
  onInsertarCodigo: (codigo: string) => void;
}

type RecetaId = 'var-texto' | 'var-numero' | 'preguntar-numero' | 'preguntar-texto' | 'decision' | 'repetir';

function limpiarIdentificador(raw: string, fallback: string): string {
  const limpio = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_áéíóúñ]/gi, '');
  if (!limpio || /^[0-9]/.test(limpio)) return fallback;
  return limpio;
}

const RECETAS: {
  id: RecetaId;
  corto: string;
  titulo: string;
  regla: string;
  tipoBadge: string;
  icono: React.ReactNode;
}[] = [
  {
    id: 'var-texto',
    corto: 'Texto',
    titulo: 'Guardar palabras (Texto)',
    regla: 'Regla de oro: las palabras y nombres SIEMPRE van entre comillas " ".',
    tipoBadge: 'TEXTO',
    icono: <Type size={15} aria-hidden="true" />,
  },
  {
    id: 'var-numero',
    corto: 'Número',
    titulo: 'Guardar un número',
    regla: 'Regla de oro: los números van SIN comillas para poder sumar, restar o comparar.',
    tipoBadge: 'NÚMERO',
    icono: <Hash size={15} aria-hidden="true" />,
  },
  {
    id: 'preguntar-numero',
    corto: 'Pedir número',
    titulo: 'Preguntar un número (para sumar)',
    regla: '¡Truco clave! Ponemos "valor de 0" antes de preguntar para que guarde un número y puedas sumarlo.',
    tipoBadge: 'NÚMERO',
    icono: <HelpCircle size={15} aria-hidden="true" />,
  },
  {
    id: 'preguntar-texto',
    corto: 'Pedir texto',
    titulo: 'Preguntar un nombre o texto',
    regla: 'Al preguntar en una cajita nueva, Chispa guarda la respuesta como palabras.',
    tipoBadge: 'TEXTO',
    icono: <MessageSquare size={15} aria-hidden="true" />,
  },
  {
    id: 'decision',
    corto: 'Decidir',
    titulo: 'Tomar una decisión (si / sino)',
    regla: 'Compara una cajita con "es mayor o igual que" o "es igual a" y cierra siempre con "fin".',
    tipoBadge: 'CONTROL',
    icono: <Split size={15} aria-hidden="true" />,
  },
  {
    id: 'repetir',
    corto: 'Repetir',
    titulo: 'Repetir varias veces',
    regla: 'Usa un número entero (como 3 o 5) para repetir las líneas de adentro y cierra con "fin".',
    tipoBadge: 'CICLO',
    icono: <Repeat size={15} aria-hidden="true" />,
  },
];

export function CodeHelperModal({ open, onClose, onInsertarCodigo }: CodeHelperModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [receta, setReceta] = useState<RecetaId>('var-texto');

  // Campos editables por el niño
  const [nombreTexto, setNombreTexto] = useState('nombre');
  const [valorTexto, setValorTexto] = useState('Sofía');
  const [mostrarTexto, setMostrarTexto] = useState(true);

  const [nombreNum, setNombreNum] = useState('edad');
  const [valorNum, setValorNum] = useState('10');
  const [mostrarNum, setMostrarNum] = useState(true);

  const [varPregNum, setVarPregNum] = useState('numero1');
  const [textoPregNum, setTextoPregNum] = useState('¿Cuál es tu número?');

  const [varPregTxt, setVarPregTxt] = useState('nombre');
  const [textoPregTxt, setTextoPregTxt] = useState('¿Cómo te llamas?');

  const [varCond, setVarCond] = useState('puntos');
  const [metaCond, setMetaCond] = useState('50');
  const [msgSi, setMsgSi] = useState('¡Ganaste!');
  const [msgSino, setMsgSino] = useState('¡Sigue intentando!');

  const [vecesRep, setVecesRep] = useState('3');
  const [msgRep, setMsgRep] = useState('¡Salto!');

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  const metaReceta = RECETAS.find((r) => r.id === receta) ?? RECETAS[0];

  const codigoGenerado = useMemo(() => {
    if (receta === 'var-texto') {
      const id = limpiarIdentificador(nombreTexto, 'nombre');
      const val = valorTexto.replace(/"/g, "'") || 'Sofía';
      return [
        `crear variable ${id}`,
        `asignar ${id} valor de "${val}"`,
        ...(mostrarTexto ? [`mostrar ${id}`] : []),
      ].join('\n');
    }
    if (receta === 'var-numero') {
      const id = limpiarIdentificador(nombreNum, 'edad');
      const num = Number.isFinite(Number(valorNum)) && valorNum.trim() !== '' ? valorNum.trim() : '10';
      return [
        `crear variable ${id}`,
        `asignar ${id} valor de ${num}`,
        ...(mostrarNum ? [`mostrar ${id}`] : []),
      ].join('\n');
    }
    if (receta === 'preguntar-numero') {
      const id = limpiarIdentificador(varPregNum, 'numero1');
      const preg = textoPregNum.replace(/"/g, "'") || '¿Cuál es tu número?';
      return [
        `crear variable ${id}`,
        `asignar ${id} valor de 0`,
        `preguntar "${preg}" guardar en ${id}`,
        `mostrar ${id}`,
      ].join('\n');
    }
    if (receta === 'preguntar-texto') {
      const id = limpiarIdentificador(varPregTxt, 'nombre');
      const preg = textoPregTxt.replace(/"/g, "'") || '¿Cómo te llamas?';
      return [
        `crear variable ${id}`,
        `preguntar "${preg}" guardar en ${id}`,
        `mostrar ${id}`,
      ].join('\n');
    }
    if (receta === 'decision') {
      const id = limpiarIdentificador(varCond, 'puntos');
      const meta = Number.isFinite(Number(metaCond)) && metaCond.trim() !== '' ? metaCond.trim() : '50';
      const si = msgSi.replace(/"/g, "'") || '¡Ganaste!';
      const sino = msgSino.replace(/"/g, "'") || '¡Sigue intentando!';
      return [
        `si ${id} es mayor o igual que ${meta} entonces`,
        `    mostrar "${si}"`,
        `sino`,
        `    mostrar "${sino}"`,
        `fin`,
      ].join('\n');
    }
    const veces = Math.max(1, Math.min(20, Math.round(Number(vecesRep) || 3)));
    const rep = msgRep.replace(/"/g, "'") || '¡Salto!';
    return [`repetir ${veces} veces`, `    mostrar "${rep}"`, `fin`].join('\n');
  }, [
    receta,
    nombreTexto,
    valorTexto,
    mostrarTexto,
    nombreNum,
    valorNum,
    mostrarNum,
    varPregNum,
    textoPregNum,
    varPregTxt,
    textoPregTxt,
    varCond,
    metaCond,
    msgSi,
    msgSino,
    vecesRep,
    msgRep,
  ]);

  const insertar = () => {
    onInsertarCodigo(codigoGenerado);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className="native-dialog helper-dialog"
      aria-labelledby="helper-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="dialog-head">
        <span id="helper-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: '0.94rem' }}>
          <Sparkles size={16} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          Ayudante paso a paso · Aprende creando
        </span>
        <button
          type="button"
          className="ide-icon-btn"
          onClick={onClose}
          aria-label="Cerrar ayudante"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="dialog-body helper-body">
        <div className="helper-tabs" role="tablist" aria-label="¿Qué quieres programar?">
          {RECETAS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={receta === r.id}
              className="helper-tab"
              onClick={() => setReceta(r.id)}
            >
              {r.icono}
              <span>{r.corto}</span>
            </button>
          ))}
        </div>

        <div className="helper-rule-banner">
          <span className="pill-mini ok">{metaReceta.tipoBadge}</span>
          <div>
            <strong>{metaReceta.titulo}:</strong> {metaReceta.regla}
          </div>
        </div>

        {/* Formulario táctil según receta */}
        <div className="helper-form-grid">
          {receta === 'var-texto' && (
            <>
              <label className="helper-field">
                <span>1. Nombre de tu cajita</span>
                <input
                  className="ide-input"
                  value={nombreTexto}
                  onChange={(e) => setNombreTexto(e.target.value)}
                  placeholder="ej. nombre"
                />
              </label>
              <label className="helper-field">
                <span>2. Palabras adentro (se pondrán comillas " ")</span>
                <input
                  className="ide-input"
                  value={valorTexto}
                  onChange={(e) => setValorTexto(e.target.value)}
                  placeholder="ej. Sofía"
                />
              </label>
              <label className="helper-check">
                <input
                  type="checkbox"
                  checked={mostrarTexto}
                  onChange={(e) => setMostrarTexto(e.target.checked)}
                />
                <span>También mostrarlo en pantalla con `mostrar`</span>
              </label>
            </>
          )}

          {receta === 'var-numero' && (
            <>
              <label className="helper-field">
                <span>1. Nombre de tu cajita</span>
                <input
                  className="ide-input"
                  value={nombreNum}
                  onChange={(e) => setNombreNum(e.target.value)}
                  placeholder="ej. edad"
                />
              </label>
              <label className="helper-field">
                <span>2. Número (sin comillas)</span>
                <input
                  className="ide-input"
                  type="number"
                  value={valorNum}
                  onChange={(e) => setValorNum(e.target.value)}
                  placeholder="ej. 10"
                />
              </label>
              <label className="helper-check">
                <input
                  type="checkbox"
                  checked={mostrarNum}
                  onChange={(e) => setMostrarNum(e.target.checked)}
                />
                <span>También mostrarlo en pantalla con `mostrar`</span>
              </label>
            </>
          )}

          {receta === 'preguntar-numero' && (
            <>
              <label className="helper-field">
                <span>1. Cajita donde se guarda el número</span>
                <input
                  className="ide-input"
                  value={varPregNum}
                  onChange={(e) => setVarPregNum(e.target.value)}
                  placeholder="ej. numero1"
                />
              </label>
              <label className="helper-field">
                <span>2. Pregunta para el jugador</span>
                <input
                  className="ide-input"
                  value={textoPregNum}
                  onChange={(e) => setTextoPregNum(e.target.value)}
                  placeholder="¿Cuál es tu número?"
                />
              </label>
            </>
          )}

          {receta === 'preguntar-texto' && (
            <>
              <label className="helper-field">
                <span>1. Cajita donde se guarda la respuesta</span>
                <input
                  className="ide-input"
                  value={varPregTxt}
                  onChange={(e) => setVarPregTxt(e.target.value)}
                  placeholder="ej. nombre"
                />
              </label>
              <label className="helper-field">
                <span>2. Pregunta para el jugador</span>
                <input
                  className="ide-input"
                  value={textoPregTxt}
                  onChange={(e) => setTextoPregTxt(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                />
              </label>
            </>
          )}

          {receta === 'decision' && (
            <>
              <label className="helper-field">
                <span>1. Cajita a comparar</span>
                <input
                  className="ide-input"
                  value={varCond}
                  onChange={(e) => setVarCond(e.target.value)}
                />
              </label>
              <label className="helper-field">
                <span>2. Si es mayor o igual que...</span>
                <input
                  className="ide-input"
                  type="number"
                  value={metaCond}
                  onChange={(e) => setMetaCond(e.target.value)}
                />
              </label>
              <label className="helper-field">
                <span>3. Mensaje si SÍ se cumple</span>
                <input
                  className="ide-input"
                  value={msgSi}
                  onChange={(e) => setMsgSi(e.target.value)}
                />
              </label>
              <label className="helper-field">
                <span>4. Mensaje si NO se cumple</span>
                <input
                  className="ide-input"
                  value={msgSino}
                  onChange={(e) => setMsgSino(e.target.value)}
                />
              </label>
            </>
          )}

          {receta === 'repetir' && (
            <>
              <label className="helper-field">
                <span>1. ¿Cuántas veces repetir? (número entero)</span>
                <input
                  className="ide-input"
                  type="number"
                  min={1}
                  max={20}
                  value={vecesRep}
                  onChange={(e) => setVecesRep(e.target.value)}
                />
              </label>
              <label className="helper-field">
                <span>2. Mensaje a mostrar cada vez</span>
                <input
                  className="ide-input"
                  value={msgRep}
                  onChange={(e) => setMsgRep(e.target.value)}
                />
              </label>
            </>
          )}
        </div>

        {/* Vista previa en vivo del código real */}
        <div className="helper-preview-box">
          <div className="helper-preview-head">
            <span>Así se escribe en código real:</span>
            <span className="pill-mini ok">
              <Check size={11} aria-hidden="true" /> Sin errores
            </span>
          </div>
          <pre className="helper-preview-code">{codigoGenerado}</pre>
        </div>

        <div className="helper-actions">
          <button type="button" className="btn btn-sm" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={insertar}>
            <Plus size={14} aria-hidden="true" /> Insertar en mi código
          </button>
        </div>
      </div>
    </dialog>
  );
}
