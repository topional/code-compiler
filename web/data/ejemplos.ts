/**
 * Programas oficiales de `examples/` + plantilla de bienvenida rápida.
 * Cada código fuente coincide exactamente con los archivos `.edu` del repositorio.
 */

export interface EjemploEdu {
  id: string;
  titulo: string;
  subtitulo: string;
  nivel: 'Inicio' | 'Intermedio' | 'Avanzado' | 'Reto';
  archivo: string;
  etiquetas: string[];
  codigo: string;
}

export const CODIGO_HERO_DEFAULT = `# ¡Tu primer código en español!
crear variable nombre
asignar nombre valor de "Explorador"
crear variable dado
asignar dado valor de numero aleatorio entre 1 y 6

mostrar "¡Hola, bienvenido a Chispa .edu!"
mostrar nombre
mostrar "Lanzando tu dado mágico..."
mostrar dado

si dado es mayor o igual que 4 entonces
    mostrar "¡Súper tirada! Ganaste una estrella"
sino
    mostrar "¡Buen intento! Vuelve a lanzar"
fin`;

export const EJEMPLOS_EDU: EjemploEdu[] = [
  {
    id: 'basico',
    titulo: 'Hola y primer ciclo',
    subtitulo: 'Variables, decisiones y un contador con repetir',
    nivel: 'Inicio',
    archivo: 'examples/basico.edu',
    etiquetas: ['variables', 'si/sino', 'repetir'],
    codigo: `# Programa básico: variables, operaciones, decisiones y repeticiones.
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
fin`,
  },
  {
    id: 'principal',
    titulo: 'Adivina el número',
    subtitulo: 'El clásico juego de Scratch escrito en texto',
    nivel: 'Intermedio',
    archivo: 'examples/principal.edu',
    etiquetas: ['juego', 'aleatorio', 'funciones', 'preguntar'],
    codigo: `# Adivina el número: el proyecto clásico de Scratch escrito con texto.
# Usa funciones, números aleatorios, entrada, ciclos y decisiones.
definir pista(numero intento, numero secreto) devuelve texto
    si intento es menor que secreto entonces
        devolver "Es mayor"
    sino
        devolver "Es menor"
    fin
fin

definir acerto(numero intento, numero secreto) devuelve logico
    devolver intento es igual a secreto
fin

crear variable secreto
asignar secreto valor de numero aleatorio entre 1 y 10
crear variable intento
asignar intento valor de 0
crear variable intentos
asignar intentos valor de 0
crear variable terminado
asignar terminado valor de falso

mostrar "Adivina el número del 1 al 10"
mientras no terminado hacer
    preguntar "Tu número" guardar en intento
    asignar intentos valor de intentos + 1
    si acerto(intento, secreto) entonces
        asignar terminado valor de verdadero
    sino
        mostrar pista(intento, secreto)
    fin
fin

mostrar "¡Adivinaste! Intentos usados:"
mostrar intentos`,
  },
  {
    id: 'piedra_papel_tijera',
    titulo: 'Piedra, papel o tijera',
    subtitulo: 'Duelo interactivo contra la computadora',
    nivel: 'Intermedio',
    archivo: 'examples/piedra_papel_tijera.edu',
    etiquetas: ['juego', 'aleatorio', 'lógica'],
    codigo: `# Una partida: 1 = piedra, 2 = papel, 3 = tijera.
crear variable jugador
asignar jugador valor de 0

crear variable computadora
asignar computadora valor de numero aleatorio entre 1 y 3

mostrar "Piedra, papel o tijera"
mostrar "1: Piedra"
mostrar "2: Papel"
mostrar "3: Tijera"

preguntar "Elige una opcion" guardar en jugador

si jugador es igual a 1 o jugador es igual a 2 o jugador es igual a 3 entonces
    mostrar "La computadora eligio:"

    si computadora es igual a 1 entonces
        mostrar "Piedra"
    sino
        si computadora es igual a 2 entonces
            mostrar "Papel"
        sino
            mostrar "Tijera"
        fin
    fin

    si jugador es igual a computadora entonces
        mostrar "Empate"
    sino
        si (jugador es igual a 1 y computadora es igual a 3) o (jugador es igual a 2 y computadora es igual a 1) o (jugador es igual a 3 y computadora es igual a 2) entonces
            mostrar "Ganaste"
        sino
            mostrar "Perdiste"
        fin
    fin
sino
    mostrar "Opcion invalida. Debes elegir 1, 2 o 3"
fin`,
  },
  {
    id: 'calculadora',
    titulo: 'Calculadora interactiva',
    subtitulo: 'Suma, resta, multiplica y divide cuidando el cero',
    nivel: 'Intermedio',
    archivo: 'examples/calculadora.edu',
    etiquetas: ['matemática', 'preguntar', 'si/sino'],
    codigo: `# Calculadora de una operacion con dos numeros.
crear variable opcion
asignar opcion valor de 0

crear variable primero
asignar primero valor de 0

crear variable segundo
asignar segundo valor de 0

mostrar "Calculadora"
mostrar "1: Suma"
mostrar "2: Resta"
mostrar "3: Multiplicacion"
mostrar "4: Division"

preguntar "Elige una operacion" guardar en opcion

si opcion es igual a 1 o opcion es igual a 2 o opcion es igual a 3 o opcion es igual a 4 entonces
    preguntar "Escribe el primer numero" guardar en primero
    preguntar "Escribe el segundo numero" guardar en segundo

    mostrar "Resultado:"

    si opcion es igual a 1 entonces
        mostrar primero + segundo
    sino
        si opcion es igual a 2 entonces
            mostrar primero - segundo
        sino
            si opcion es igual a 3 entonces
                mostrar primero * segundo
            sino
                si segundo es igual a 0 entonces
                    mostrar "No se puede dividir entre cero"
                sino
                    mostrar primero / segundo
                fin
            fin
        fin
    fin
sino
    mostrar "Opcion invalida. Debes elegir 1, 2, 3 o 4"
fin`,
  },
  {
    id: 'avanzado',
    titulo: 'Laboratorio de recursión',
    subtitulo: 'Factorial, Fibonacci, paridad y tabla de multiplicar',
    nivel: 'Avanzado',
    archivo: 'examples/avanzado.edu',
    etiquetas: ['funciones', 'recursión', 'ciclos anidados'],
    codigo: `# Programa avanzado: recursión, funciones lógicas y ciclos anidados.
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
fin`,
  },
  {
    id: 'con_errores',
    titulo: '¡Caza los 7 errores!',
    subtitulo: 'Programa con 7 errores semánticos para aprender a depurar',
    nivel: 'Reto',
    archivo: 'examples/con_errores.edu',
    etiquetas: ['depuración', 'semántica', 'tipos'],
    codigo: `# Programa con errores: el compilador los detecta todos y no genera código.
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
  },
];
