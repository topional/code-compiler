import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { EJEMPLOS_EDU } from '../data/ejemplos';
import { compilarEdu, obtenerPistaPedagogica } from './compilador';
import { ejecutarIntermedio } from './interprete';

const RAIZ = resolve(process.cwd());

function listarEdu(relDir: string): string[] {
  const dir = join(RAIZ, relDir);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.edu'))
    .sort()
    .map((f) => join(dir, f));
}

function codigoEjemplo(id: string): string {
  const ej = EJEMPLOS_EDU.find((e) => e.id === id);
  if (!ej) throw new Error(`Ejemplo '${id}' no encontrado`);
  return ej.codigo;
}

async function correrPrograma(codigo: string, entradas: string[] = []): Promise<{
  salidas: string[];
  preguntas: string[];
  invalidas: string[];
  errores: string[];
}> {
  const comp = compilarEdu(codigo, 'intermedio');
  expect(comp.diagnosticos).toEqual([]);
  expect(comp.intermedio).not.toBeNull();

  const salidas: string[] = [];
  const preguntas: string[] = [];
  const invalidas: string[] = [];
  const errores: string[] = [];
  let idx = 0;

  await ejecutarIntermedio(comp.intermedio!, {
    onEvento: (ev) => {
      if (ev.tipo === 'salida') salidas.push(ev.texto);
      if (ev.tipo === 'pregunta') preguntas.push(ev.mensaje);
      if (ev.tipo === 'entrada_invalida') invalidas.push(ev.mensaje);
      if (ev.tipo === 'error') errores.push(...ev.diagnosticos.map((d) => d.mensaje));
    },
    leerEntrada: async () => {
      if (idx >= entradas.length) return null;
      const val = entradas[idx];
      idx += 1;
      return val;
    },
  });

  return { salidas, preguntas, invalidas, errores };
}

describe('Paridad 100 % con la batería de pruebas .edu del repositorio', () => {
  it('acepta todos los casos válidos de tests/lexer/validos', () => {
    for (const ruta of listarEdu('tests/lexer/validos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'lexer');
      expect(res.diagnosticos, `Falló ${ruta}`).toEqual([]);
    }
  });

  it('rechaza todos los casos inválidos de tests/lexer/invalidos en etapa lexer', () => {
    for (const ruta of listarEdu('tests/lexer/invalidos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'lexer');
      expect(res.diagnosticos.length, `Debió fallar ${ruta}`).toBeGreaterThan(0);
      expect(res.diagnosticos[0].etapa).toBe('lexer');
    }
  });

  it('acepta todos los casos válidos de tests/gramatica/validos', () => {
    for (const ruta of listarEdu('tests/gramatica/validos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'gramatica');
      expect(res.diagnosticos, `Falló ${ruta}`).toEqual([]);
    }
  });

  it('rechaza todos los casos inválidos de tests/gramatica/invalidos en etapa gramatica', () => {
    for (const ruta of listarEdu('tests/gramatica/invalidos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'gramatica');
      expect(res.diagnosticos.length, `Debió fallar ${ruta}`).toBeGreaterThan(0);
      expect(res.diagnosticos[0].etapa).toBe('gramatica');
    }
  });

  it('acepta todos los casos válidos de tests/semantica/validos', () => {
    for (const ruta of listarEdu('tests/semantica/validos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'intermedio');
      expect(res.diagnosticos, `Falló ${ruta}`).toEqual([]);
      expect(res.intermedio?.version).toBe(1);
    }
  });

  it('rechaza todos los casos inválidos de tests/semantica/invalidos en etapa semantica', () => {
    for (const ruta of listarEdu('tests/semantica/invalidos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'semantica');
      expect(res.diagnosticos.length, `Debió fallar ${ruta}`).toBeGreaterThan(0);
      expect(res.diagnosticos[0].etapa).toBe('semantica');
    }
  });
});

describe('Ejecución exacta de programas .edu (examples/ y catálogo)', () => {
  it('ejecuta programa básico de variables, decisiones y repetir', async () => {
    const codigo = `# Programa básico: variables, operaciones, decisiones y repeticiones.
crear variable nombre
asignar nombre valor de "Ana"
crear variable edad
asignar edad valor de 12

mostrar "Hola"
mostrar nombre
mostrar "El próximo año tendrás"
mostrar edad + 1

si edad es mayor o igual que 12 entonces
    mostrar "Ya puedes programar con texto"
sino
    mostrar "Practica primero con bloques"
fin

crear variable contador
asignar contador valor de 1
repetir 3 veces
    mostrar contador
    asignar contador valor de contador + 1
fin`;
    const res = await correrPrograma(codigo);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual([
      'Hola',
      'Ana',
      'El próximo año tendrás',
      '13',
      'Ya puedes programar con texto',
      '1',
      '2',
      '3',
    ]);
  });

  it('ejecuta programa avanzado (recursión, lógica y ciclos anidados)', async () => {
    const codigo = `# Programa avanzado: recursión, funciones lógicas y ciclos anidados.
definir factorial(numero n) devuelve numero
    si n es menor o igual que 1 entonces
        devolver 1
    fin
    devolver n * factorial(n - 1)
fin

definir fibonacci(numero n) devuelve numero
    si n es menor que 2 entonces
        devolver n
    fin
    devolver fibonacci(n - 1) + fibonacci(n - 2)
fin

definir es_par(numero n) devuelve logico
    si n es igual a 0 entonces
        devolver verdadero
    fin
    devolver no es_par(n - 1)
fin

definir clasificar(numero n) devuelve texto
    si es_par(n) entonces
        devolver "par"
    fin
    devolver "impar"
fin

mostrar "n, factorial, fibonacci y paridad"
crear variable i
asignar i valor de 1
mientras i es menor o igual que 5 hacer
    mostrar i
    mostrar factorial(i)
    mostrar fibonacci(i)
    mostrar clasificar(i)
    si i es igual a 1 o i es igual a 5 entonces
        mostrar "extremo"
    fin
    asignar i valor de i + 1
fin

mostrar "Tabla de multiplicar de 3 x 3"
crear variable fila
asignar fila valor de 1
crear variable columna
repetir 3 veces
    asignar columna valor de 1
    repetir 3 veces
        mostrar fila * columna
        asignar columna valor de columna + 1
    fin
    asignar fila valor de fila + 1
fin`;
    const res = await correrPrograma(codigo);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual([
      'n, factorial, fibonacci y paridad',
      '1', '1', '1', 'impar', 'extremo',
      '2', '2', '1', 'par',
      '3', '6', '2', 'impar',
      '4', '24', '3', 'par',
      '5', '120', '5', 'impar', 'extremo',
      'Tabla de multiplicar de 3 x 3',
      '1', '2', '3', '2', '4', '6', '3', '6', '9',
    ]);
  });

  it('ejecuta los nuevos juegos 2D del catálogo (duelo_rpg, mision_cohete y dado_magico)', async () => {
    const cohete = await correrPrograma(codigoEjemplo('mision_cohete'));
    expect(cohete.errores).toEqual([]);
    expect(cohete.salidas).toEqual([
      '¡Cohete listo en la plataforma!',
      'Nova',
      '5', '4', '3', '2', '1',
      '¡DESPEGUE AL ESPACIO!',
    ]);

    const dado = await correrPrograma(codigoEjemplo('basico'));
    expect(dado.errores).toEqual([]);
    expect(dado.salidas[0]).toBe('¡Bienvenido a Chispa!');

    const rpg = await correrPrograma(codigoEjemplo('duelo_rpg'), ['1', '1', '1', '1', '1', '1', '1', '1']);
    expect(rpg.errores).toEqual([]);
    expect(rpg.salidas[0]).toBe('¡Un Slime Rey salvaje apareció!');
  });

  it('ejecuta examples/calculadora.edu con reintento de entrada inválida', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/calculadora.edu'), 'utf-8');
    const res = await correrPrograma(codigo, ['1', 'mayonesa', '8', '5']);
    expect(res.errores).toEqual([]);
    expect(res.invalidas.length).toBe(1);
    expect(res.salidas[0]).toBe('Calculadora');
    expect(res.salidas.at(-1)).toBe('13');
  });

  it('ejecuta principal.edu (Adivina el número)', async () => {
    const intentos = Array.from({ length: 10 }, (_, i) => String(i + 1));
    const res = await correrPrograma(codigoEjemplo('principal'), intentos);
    expect(res.errores).toEqual([]);
    expect(res.salidas[0]).toBe('Adivina el número del 1 al 10');
    expect(res.salidas.at(-2)).toBe('¡Adivinaste! Intentos usados:');
    const usados = Number(res.salidas.at(-1));
    expect(usados).toBeGreaterThanOrEqual(1);
    expect(usados).toBeLessThanOrEqual(10);
  });

  it('ejecuta examples/piedra_papel_tijera.edu', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/piedra_papel_tijera.edu'), 'utf-8');
    const res = await correrPrograma(codigo, ['1']);
    expect(res.errores).toEqual([]);
    expect(['Empate', 'Ganaste', 'Perdiste']).toContain(res.salidas.at(-1));
  });

  it('detecta los 7 errores semánticos exactos de depuración', () => {
    const codigo = `crear variable puntos
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
fin`;
    const res = compilarEdu(codigo, 'intermedio');
    expect(res.intermedio).toBeNull();
    expect(res.diagnosticos.length).toBe(7);
    expect(res.diagnosticos.every((d) => d.etapa === 'semantica')).toBe(true);
  });

  it('detecta cuando preguntar y guardar en están en líneas separadas y los une en 1 clic', () => {
    const codigoPartido = `crear variable numero1
preguntar "¿Cual es tu numero?"
guardar en numero1`;
    const comp = compilarEdu(codigoPartido, 'intermedio');
    expect(comp.diagnosticos.length).toBeGreaterThan(0);
    const pista = obtenerPistaPedagogica(comp.diagnosticos[0], codigoPartido);
    expect(pista.titulo).toContain('misma línea');
    expect(pista.autoFix).toBeDefined();

    const unido = pista.autoFix!.aplicar(codigoPartido);
    const comp2 = compilarEdu(unido, 'intermedio');
    expect(comp2.diagnosticos).toEqual([]);
  });

  it('detecta el error de preguntar + suma y ofrece autoFix en 1 clic que compila y suma bien', async () => {
    const codigoCompanero = `crear variable numero1
preguntar "¿Cuál es tu número?" guardar en numero1
mostrar numero1
crear variable numeroPrueba
asignar numeroPrueba valor de 5
crear variable numeroFinal
asignar numeroFinal valor de numero1 + numeroPrueba
mostrar numeroFinal`;
    const comp = compilarEdu(codigoCompanero, 'intermedio');
    expect(comp.diagnosticos.length).toBeGreaterThan(0);
    const pista = obtenerPistaPedagogica(comp.diagnosticos[0], codigoCompanero);
    expect(pista.titulo).toContain('numero1');
    expect(pista.autoFix).toBeDefined();

    const codigoArreglado = pista.autoFix!.aplicar(codigoCompanero);
    const res = await correrPrograma(codigoArreglado, ['7']);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual(['7', '12']);
  });

  it('maneja aritmética racional exacta y ámbitos léxicos en recursión', async () => {
    const res = await correrPrograma(`
crear variable local
asignar local valor de 99
definir exterior(numero nivel) devuelve numero
    crear variable local
    asignar local valor de nivel
    definir leer_local() devuelve numero
        definir sumar(numero incremento) devuelve numero
            asignar local valor de local + incremento
            devolver local
        fin
        devolver sumar(1)
    fin
    si nivel es igual a 0 entonces
        crear variable local
        asignar local valor de 100
        devolver leer_local()
    fin
    devolver leer_local() + exterior(nivel - 1) + leer_local()
fin
mostrar exterior(3)
mostrar local
mostrar 3 / 2
`);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual(['22', '99', '3/2']);
  });
});
