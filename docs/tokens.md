# Léxico del lenguaje educativo

Este documento describe el vocabulario léxico actual. El lexer reconoce
tokens; las formas de instrucciones descritas aquí se implementan en el parser.
El lexer no comprueba el orden de los tokens, los tipos ni la ejecución.
El parser comprueba el orden según [la gramática](gramatica.md).

## Palabras reservadas: token → lexema

| Token | Lexema |
| --- | --- |
| CREAR | crear |
| VARIABLE | variable |
| CON | con |
| ASIGNAR | asignar |
| VALOR | valor |
| A | a |
| MOSTRAR | mostrar |
| PREGUNTAR | preguntar |
| GUARDAR | guardar |
| EN | en |
| SI | si |
| ENTONCES | entonces |
| SINO | sino |
| FIN | fin |
| REPETIR | repetir |
| VECES | veces |
| MIENTRAS | mientras |
| HACER | hacer |
| ES | es |
| IGUAL | igual |
| DIFERENTE | diferente |
| DE | de |
| MAYOR | mayor |
| MENOR | menor |
| QUE | que |
| Y | y |
| O | o |
| NO | no |
| VERDADERO | verdadero |
| FALSO | falso |
| DEFINIR | definir |
| DEVUELVE | devuelve |
| DEVOLVER | devolver |
| TIPO_NUMERO | numero |
| TIPO_TEXTO | texto |
| TIPO_LOGICO | logico |
| ALEATORIO | aleatorio |
| ENTRE | entre |
| JUEGO | juego |
| CALCULADORA | calculadora |

Las palabras reservadas se documentan en minúsculas y sin tildes, pero se reconocen
sin distinguir mayúsculas: `mostrar`, `Mostrar` y `MOSTRAR` son MOSTRAR. La opción
`caseInsensitive = true` conserva el lexema original. No se pueden usar como nombres.
Las palabras cortas `a`, `y` y `o` también están reservadas.
`CON` se reconoce como palabra reservada, aunque actualmente no se utiliza en
ninguna regla del parser.

## Otros tokens

| Token | Lexemas o patrón | Ejemplos |
| --- | --- | --- |
| SUMA | `+` | `2 + 3` |
| RESTA | `-` | `edad - 1`, `-5` |
| MULT | `*` | `precio * cantidad` |
| DIV | `/` | `total / 2` |
| PAREN_IZQ | `(` | `sumar(2, 3)` |
| PAREN_DER | `)` | `sumar(2, 3)` |
| COMA | `,` | `sumar(2, 3)` |
| NUMERO | `[0-9]+ ('.' [0-9]+)?` | `0`, `10`, `3.5` |
| TEXTO | Texto entre comillas dobles | `"Hola"`, `"¡Ganaste!"` |
| ID | Letra o `_`, seguida de letras, `_` o dígitos | `puntos`, `año`, `número2` |
| SALTO_LINEA | `\n` o `\r\n` | Separación entre instrucciones |

Los identificadores admiten las letras ASCII y `áéíóúüñÁÉÍÓÚÜÑ`. Las cadenas
pueden contener otros caracteres Unicode. Los nombres distinguen mayúsculas.

NUMERO no incluye el signo: `-5` produce RESTA y NUMERO. Los decimales usan
punto y requieren dígitos a ambos lados. La notación científica no está definida.

TEXTO usa `caseInsensitive = false` para admitir solo los escapes exactos
`\"`, `\\`, `\n`, `\r` y `\t` (por ejemplo, `\N` es inválido); el token conserva
el lexema original. La interpretación de esos escapes se realizará después.
Los saltos reales dentro de las comillas no están permitidos.

Los espacios y tabulaciones se descartan. Los comentarios comienzan con `#`
y llegan hasta el final de la línea. Su salto de línea se conserva. Dentro de
un texto, `#` es un carácter normal. ANTLR agrega EOF al terminar la entrada;
el archivo puede terminar con o sin un salto de línea.

## Formas de las instrucciones

```text
crear variable edad
asignar edad valor de 10
asignar edad valor de 11
asignar edad valor de edad + 1
mostrar edad
mostrar 10
mostrar "Hola"
crear variable nombre
asignar nombre valor de "Ana"
mostrar nombre
preguntar "Edad" guardar en edad

si edad es mayor o igual que 12 entonces
    mostrar "Puedes participar"
sino
    mostrar "Intenta otro reto"
fin

repetir 3 veces
    mostrar "Hola"
fin

mientras edad es menor que 18 hacer
    asignar edad valor de edad + 1
fin

definir sumar(numero primero, numero segundo) devuelve numero
    devolver primero + segundo
fin

mostrar sumar(2, 3)
asignar edad valor de numero aleatorio entre 1 y 3
juego
calculadora
```

Las comparaciones son `es igual a`, `es diferente de`, `es mayor que`,
`es menor que`, `es mayor o igual que` y `es menor o igual que`. Se reconocen como
palabras independientes. El parser las combina y diferencia el `o`
de esas comparaciones del operador lógico. Los operadores lógicos son `y`, `o`, `no`.

La declaración tiene la forma `crear variable NOMBRE`, sin valor inicial.
La asignación tiene la forma `asignar NOMBRE valor de EXPRESIÓN` y establece
un primer valor o reemplaza el valor de una variable existente.
Los incrementos usan una expresión, por ejemplo
`asignar puntos valor de puntos + 1`. `valor` es una palabra reservada y no se
puede usar como nombre de variable o parámetro.

En el análisis semántico, la primera asignación válida determina
si la variable contiene un número, texto o lógico. Usarla antes de darle un
valor es un error de variable no inicializada. Las asignaciones posteriores
deben respetar su tipo. Los enteros y decimales comparten el tipo `numero`.
`mostrar` admite variables, expresiones y valores directos como `10` o `"Hola"`.
El análisis semántico verifica declaraciones, inicialización, tipos,
comparaciones, condiciones, repeticiones, límites aleatorios y funciones; véase
[semantica.md](semantica.md). La ejecución todavía no está implementada.

Los parámetros y resultados de funciones usan `numero`,
`texto` y `logico`. Toda definición usa paréntesis para los parámetros y una
función sin parámetros usa `()`, como en `definir saludo() devuelve texto`.
`devuelve` indica el tipo de resultado y `devolver` entrega el resultado.

La elección aleatoria usa una sola forma: `numero aleatorio entre LIMITE y LIMITE`.
Se utiliza como valor de una asignación:

```text
crear variable dado
asignar dado valor de numero aleatorio entre 1 y 6
crear variable minimo
asignar minimo valor de 1
crear variable maximo
asignar maximo valor de 6
asignar dado valor de numero aleatorio entre minimo y maximo
```

El parser acepta números, números negativos o identificadores como límites.
El semántico exige tipo numérico y, cuando conoce los valores, comprueba que
sean enteros y que el mínimo sea menor o igual al máximo. La variable destino
debe estar declarada y admitir un valor numérico. El rango previsto incluye
ambos extremos. La generación de aleatorios y los controles de valores
desconocidos se implementarán durante la ejecución.

`juego` y `calculadora` son palabras reservadas que el parser acepta como
instrucciones sin argumentos. Su comportamiento de ejecución sigue por definir.
Los programas `examples/calculadora.edu` y `examples/piedra_papel_tijera.edu`
usan variables, entrada/salida y condicionales para expresar esos programas.

## Errores léxicos y pruebas

Los caracteres sin regla, las comillas sin cerrar y los escapes desconocidos
producen errores léxicos. El driver reporta su posición y termina con código 1.
Una combinación de tokens válidos en un orden incorrecto será un error sintáctico;
usar una variable no declarada será un error semántico.

```bash
make probar ARCHIVO=examples/calculadora.edu
make probar ETAPA=lexer ARCHIVO=tests/lexer/validos/palabras_y_nombres.edu
make probar ETAPA=lexer ARCHIVO=tests/lexer/invalidos/caracter.edu
```

Las entradas del lexer se revisan manualmente, comprobando tipos de token,
lexemas, posiciones y errores. `make test` automatiza las entradas de gramática
y semántica. Consulta [la guía de pruebas](../tests/README.md).
