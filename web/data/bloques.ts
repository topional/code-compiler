/**
 * Catálogo Scratch ↔ .edu usado tanto en la Paleta de Bloques del Estudio
 * como en la Guía Visual con búsqueda aproximada (Fuse.js).
 */

export type CategoriaBloque =
  | 'variables'
  | 'io'
  | 'control'
  | 'operadores'
  | 'funciones';

export interface BloqueEdu {
  id: string;
  categoria: CategoriaBloque;
  etiquetaCorta: string;
  bloqueScratch: string;
  titulo: string;
  descripcion: string;
  plantilla: string;
  ejemploCompleto: string;
  palabrasClave: string[];
}

export const CATEGORIAS_BLOQUE: {
  id: CategoriaBloque;
  nombre: string;
  colorVar: string;
  resumen: string;
}[] = [
  {
    id: 'variables',
    nombre: 'Variables',
    colorVar: 'var(--cat-variable)',
    resumen: 'Cajitas para guardar números, textos o respuestas verdadero/falso.',
  },
  {
    id: 'io',
    nombre: 'Hablar y preguntar',
    colorVar: 'var(--cat-io)',
    resumen: 'Muestra mensajes en el escenario o pide datos al jugador.',
  },
  {
    id: 'control',
    nombre: 'Decisiones y ciclos',
    colorVar: 'var(--cat-control)',
    resumen: 'Elige caminos con si/sino o repite acciones automáticamente.',
  },
  {
    id: 'operadores',
    nombre: 'Azar y lógica',
    colorVar: 'var(--cat-operador)',
    resumen: 'Compara valores, lanza números aleatorios y combina condiciones.',
  },
  {
    id: 'funciones',
    nombre: 'Funciones (recetas)',
    colorVar: 'var(--cat-funcion)',
    resumen: 'Crea tus propios comandos reutilizables que devuelven un resultado.',
  },
];

export const BLOQUES_EDU: BloqueEdu[] = [
  {
    id: 'crear-variable',
    categoria: 'variables',
    etiquetaCorta: 'crear variable',
    bloqueScratch: 'Crear una variable [puntos]',
    titulo: 'Crear una variable nueva',
    descripcion: 'Crea una cajita con nombre propio. Luego le das su primer valor con asignar.',
    plantilla: 'crear variable puntos\nasignar puntos valor de 0',
    ejemploCompleto: 'crear variable puntos\nasignar puntos valor de 10\nmostrar puntos',
    palabrasClave: ['crear', 'variable', 'cajita', 'memoria', 'declarar', 'guardar'],
  },
  {
    id: 'asignar-valor',
    categoria: 'variables',
    etiquetaCorta: 'asignar valor',
    bloqueScratch: 'Dar a [puntos] el valor (10)',
    titulo: 'Guardar o cambiar un valor',
    descripcion: 'Coloca un número, un texto entre comillas o un lógico dentro de una variable.',
    plantilla: 'asignar puntos valor de puntos + 1',
    ejemploCompleto: 'crear variable puntos\nasignar puntos valor de 5\nasignar puntos valor de puntos + 3\nmostrar puntos',
    palabrasClave: ['asignar', 'valor de', 'cambiar', 'sumar', 'modificar'],
  },
  {
    id: 'mostrar',
    categoria: 'io',
    etiquetaCorta: 'mostrar',
    bloqueScratch: 'Decir ["¡Hola!"]',
    titulo: 'Mostrar un mensaje o resultado',
    descripcion: 'Imprime un texto, un número, una variable o el resultado de una operación.',
    plantilla: 'mostrar "¡Hola mundo!"',
    ejemploCompleto: 'mostrar "¡Hola desde Chispa .edu!"\nmostrar 7 * 6',
    palabrasClave: ['mostrar', 'imprimir', 'decir', 'pantalla', 'texto', 'salida', 'print'],
  },
  {
    id: 'preguntar',
    categoria: 'io',
    etiquetaCorta: 'preguntar',
    bloqueScratch: 'Preguntar ["¿Cómo te llamas?"] y esperar',
    titulo: 'Preguntar al usuario y guardar',
    descripcion: 'Hace una pregunta interactiva en el escenario y guarda la respuesta en tu variable.',
    plantilla: 'crear variable respuesta\npreguntar "¿Cómo te llamas?" guardar en respuesta\nmostrar respuesta',
    ejemploCompleto: 'crear variable nombre\npreguntar "¿Cómo te llamas?" guardar en nombre\nmostrar "¡Mucho gusto!"\nmostrar nombre',
    palabrasClave: ['preguntar', 'guardar en', 'entrada', 'leer', 'input', 'usuario'],
  },
  {
    id: 'si-entonces',
    categoria: 'control',
    etiquetaCorta: 'si ... entonces',
    bloqueScratch: 'Si <puntos > 10> entonces ... sino ...',
    titulo: 'Tomar una decisión (si / sino)',
    descripcion: 'Ejecuta un bloque si la condición es verdadera, y opcionalmente otro bloque con sino.',
    plantilla: 'si puntos es mayor que 10 entonces\n    mostrar "¡Subiste de nivel!"\nsino\n    mostrar "Sigue sumando puntos"\nfin',
    ejemploCompleto: 'crear variable puntos\nasignar puntos valor de 15\nsi puntos es mayor que 10 entonces\n    mostrar "¡Subiste de nivel!"\nsino\n    mostrar "Sigue sumando puntos"\nfin',
    palabrasClave: ['si', 'entonces', 'sino', 'fin', 'condicional', 'if', 'decision'],
  },
  {
    id: 'repetir-veces',
    categoria: 'control',
    etiquetaCorta: 'repetir N veces',
    bloqueScratch: 'Repetir (5) veces ...',
    titulo: 'Repetir una cantidad exacta de veces',
    descripcion: 'Ejecuta las instrucciones interiores el número entero de veces que indiques.',
    plantilla: 'repetir 3 veces\n    mostrar "¡Salto!"\nfin',
    ejemploCompleto: 'crear variable paso\nasignar paso valor de 1\nrepetir 4 veces\n    mostrar paso\n    asignar paso valor de paso + 1\nfin',
    palabrasClave: ['repetir', 'veces', 'ciclo', 'bucle', 'for', 'contar'],
  },
  {
    id: 'mientras-hacer',
    categoria: 'control',
    etiquetaCorta: 'mientras ... hacer',
    bloqueScratch: 'Repetir hasta que no <condición>',
    titulo: 'Repetir mientras algo sea verdadero',
    descripcion: 'Sigue ejecutando el bloque mientras la condición se cumpla. ¡Recuerda actualizar tu variable adentro!',
    plantilla: 'mientras energia es mayor que 0 hacer\n    mostrar energia\n    asignar energia valor de energia - 1\nfin',
    ejemploCompleto: 'crear variable energia\nasignar energia valor de 3\nmientras energia es mayor que 0 hacer\n    mostrar energia\n    asignar energia valor de energia - 1\nfin\nmostrar "¡Despegue!"',
    palabrasClave: ['mientras', 'hacer', 'while', 'bucle', 'condicion'],
  },
  {
    id: 'aleatorio',
    categoria: 'operadores',
    etiquetaCorta: 'número aleatorio',
    bloqueScratch: 'Número al azar entre (1) y (6)',
    titulo: 'Elegir un número aleatorio',
    descripcion: 'Genera un número entero al azar incluyendo ambos extremos (ideal para dados y juegos).',
    plantilla: 'crear variable dado\nasignar dado valor de numero aleatorio entre 1 y 6\nmostrar dado',
    ejemploCompleto: 'crear variable dado\nasignar dado valor de numero aleatorio entre 1 y 6\nmostrar "Salió el número:"\nmostrar dado',
    palabrasClave: ['numero aleatorio entre', 'azar', 'dado', 'random', 'suerte'],
  },
  {
    id: 'comparaciones',
    categoria: 'operadores',
    etiquetaCorta: 'comparar (es mayor que)',
    bloqueScratch: '<(a) = (b)>  o  <(a) > (b)>',
    titulo: 'Comparar valores en español natural',
    descripcion: 'Usa "es igual a", "es diferente de", "es mayor que", "es menor que", "es mayor o igual que" o "es menor o igual que".',
    plantilla: 'mostrar edad es mayor o igual que 10',
    ejemploCompleto: 'crear variable edad\nasignar edad valor de 11\nmostrar edad es igual a 11\nmostrar edad es mayor que 8\nmostrar edad es diferente de 5',
    palabrasClave: ['es igual a', 'es mayor que', 'es menor que', 'es diferente de', 'comparar', 'logico'],
  },
  {
    id: 'logica',
    categoria: 'operadores',
    etiquetaCorta: 'y / o / no',
    bloqueScratch: '<(A) y (B)> · <(A) o (B)> · <no (A)>',
    titulo: 'Combinar condiciones con y, o, no',
    descripcion: 'Une dos preguntas lógicas o invierte verdadero y falso con "no".',
    plantilla: 'si tiene_llave y no esta_cerrado entonces\n    mostrar "¡Puerta abierta!"\nfin',
    ejemploCompleto: 'crear variable tiene_llave\nasignar tiene_llave valor de verdadero\ncrear variable es_de_noche\nasignar es_de_noche valor de falso\nsi tiene_llave y no es_de_noche entonces\n    mostrar "¡A explorar el castillo!"\nfin',
    palabrasClave: ['y', 'o', 'no', 'verdadero', 'falso', 'and', 'or', 'not', 'booleano'],
  },
  {
    id: 'definir-funcion',
    categoria: 'funciones',
    etiquetaCorta: 'definir función',
    bloqueScratch: 'Mis bloques: definir [doble (numero x)]',
    titulo: 'Crear una función que devuelve un valor',
    descripcion: 'Agrupa pasos en una receta con parámetros tipados (numero, texto o logico) y devuelve el resultado.',
    plantilla: 'definir doble(numero x) devuelve numero\n    devolver x * 2\nfin\nmostrar doble(7)',
    ejemploCompleto: 'definir saludar(texto persona) devuelve texto\n    mostrar "¡Hola!"\n    devolver persona\nfin\nmostrar saludar("Camila")',
    palabrasClave: ['definir', 'devuelve', 'devolver', 'funcion', 'parametro', 'mis bloques', 'recursion'],
  },
];
