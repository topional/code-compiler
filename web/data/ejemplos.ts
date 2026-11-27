/**
 * Juegos 2D interactivos y proyectos de práctica listos para jugar y modificar en Code Compiler.
 */

export interface EjemploEdu {
  id: string;
  titulo: string;
  subtitulo: string;
  nivel: 'Inicio' | 'Intermedio' | 'Avanzado' | 'Reto';
  archivo: string;
  escena?: 'rpg' | 'aventura' | 'torneo' | 'cohete' | 'chispa';
  etiquetas: string[];
  codigo: string;
}

export const CODIGO_HERO_DEFAULT = `# ¡Tu primer juego del Dado Mágico!
crear variable nombre
asignar nombre valor de "Explorador"
crear variable dado
asignar dado valor de numero aleatorio entre 1 y 6

mostrar "¡Bienvenido a Chispa!"
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
    id: 'duelo_rpg',
    titulo: 'Duelo RPG Chispa',
    subtitulo: 'Batalla 2D estilo Pokémon con ataques, pociones y barras de vida',
    nivel: 'Inicio',
    archivo: 'duelo_rpg',
    escena: 'rpg',
    etiquetas: ['juego 2D', 'RPG', 'azar'],
    codigo: `# ¡Duelo RPG estilo Pokémon! Edita la vida o el ataque y prueba tu estrategia
crear variable vida_heroe
asignar vida_heroe valor de 100
crear variable vida_rival
asignar vida_rival valor de 80
crear variable jugada
asignar jugada valor de 0
crear variable dano
asignar dano valor de 0

mostrar "¡Un Slime Rey salvaje apareció!"
mientras vida_heroe es mayor que 0 y vida_rival es mayor que 0 hacer
    mostrar "1: Rayo Chispa | 2: Llamarada | 3: Pocion (+25)"
    preguntar "Elige tu ataque (1, 2 o 3)" guardar en jugada
    si jugada es igual a 1 entonces
        asignar dano valor de numero aleatorio entre 18 y 28
        asignar vida_rival valor de vida_rival - dano
        mostrar "¡Usaste Rayo Chispa!"
        mostrar dano
    sino
        si jugada es igual a 2 entonces
            asignar dano valor de numero aleatorio entre 12 y 38
            asignar vida_rival valor de vida_rival - dano
            mostrar "¡Llamarada solar!"
            mostrar dano
        sino
            asignar vida_heroe valor de vida_heroe + 25
            mostrar "¡Poción mágica! +25 vida"
        fin
    fin
    si vida_rival es mayor que 0 entonces
        asignar dano valor de numero aleatorio entre 10 y 22
        asignar vida_heroe valor de vida_heroe - dano
        mostrar "¡Slime Rey contraataca!"
        mostrar dano
    fin
fin

si vida_rival es menor o igual que 0 entonces
    mostrar "¡Victoria! Derrotaste al Slime Rey"
sino
    mostrar "¡Buen combate! Edita tu ataque y vuelve a intentar"
fin`,
  },
  {
    id: 'piedra_papel_tijera',
    titulo: 'Torneo Piedra, Papel o Tijera',
    subtitulo: 'Duelo arcade 2D animado contra el rival de la computadora',
    nivel: 'Inicio',
    archivo: 'piedra_papel_tijera',
    escena: 'torneo',
    etiquetas: ['juego 2D', 'arcade', 'lógica'],
    codigo: `# Torneo arcade: 1 = piedra, 2 = papel, 3 = tijera.
crear variable jugador
asignar jugador valor de 0

crear variable computadora
asignar computadora valor de numero aleatorio entre 1 y 3

mostrar "Piedra, papel o tijera"
mostrar "1: Piedra | 2: Papel | 3: Tijera"

preguntar "Elige tu jugada (1, 2 o 3)" guardar en jugador

si jugador es igual a 1 o jugador es igual a 2 o jugador es igual a 3 entonces
    mostrar "El rival eligió:"

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
        mostrar "¡Empate!"
    sino
        si (jugador es igual a 1 y computadora es igual a 3) o (jugador es igual a 2 y computadora es igual a 1) o (jugador es igual a 3 y computadora es igual a 2) entonces
            mostrar "¡Ganaste el torneo!"
        sino
            mostrar "Perdiste esta ronda, ¡intenta otra vez!"
        fin
    fin
sino
    mostrar "Elige 1, 2 o 3 para jugar"
fin`,
  },
  {
    id: 'mision_cohete',
    titulo: 'Despegue Espacial 3-2-1',
    subtitulo: 'Cuenta regresiva animada para lanzar el cohete Chispa-1 al espacio',
    nivel: 'Inicio',
    archivo: 'mision_cohete',
    escena: 'cohete',
    etiquetas: ['juego 2D', 'repetir', 'cohete'],
    codigo: `# ¡Programa el despegue del cohete Chispa-1!
crear variable piloto
asignar piloto valor de "Nova"
crear variable cuenta
asignar cuenta valor de 5

mostrar "¡Cohete listo en la plataforma!"
mostrar piloto
repetir 5 veces
    mostrar cuenta
    asignar cuenta valor de cuenta - 1
fin
mostrar "¡DESPEGUE AL ESPACIO!"`,
  },
  {
    id: 'principal',
    titulo: 'Adivina el número secreto',
    subtitulo: 'El clásico juego de pistas con números aleatorios y ciclos',
    nivel: 'Intermedio',
    archivo: 'adivina_numero',
    escena: 'chispa',
    etiquetas: ['juego 2D', 'azar', 'funciones'],
    codigo: `# Adivina el número secreto del 1 al 10 con pistas en vivo
definir pista(numero intento, numero secreto) devuelve texto
    si intento es menor que secreto entonces
        devolver "Pista: es un número más grande"
    sino
        devolver "Pista: es un número más pequeño"
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
    preguntar "Tu número (1 al 10)" guardar en intento
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
    id: 'basico',
    titulo: 'Aventura del Dado Mágico',
    subtitulo: 'Variables, decisiones y un tablero interactivo con dado',
    nivel: 'Inicio',
    archivo: 'dado_magico',
    escena: 'aventura',
    etiquetas: ['juego 2D', 'variables', 'si/sino'],
    codigo: CODIGO_HERO_DEFAULT,
  },
  {
    id: 'calculadora',
    titulo: 'Calculadora Mágica',
    subtitulo: 'Suma, resta, multiplica y divide cuidando el cero',
    nivel: 'Intermedio',
    archivo: 'calculadora',
    escena: 'chispa',
    etiquetas: ['matemática', 'preguntar', 'si/sino'],
    codigo: `# Calculadora mágica con 4 operaciones
crear variable opcion
asignar opcion valor de 0

crear variable primero
asignar primero valor de 0

crear variable segundo
asignar segundo valor de 0

mostrar "Calculadora Mágica"
mostrar "1: Suma | 2: Resta | 3: Multiplicar | 4: Dividir"

preguntar "Elige una operacion (1 a 4)" guardar en opcion

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
    mostrar "Elige 1, 2, 3 o 4"
fin`,
  },
];
