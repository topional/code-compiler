/**
 * Misiones educativas graduales (inspiradas en Hedy y Pilas Bloques)
 * con verificación automática real sobre la compilación y salida del programa.
 */

import { compilarEdu } from '../engine/compilador';
import { ejecutarIntermedio } from '../engine/interprete';

export interface MisionEdu {
  id: string;
  nivel: number;
  etiquetaNivel: string;
  titulo: string;
  historia: string;
  objetivo: string;
  insignia: string;
  codigoInicial: string;
  pista: string;
  entradasPrueba?: string[];
  verificar: (codigo: string) => Promise<{ completada: boolean; mensaje: string }>;
}

async function evaluar(codigo: string, entradas: string[] = []) {
  const comp = compilarEdu(codigo, 'intermedio');
  if (comp.diagnosticos.length > 0 || !comp.intermedio) {
    return {
      ok: false,
      comp,
      salidas: [] as string[],
      errores: comp.diagnosticos.map((d) => d.mensaje),
    };
  }
  const salidas: string[] = [];
  const errores: string[] = [];
  let idx = 0;
  await ejecutarIntermedio(comp.intermedio, {
    onEvento: (ev) => {
      if (ev.tipo === 'salida') salidas.push(ev.texto);
      if (ev.tipo === 'error') errores.push(...ev.diagnosticos.map((d) => d.mensaje));
    },
    leerEntrada: async () => {
      if (idx >= entradas.length) return '1';
      const v = entradas[idx];
      idx += 1;
      return v;
    },
    maxPasos: 15_000,
  });
  return { ok: errores.length === 0, comp, salidas, errores };
}

export const MISIONES_EDU: MisionEdu[] = [
  {
    id: 'm1-saludo',
    nivel: 1,
    etiquetaNivel: 'Nivel 1 · Variables',
    titulo: 'Tu credencial de explorador',
    historia: 'Chispa necesita saber tu nombre y tu edad para imprimir tu pase al laboratorio.',
    objetivo: 'Crea una variable "nombre" con texto y una variable "edad" con un número, y muestra ambas en pantalla.',
    insignia: 'Explorador de Variables',
    codigoInicial: `# Misión 1: Completa tu credencial
crear variable nombre
asignar nombre valor de "Sofía"
# Crea la variable edad y muestra ambos valores
mostrar nombre`,
    pista: 'Agrega: crear variable edad, asignar edad valor de 10 y mostrar edad.',
    verificar: async (codigo) => {
      const r = await evaluar(codigo);
      if (!r.ok) return { completada: false, mensaje: 'Aún hay errores en el código. Revisa los avisos.' };
      const tieneNombre = r.comp.simbolos.some((s) => s.nombre === 'nombre' && s.tipo === 'texto');
      const tieneEdad = r.comp.simbolos.some((s) => s.nombre === 'edad' && s.tipo === 'numero');
      if (!tieneNombre || !tieneEdad) {
        return {
          completada: false,
          mensaje: 'Asegúrate de declarar "nombre" (texto) y "edad" (numero).',
        };
      }
      if (r.salidas.length < 2) {
        return { completada: false, mensaje: 'Muestra al menos 2 valores con "mostrar".' };
      }
      return { completada: true, mensaje: '¡Credencial emitida! Dominaste tus primeras variables.' };
    },
  },
  {
    id: 'm2-decision',
    nivel: 2,
    etiquetaNivel: 'Nivel 2 · Decisiones',
    titulo: 'El guardián del puente',
    historia: 'Solo los robots con 50 puntos o más pueden cruzar el puente eléctrico.',
    objetivo: 'Usa un bloque "si ... entonces ... sino ... fin" que compare una variable "puntos" con 50 y muestre un mensaje.',
    insignia: 'Estratega del Si/Sino',
    codigoInicial: `# Misión 2: Decide si el robot cruza el puente
crear variable puntos
asignar puntos valor de 65

# Escribe aquí tu si ... entonces ... sino ... fin
`,
    pista: 'Usa: si puntos es mayor o igual que 50 entonces / mostrar "Cruza" / sino / mostrar "Espera" / fin',
    verificar: async (codigo) => {
      const r = await evaluar(codigo);
      if (!r.ok) return { completada: false, mensaje: 'Corrige los errores antes de comprobar la misión.' };
      const usaSi = r.comp.tokens.some((t) => t.tipo === 'SI') && r.comp.tokens.some((t) => t.tipo === 'SINO');
      if (!usaSi) {
        return { completada: false, mensaje: 'Necesitas usar un bloque completo con "si" y "sino".' };
      }
      if (r.salidas.length === 0) {
        return { completada: false, mensaje: 'Muestra un mensaje dentro de la rama elegida.' };
      }
      return { completada: true, mensaje: '¡Puente abierto! Tu programa ya sabe tomar decisiones.' };
    },
  },
  {
    id: 'm3-cohete',
    nivel: 3,
    etiquetaNivel: 'Nivel 3 · Ciclos',
    titulo: 'Cuenta regresiva al espacio',
    historia: 'El cohete Chispa-1 está listo. Haz una cuenta regresiva del 5 al 1 usando un ciclo.',
    objetivo: 'Muestra los números 5, 4, 3, 2, 1 usando "repetir" o "mientras", y termina mostrando "¡Despegue!".',
    insignia: 'Piloto de Ciclos',
    codigoInicial: `# Misión 3: Cuenta regresiva de 5 a 1
crear variable cuenta
asignar cuenta valor de 5

repetir 5 veces
    mostrar cuenta
    asignar cuenta valor de cuenta - 1
fin
# Muestra "¡Despegue!" al final
`,
    pista: 'Agrega mostrar "¡Despegue!" debajo de "fin".',
    verificar: async (codigo) => {
      const r = await evaluar(codigo);
      if (!r.ok) return { completada: false, mensaje: 'Revisa los errores del compilador primero.' };
      const usaCiclo = r.comp.tokens.some((t) => t.tipo === 'REPETIR' || t.tipo === 'MIENTRAS');
      if (!usaCiclo) return { completada: false, mensaje: 'Usa un ciclo "repetir" o "mientras".' };
      const primeros = r.salidas.slice(0, 5);
      const ult = (r.salidas.at(-1) ?? '').toLowerCase();
      if (primeros.join(',') !== '5,4,3,2,1') {
        return { completada: false, mensaje: `Esperaba 5, 4, 3, 2, 1 al inicio y salió: ${primeros.join(', ')}` };
      }
      if (!ult.includes('despegue')) {
        return { completada: false, mensaje: 'Falta mostrar "¡Despegue!" al terminar el conteo.' };
      }
      return { completada: true, mensaje: '¡3, 2, 1, despegue exitoso! Dominas los ciclos.' };
    },
  },
  {
    id: 'm4-dado',
    nivel: 4,
    etiquetaNivel: 'Nivel 4 · Azar',
    titulo: 'El dado encantado',
    historia: 'Crea un dado de 6 caras que lance 3 veces seguidas y muestre cada resultado.',
    objetivo: 'Usa "numero aleatorio entre 1 y 6" dentro de un ciclo "repetir 3 veces".',
    insignia: 'Maestro del Azar',
    codigoInicial: `# Misión 4: Lanza un dado 3 veces
crear variable dado
repetir 3 veces
    asignar dado valor de numero aleatorio entre 1 y 6
    # Muestra el valor de dado aquí
fin`,
    pista: 'Dentro del ciclo agrega: mostrar dado',
    verificar: async (codigo) => {
      const r = await evaluar(codigo);
      if (!r.ok) return { completada: false, mensaje: 'Corrige los errores antes de lanzar el dado.' };
      const usaAleatorio = r.comp.tokens.some((t) => t.tipo === 'ALEATORIO');
      const usaRepetir = r.comp.tokens.some((t) => t.tipo === 'REPETIR');
      if (!usaAleatorio || !usaRepetir) {
        return { completada: false, mensaje: 'Combina "repetir" con "numero aleatorio entre 1 y 6".' };
      }
      const nums = r.salidas.map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x <= 6);
      if (nums.length < 3) {
        return { completada: false, mensaje: 'Debes mostrar al menos 3 tiradas válidas entre 1 y 6.' };
      }
      return { completada: true, mensaje: '¡Triple tirada perfecta! Ya puedes crear juegos con azar.' };
    },
  },
  {
    id: 'm5-funcion',
    nivel: 5,
    etiquetaNivel: 'Nivel 5 · Funciones',
    titulo: 'La fábrica del triple',
    historia: 'En lugar de repetir la misma multiplicación, crea una receta reutilizable.',
    objetivo: 'Define una función "triple(numero n) devuelve numero" que devuelva n * 3 y muestra triple(4) (debe salir 12).',
    insignia: 'Arquitecto de Funciones',
    codigoInicial: `# Misión 5: Crea tu propia función
definir triple(numero n) devuelve numero
    devolver n * 3
fin

# Llama a triple(4) con mostrar
`,
    pista: 'Agrega al final: mostrar triple(4)',
    verificar: async (codigo) => {
      const r = await evaluar(codigo);
      if (!r.ok) return { completada: false, mensaje: 'Hay errores de compilación en tu función.' };
      const tieneFn = r.comp.simbolos.some((s) => s.esFuncion && s.nombre === 'triple');
      if (!tieneFn) return { completada: false, mensaje: 'Define la función llamada "triple".' };
      if (!r.salidas.includes('12')) {
        return { completada: false, mensaje: 'Muestra el resultado de triple(4) para obtener 12.' };
      }
      return { completada: true, mensaje: '¡Fábrica encendida! Creaste tu primera función en .edu.' };
    },
  },
  {
    id: 'm6-cazabugs',
    nivel: 6,
    etiquetaNivel: 'Reto Especial · Detective',
    titulo: '¡Caza los 7 bugs!',
    historia: 'El archivo oficial examples/con_errores.edu tiene exactamente 7 errores semánticos. ¿Puedes repararlos todos hasta que compile limpio?',
    objetivo: 'Corrige los 7 errores sin borrar todo el programa: haz que compile con 0 diagnósticos y muestre resultados válidos.',
    insignia: 'Detective del Compilador',
    codigoInicial: `# Reto Detective: repara los 7 errores semánticos de examples/con_errores.edu
crear variable puntos
asignar puntos valor de 10
asignar puntos valor de "diez"
mostrar vidas
crear variable puntos

si puntos entonces
    mostrar "Ganaste"
fin

definir doble(numero x) devuelve numero
    devolver x * 2
fin
mostrar doble("cinco")
mostrar triple(3)

repetir 2.5 veces
    mostrar "Hola"
fin`,
    pista: 'Revisa cada error con clic en el panel derecho: cambia "diez" por número, declara vidas, quita el duplicado de puntos, compara puntos es mayor que 0, pasa 5 a doble, usa doble(3) y cambia 2.5 por 2.',
    verificar: async (codigo) => {
      const r = await evaluar(codigo);
      if (!r.ok) {
        return {
          completada: false,
          mensaje: `Todavía quedan ${r.comp.diagnosticos.length || r.errores.length} error(es) por cazar.`,
        };
      }
      const tieneDoble = r.comp.simbolos.some((s) => s.esFuncion && s.nombre === 'doble');
      const usaRepetir = r.comp.tokens.some((t) => t.tipo === 'REPETIR');
      if (!tieneDoble || !usaRepetir || r.salidas.length < 3) {
        return {
          completada: false,
          mensaje: 'Repara el programa conservando la función doble, el ciclo repetir y sus salidas.',
        };
      }
      return { completada: true, mensaje: '¡Caso cerrado! Cazaste los 7 bugs como un profesional.' };
    },
  },
];
