/**
 * Catálogo de 27 temas visuales diseñados a mano y verificados con WCAG AA/AAA:
 * 15 Oscuros + 9 Claros (3×3) + 3 Accesibilidad (AAA).
 * Regla simétrica del logo <✦>: muestras[2] = corchetes < >, muestras[3] = estrella ✦.
 */

export type TemaId =
  // 15 Oscuros
  | 'gojs-dark'
  | 'dracula'
  | 'tokyo-night'
  | 'catppuccin-mocha'
  | 'gruvbox-dark'
  | 'rose-pine'
  | 'everforest-dark'
  | 'kanagawa-wave'
  | 'nord'
  | 'arcade-pixel'
  | 'one-dark'
  | 'monokai-pro'
  | 'solarized-dark'
  | 'ayu-mirage'
  | 'synthwave-84'
  // 9 Claros
  | 'cuaderno'
  | 'catppuccin-latte'
  | 'bosque-menta'
  | 'solarized-light'
  | 'gruvbox-light'
  | 'rose-pine-dawn'
  | 'github-light'
  | 'tokyo-day'
  | 'everforest-light'
  // 3 Accesibilidad
  | 'high-contrast'
  | 'high-contrast-light'
  | 'high-contrast-amber';

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
  // ===================== 15 TEMAS OSCUROS =====================
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
    id: 'one-dark',
    nombre: 'One Dark Pro',
    grupo: 'Oscuros',
    descripcion: 'El estándar clásico de editores modernos con azul cielo y salvia.',
    metaColor: '#21252b',
    muestras: ['#21252b', '#282c34', '#61afef', '#98c379'],
    sintaxis: {
      editorBg: '#1d2026',
      ink: '#eef2f7',
      kw: '#c678dd',
      str: '#98c379',
      num: '#d19a66',
      fn: '#61afef',
      comment: '#98a3b8',
    },
  },
  {
    id: 'monokai-pro',
    nombre: 'Monokai Pro',
    grupo: 'Oscuros',
    descripcion: 'Contraste cálido de estudio con amarillo miel, coral y lima.',
    metaColor: '#221f22',
    muestras: ['#221f22', '#2d2a2e', '#ffd866', '#ff6188'],
    sintaxis: {
      editorBg: '#1f1c1f',
      ink: '#fcfcfa',
      kw: '#ff6188',
      str: '#ffd866',
      num: '#ab9df2',
      fn: '#a9dc76',
      comment: '#a6a0ab',
    },
  },
  {
    id: 'solarized-dark',
    nombre: 'Solarized Dark',
    grupo: 'Oscuros',
    descripcion: 'Azul petróleo científico con turquesa preciso y ocre dorado.',
    metaColor: '#002b36',
    muestras: ['#002b36', '#073642', '#38c4b8', '#e2b029'],
    sintaxis: {
      editorBg: '#00242e',
      ink: '#fdf6e3',
      kw: '#9dc62d',
      str: '#38c4b8',
      num: '#e2b029',
      fn: '#4da8f0',
      comment: '#93adb3',
    },
  },
  {
    id: 'ayu-mirage',
    nombre: 'Ayu Mirage',
    grupo: 'Oscuros',
    descripcion: 'Gris azulado crepuscular con dorado miel y hielo luminoso.',
    metaColor: '#1c212b',
    muestras: ['#1c212b', '#232a37', '#ffcc66', '#73d0ff'],
    sintaxis: {
      editorBg: '#191e27',
      ink: '#f2f4f8',
      kw: '#ffa759',
      str: '#bae67e',
      num: '#dfbfff',
      fn: '#73d0ff',
      comment: '#97a5bd',
    },
  },
  {
    id: 'synthwave-84',
    nombre: "SynthWave '84",
    grupo: 'Oscuros',
    descripcion: 'Noche retro-futurista de los 80 con magenta neón y cian láser.',
    metaColor: '#191326',
    muestras: ['#191326', '#241b38', '#ff7edb', '#36f9f6'],
    sintaxis: {
      editorBg: '#161022',
      ink: '#fff5ff',
      kw: '#fede5d',
      str: '#72f1b8',
      num: '#ff8b39',
      fn: '#36f9f6',
      comment: '#b29fd6',
    },
  },

  // ===================== 9 TEMAS CLAROS (3×3) =====================
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
    id: 'solarized-light',
    nombre: 'Solarized Light',
    grupo: 'Claros',
    descripcion: 'Pergamino solar clásico con tinta azul océano y ámbar tostado.',
    metaColor: '#fdf6e3',
    muestras: ['#fdf6e3', '#ffffff', '#0b669c', '#9c5500'],
    sintaxis: {
      editorBg: '#fefbf2',
      ink: '#073642',
      kw: '#246824',
      str: '#0f766e',
      num: '#9c5500',
      fn: '#0b669c',
      comment: '#526e75',
    },
  },
  {
    id: 'gruvbox-light',
    nombre: 'Gruvbox Light',
    grupo: 'Claros',
    descripcion: 'Papel cálido retro con cobre quemado, oliva y contraste editorial.',
    metaColor: '#fbf1c7',
    muestras: ['#fbf1c7', '#fffdf2', '#af3a03', '#2e6b46'],
    sintaxis: {
      editorBg: '#fcf5d8',
      ink: '#282828',
      kw: '#b81f1a',
      str: '#2e6b46',
      num: '#8f3f71',
      fn: '#af3a03',
      comment: '#665c54',
    },
  },
  {
    id: 'rose-pine-dawn',
    nombre: 'Rosé Pine Dawn',
    grupo: 'Claros',
    descripcion: 'Amanecer suave en crema rosado con vino suave y azul pino.',
    metaColor: '#faf4ed',
    muestras: ['#faf4ed', '#fffaf3', '#9c3d59', '#286983'],
    sintaxis: {
      editorBg: '#fcf7f1',
      ink: '#383354',
      kw: '#9c3d59',
      str: '#286983',
      num: '#b4631a',
      fn: '#6e4c9a',
      comment: '#676085',
    },
  },
  {
    id: 'github-light',
    nombre: 'GitHub Light',
    grupo: 'Claros',
    descripcion: 'Minimalista, nítido y profesional con azul enlace y violeta.',
    metaColor: '#f6f8fa',
    muestras: ['#f6f8fa', '#ffffff', '#0969da', '#8250df'],
    sintaxis: {
      editorBg: '#fcfdfe',
      ink: '#1f2328',
      kw: '#cf222e',
      str: '#0a3069',
      num: '#0550ae',
      fn: '#8250df',
      comment: '#57606a',
    },
  },
  {
    id: 'tokyo-day',
    nombre: 'Tokyo Day',
    grupo: 'Claros',
    descripcion: 'Luz urbana japonesa con gris perla, azul cobalto y celeste profundo.',
    metaColor: '#e6e7ed',
    muestras: ['#e6e7ed', '#f7f8fb', '#2e5cb8', '#007197'],
    sintaxis: {
      editorBg: '#f2f3f8',
      ink: '#212842',
      kw: '#7847bd',
      str: '#2c7040',
      num: '#b15c00',
      fn: '#2e5cb8',
      comment: '#525c7d',
    },
  },
  {
    id: 'everforest-light',
    nombre: 'Everforest Light',
    grupo: 'Claros',
    descripcion: 'Lienzo cálido de arena y hojas verdes suaves para leer por horas.',
    metaColor: '#f5efdc',
    muestras: ['#f5efdc', '#fffdf5', '#357540', '#b05b24'],
    sintaxis: {
      editorBg: '#faf5e6',
      ink: '#2d3830',
      kw: '#b83333',
      str: '#357540',
      num: '#9c4b75',
      fn: '#256c85',
      comment: '#58675c',
    },
  },

  // ===================== 3 TEMAS DE ACCESIBILIDAD (AAA) =====================
  {
    id: 'high-contrast',
    nombre: 'Alto Contraste Oscuro',
    grupo: 'Accesibilidad',
    descripcion: 'Contraste máximo 21:1 negro puro, blanco, amarillo y cian sin ruido visual.',
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
  {
    id: 'high-contrast-light',
    nombre: 'Alto Contraste Claro',
    grupo: 'Accesibilidad',
    descripcion: 'WCAG AAA blanco puro y tinta negra absoluta con azul cobalto y bordes firmes.',
    metaColor: '#ffffff',
    muestras: ['#ffffff', '#f2f2f2', '#0033cc', '#8b005d'],
    sintaxis: {
      editorBg: '#ffffff',
      ink: '#000000',
      kw: '#0033cc',
      str: '#005a1f',
      num: '#8b005d',
      fn: '#a80000',
      comment: '#333333',
    },
  },
  {
    id: 'high-contrast-amber',
    nombre: 'Alto Contraste Ámbar',
    grupo: 'Accesibilidad',
    descripcion: 'WCAG AAA en negro puro y fósforo ámbar cálido ideal para sensibilidad a la luz.',
    metaColor: '#000000',
    muestras: ['#000000', '#0d0a00', '#ffb703', '#5ce1e6'],
    sintaxis: {
      editorBg: '#000000',
      ink: '#fff4cc',
      kw: '#ffb703',
      str: '#80ff80',
      num: '#5ce1e6',
      fn: '#ff99cc',
      comment: '#f2d57e',
    },
  },
];

export const TEMAS_VALIDOS = new Set<string>(TEMAS_CATALOGO.map((t) => t.id));

export function obtenerTema(id: string | null | undefined): TemaMeta {
  return TEMAS_CATALOGO.find((t) => t.id === id) ?? TEMAS_CATALOGO[0];
}
