/**
 * Catálogo de 10 temas visuales diseñados a mano y verificados con WCAG AA/AAA.
 * Inspirados en GoJS.app, Dracula, Tokyo Night, Catppuccin, Nord, Codédex y Scratch.
 */

export type TemaId =
  | 'gojs-dark'
  | 'cuaderno'
  | 'dracula'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'catppuccin-latte'
  | 'nord'
  | 'arcade-pixel'
  | 'bosque-menta'
  | 'high-contrast';

export interface TemaMeta {
  id: TemaId;
  nombre: string;
  grupo: 'Oscuros' | 'Claros' | 'Accesibilidad';
  descripcion: string;
  metaColor: string;
  muestras: [string, string, string, string]; // [fondo, superficie, acento, secundario]
}

export const TEMAS_CATALOGO: TemaMeta[] = [
  {
    id: 'gojs-dark',
    nombre: 'GoJS Nocturno',
    grupo: 'Oscuros',
    descripcion: 'Obsidiana y amarillo eléctrico con halo pixel azul, inspirado en GoJS.app.',
    metaColor: '#0c0f17',
    muestras: ['#0c0f17', '#161b29', '#facc15', '#38bdf8'],
  },
  {
    id: 'dracula',
    nombre: 'Dracula',
    grupo: 'Oscuros',
    descripcion: 'Clásico vibrante de estudio con púrpura, rosa neón, cian y verde.',
    metaColor: '#21222c',
    muestras: ['#21222c', '#282a36', '#bd93f9', '#ff79c6'],
  },
  {
    id: 'tokyo-night',
    nombre: 'Tokyo Night',
    grupo: 'Oscuros',
    descripcion: 'Azul nocturno japonés con acentos celestes, lavanda y turquesa.',
    metaColor: '#16161e',
    muestras: ['#16161e', '#1a1b26', '#7aa2f7', '#73daca'],
  },
  {
    id: 'catppuccin-mocha',
    nombre: 'Catppuccin Mocha',
    grupo: 'Oscuros',
    descripcion: 'Paleta oscura cálida y suave con malva, durazno y cielo pastel.',
    metaColor: '#181825',
    muestras: ['#181825', '#1e1e2e', '#cba6f7', '#fab387'],
  },
  {
    id: 'nord',
    nombre: 'Nord Ártico',
    grupo: 'Oscuros',
    descripcion: 'Azules polares serenos con hielo escarchado y aurora boreal.',
    metaColor: '#242933',
    muestras: ['#242933', '#2e3440', '#88c0d0', '#a3be8c'],
  },
  {
    id: 'arcade-pixel',
    nombre: 'Arcade Pixel',
    grupo: 'Oscuros',
    descripcion: 'Estética retro RPG tipo Codédex con índigo profundo, cian y oro.',
    metaColor: '#110b22',
    muestras: ['#110b22', '#1c1338', '#22d3ee', '#fde047'],
  },
  {
    id: 'cuaderno',
    nombre: 'Cuaderno Taller',
    grupo: 'Claros',
    descripcion: 'Papel crema cálido con bloques estilo Scratch y tinta azul marino.',
    metaColor: '#fff9f0',
    muestras: ['#fff9f0', '#ffffff', '#c9410a', '#6d28d9'],
  },
  {
    id: 'catppuccin-latte',
    nombre: 'Catppuccin Latte',
    grupo: 'Claros',
    descripcion: 'Claro limpio y amable con lavanda, zafiro y melocotón.',
    metaColor: '#eff1f5',
    muestras: ['#eff1f5', '#ffffff', '#5a4fcf', '#047857'],
  },
  {
    id: 'bosque-menta',
    nombre: 'Bosque Menta',
    grupo: 'Claros',
    descripcion: 'Botánico y relajante para sesiones largas de clase y estudio.',
    metaColor: '#f1f8f4',
    muestras: ['#f1f8f4', '#ffffff', '#047857', '#b45309'],
  },
  {
    id: 'high-contrast',
    nombre: 'Alto Contraste AAA',
    grupo: 'Accesibilidad',
    descripcion: 'Contraste máximo 21:1 negro puro, blanco y amarillo eléctrico.',
    metaColor: '#000000',
    muestras: ['#000000', '#0a0a0a', '#ffff00', '#00ffff'],
  },
];

export const TEMAS_VALIDOS = new Set<string>(TEMAS_CATALOGO.map((t) => t.id));

export function obtenerTema(id: string | null | undefined): TemaMeta {
  return TEMAS_CATALOGO.find((t) => t.id === id) ?? TEMAS_CATALOGO[0];
}
