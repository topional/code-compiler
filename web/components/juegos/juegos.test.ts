import { describe, expect, it } from 'vitest';

import type { VariableMemoria } from '../../engine/types';
import { crearDado } from './dado';
import type { InfoPrograma, Juego } from './motor';
import { crearRpg } from './rpg';

/** Contexto 2D falso: ignora el dibujo y guarda los textos del último fotograma. */
function lienzoFalso() {
  const textos: string[] = [];
  const nada = () => undefined;
  const degradado = { addColorStop: nada };
  const g = new Proxy(
    { canvas: { width: 600 }, textos },
    {
      get(objetivo, prop) {
        if (prop in objetivo) return objetivo[prop as keyof typeof objetivo];
        if (prop === 'fillText') return (s: string) => textos.push(s);
        if (prop === 'measureText') return (s: string) => ({ width: s.length * 7 });
        if (/^create/.test(String(prop))) return () => degradado;
        return nada;
      },
      set: () => true,
    },
  );
  return g as unknown as CanvasRenderingContext2D & { textos: string[] };
}

const variable = (nombre: string, valor: string): VariableMemoria => ({
  idInterno: nombre, nombre, tipo: 'numero', valor, ambito: 'global', cambioReciente: false,
});

function jugar(juego: Juego, eventos: [string, string][], variables: VariableMemoria[], segundos = 15) {
  const g = lienzoFalso();
  const info: InfoPrograma = { variables, estado: 'inactivo', pregunta: null, acento: '#f59e0b', reducido: false };
  juego.reiniciar();
  for (const [clase, texto] of eventos) juego.alEvento(clase, texto, info);
  const todos = new Set<string>();
  for (let i = 0; i < segundos * 60; i += 1) {
    g.textos.length = 0;
    juego.dibujar(g, 600, 290, 1 / 60, i / 60, info);
    g.textos.forEach((s) => todos.add(s));
  }
  return { final: g.textos, todos: [...todos] };
}

describe('juegos del escenario', () => {
  it('RPG: la poción nunca sube la vida por encima del máximo', () => {
    const { final, todos } = jugar(
      crearRpg(),
      [
        ['salida', '¡Un Slime Rey salvaje apareció!'],
        ['salida', '¡Slime Rey contraataca!'],
        ['salida', '5'],
        ['respuesta', '3'],
        ['salida', '¡Poción mágica! Recuperas vida (máximo 100)'],
        ['respuesta', '3'],
        ['salida', '¡Poción mágica! Recuperas vida (máximo 100)'],
      ],
      // El programa ya topa en 100; si no lo hiciera, la escena igual lo limita.
      [variable('vida_heroe', '100'), variable('vida_rival', '80')],
    );
    expect(final).toContain('100/100');
    // En ningún cuadro de la animación la vida pasa de 100.
    expect(todos.filter((t) => /^\d+\/100$/.test(t) && Number(t.split('/')[0]) > 100)).toEqual([]);
  });

  it('Dado: con una tirada baja no se queda girando en "Lanzando…"', () => {
    const { final: textos } = jugar(
      crearDado(),
      [
        ['salida', '¡Bienvenido a Chispa!'],
        ['salida', 'Explorador'],
        ['salida', 'Lanzando tu dado mágico...'],
        ['salida', '1'],
        ['salida', '¡Buen intento! Vuelve a lanzar'],
      ],
      [variable('dado', '1')],
    );
    expect(textos).toContain('Pulsa «Lanzar otra vez» 🎲');
    expect(textos).not.toContain('¡Lanzando el dado mágico!');
  });
});
