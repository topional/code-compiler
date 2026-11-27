/**
 * Catálogo de 14 temas visuales diseñados a mano y verificados con WCAG AA/AAA.
 * Inspirados en buildwithclaude.com/themes, GoJS.app, Dracula, Tokyo Night,
 * Catppuccin, Nord, Gruvbox, Rosé Pine, Everforest, Kanagawa y Scratch.
 */

export type TemaId =
  | 'gojs-dark'
  | 'dracula'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'nord'
  | 'arcade-pixel'
  | 'gruvbox-dark'
  | 'rose-pine'
  | 'everforest-dark'
  | 'kanagawa-wave'
  | 'cuaderno'
  | 'catppuccin-latte'
  | 'bosque-menta'
  | 'high-contrast';

export interface TemaPreviewSintaxis {
  editorBg: string;
  ink: string;
  kw: string;
  str: string;
  num: string;
  fn: string;
  comment: string;
}

export interface TemaMeta {
  id: TemaId;
  nombre: string;
  grupo: 'Oscuros' | 'Claros' | 'Accesibilidad';
  descripcion: string;
  metaColor: string;
  muestras: [string, string, string, string]; // [fondo, superficie, acento (< >), secundario (✦)]
  sintaxis: TemaPreviewSintaxis;
}

export const TEMAS_CATALOGO: TemaMeta[] = [
  {
    id: 'gojs-dark',
    nombre: 'GoJS Nocturno',
    grupo: 'Oscuros',
    descripcion: 'Obsidiana y amarillo eléctrico con acento celeste de alta nitidez.',
    metaColor: '#0c0f17',
    muestras: ['#0c0f17', '#161b29', '#facc15', '#38bdf8'],
    sintaxis: {
      editorBg: '#10141f',
      ink: '#f5f7ff',
      kw: '#facc15',
      str: '#4ade80',
      num: '#60a5fa',
      fn: '#f472b6',
      comment: '#8fa1c4',
    },
  },
  {
    id: 'dracula',
    nombre: 'Dracula',
    grupo: 'Oscuros',
    descripcion: 'Clásico vibrante de estudio con púrpura, rosa neón, cian y verde.',
    metaColor: '#21222c',
    muestras: ['#21222c', '#282a36', '#bd93f9', '#ff79c6'],
    sintaxis: {
      editorBg: '#1e2029',
      ink: '#f8f8f2',
      kw: '#ff79c6',
      str: '#f1fa8c',
      num: '#8be9fd',
      fn: '#50fa7b',
      comment: '#9ca7c9',
    },
  },
  {
    id: 'tokyo-night',
    nombre: 'Tokyo Night',
    grupo: 'Oscuros',
    descripcion: 'Azul nocturno japonés con acentos celestes, lavanda y turquesa.',
    metaColor: '#16161e',
    muestras: ['#16161e', '#1a1b26', '#7aa2f7', '#73daca'],
    sintaxis: {
      editorBg: '#14151f',
      ink: '#eef2ff',
      kw: '#bb9af7',
      str: '#9ece6a',
      num: '#ff9e64',
      fn: '#7aa2f7',
      comment: '#8e96b8',
    },
  },
  {
    id: 'catppuccin-mocha',
    nombre: 'Catppuccin Mocha',
    grupo: 'Oscuros',
    descripcion: 'Paleta oscura cálida y suave con malva, durazno y cielo pastel.',
    metaColor: '#181825',
    muestras: ['#181825', '#1e1e2e', '#cba6f7', '#fab387'],
    sintaxis: {
      editorBg: '#161622',
      ink: '#cdd6f4',
      kw: '#cba6f7',
      str: '#a6e3a1',
      num: '#fab387',
      fn: '#89b4fa',
      comment: '#9399b2',
    },
  },
  {
    id: 'gruvbox-dark',
    nombre: 'Gruvbox Dark',
    grupo: 'Oscuros',
    descripcion: 'Paleta retro cálida inspirada en terminales clásicos con ámbar y oliva.',
    metaColor: '#1d2021',
    muestras: ['#1d2021', '#282828', '#fabd2f', '#fe8019'],
    sintaxis: {
      editorBg: '#1b1d1e',
      ink: '#fbf1c7',
      kw: '#fb4934',
      str: '#b8bb26',
      num: '#d3869b',
      fn: '#fabd2f',
      comment: '#a89984',
    },
  },
  {
    id: 'rose-pine',
    nombre: 'Rosé Pine',
    grupo: 'Oscuros',
    descripcion: 'Estética minimalista SoHo con rosa palo, pino, espuma y oro suave.',
    metaColor: '#191724',
    muestras: ['#191724', '#1f1d2e', '#ebbcba', '#9ccfd8'],
    sintaxis: {
      editorBg: '#161420',
      ink: '#e0def4',
      kw: '#eb6f92',
      str: '#f6c177',
      num: '#c4a7e7',
      fn: '#9ccfd8',
      comment: '#9994b4',
    },
  },
  {
    id: 'everforest-dark',
    nombre: 'Everforest Dark',
    grupo: 'Oscuros',
    descripcion: 'Tonos orgánicos de bosque suave diseñados para programar sin fatiga.',
    metaColor: '#232a2e',
    muestras: ['#232a2e', '#2d353b', '#a7c080', '#dbbc7f'],
    sintaxis: {
      editorBg: '#1f2529',
      ink: '#e6dcc3',
      kw: '#e67e80',
      str: '#a7c080',
      num: '#d699b6',
      fn: '#7fbbb3',
      comment: '#9da9a0',
    },
  },
  {
    id: 'kanagawa-wave',
    nombre: 'Kanagawa Wave',
    grupo: 'Oscuros',
    descripcion: 'Tinta sumi y olas japonesas inspiradas en la obra de Hokusai.',
    metaColor: '#16161d',
    muestras: ['#16161d', '#1f1f28', '#7e9cd8', '#ffa066'],
    sintaxis: {
      editorBg: '#14141b',
      ink: '#dcd7ba',
      kw: '#957fb8',
      str: '#98bb6c',
      num: '#d27e99',
      fn: '#7e9cd8',
      comment: '#96949e',
    },
  },
  {
    id: 'nord',
    nombre: 'Nord Ártico',
    grupo: 'Oscuros',
    descripcion: 'Azules polares serenos con hielo escarchado y verde aurora.',
    metaColor: '#242933',
    muestras: ['#242933', '#2e3440', '#88c0d0', '#a3be8c'],
    sintaxis: {
      editorBg: '#222731',
      ink: '#eceff4',
      kw: '#81a1c1',
      str: '#a3be8c',
      num: '#b48ead',
      fn: '#88c0d0',
      comment: '#9aa5bc',
    },
  },
  {
    id: 'arcade-pixel',
    nombre: 'Arcade Pixel',
    grupo: 'Oscuros',
    descripcion: 'Estética retro neón con índigo profundo, celeste eléctrico y oro.',
    metaColor: '#110b22',
    muestras: ['#110b22', '#1c1338', '#22d3ee', '#fde047'],
    sintaxis: {
      editorBg: '#0e091d',
      ink: '#fdf8ff',
      kw: '#f472b6',
      str: '#4ade80',
      num: '#fde047',
      fn: '#22d3ee',
      comment: '#a79ac9',
    },
  },
  {
    id: 'cuaderno',
    nombre: 'Cuaderno Taller',
    grupo: 'Claros',
    descripcion: 'Papel crema cálido con tinta naranja terracota y acento morado.',
    metaColor: '#fff9f0',
    muestras: ['#fff9f0', '#ffffff', '#c9410a', '#6d28d9'],
    sintaxis: {
      editorBg: '#fffdf9',
      ink: '#142038',
      kw: '#c9410a',
      str: '#047857',
      num: '#1d4ed8',
      fn: '#6d28d9',
      comment: '#5e6b85',
    },
  },
  {
    id: 'catppuccin-latte',
    nombre: 'Catppuccin Latte',
    grupo: 'Claros',
    descripcion: 'Claro limpio y equilibrado con índigo lavanda y verde esmeralda.',
    metaColor: '#eff1f5',
    muestras: ['#eff1f5', '#ffffff', '#5a4fcf', '#047857'],
    sintaxis: {
      editorBg: '#f9fafc',
      ink: '#2c2f44',
      kw: '#5a4fcf',
      str: '#047857',
      num: '#c84b00',
      fn: '#0369a1',
      comment: '#5f657d',
    },
  },
  {
    id: 'bosque-menta',
    nombre: 'Bosque Menta',
    grupo: 'Claros',
    descripcion: 'Botánico claro y relajante con verde bosque y ámbar cálido.',
    metaColor: '#f1f8f4',
    muestras: ['#f1f8f4', '#ffffff', '#047857', '#b45309'],
    sintaxis: {
      editorBg: '#fafdfb',
      ink: '#122e22',
      kw: '#047857',
      str: '#15803d',
      num: '#b45309',
      fn: '#0369a1',
      comment: '#4c6d5d',
    },
  },
  {
    id: 'high-contrast',
    nombre: 'Alto Contraste AAA',
    grupo: 'Accesibilidad',
    descripcion: 'Contraste máximo 21:1 negro puro, blanco, amarillo y cian.',
    metaColor: '#000000',
    muestras: ['#000000', '#0a0a0a', '#ffff00', '#00ffff'],
    sintaxis: {
      editorBg: '#000000',
      ink: '#ffffff',
      kw: '#ffff00',
      str: '#00ff66',
      num: '#00ffff',
      fn: '#ff66ff',
      comment: '#d4d4d4',
    },
  },
];

export const TEMAS_VALIDOS = new Set<string>(TEMAS_CATALOGO.map((t) => t.id));

export function obtenerTema(id: string | null | undefined): TemaMeta {
  return TEMAS_CATALOGO.find((t) => t.id === id) ?? TEMAS_CATALOGO[0];
}
