# Léxico del lenguaje educativo

Esta es la versión inicial completa del vocabulario léxico. El lexer reconoce
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
preguntar "Edad" y guardar en edad

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

definir sumar con numero primero, numero segundo devuelve numero
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
`mostrar` admitirá variables, expresiones y valores directos como `10` o `"Hola"`.
El análisis semántico parcial verifica tipos en asignaciones/operaciones,
inicialización, variables no declaradas y declaraciones duplicadas; véase
[semantica.md](semantica.md). La ejecución todavía no está implementada.

Los parámetros y resultados de funciones usan `numero`,
`texto` y `logico`. Las funciones sin parámetros podrán omitir `con ...`.
`devuelve` indica el tipo de resultado y `devolver` entrega el resultado.

La elección aleatoria usa una sola forma: `numero aleatorio entre LIMITE y LIMITE`.
Se utiliza como valor de una asignación:

```text
crear variable dado
asignar dado valor de numero aleatorio entre 1 y 6
asignar dado valor de numero aleatorio entre minimo y maximo
```

Los límites podrán ser números enteros o variables que contengan enteros.
El rango incluirá ambos extremos y el límite inicial deberá ser menor o igual
al final. La variable destino deberá estar declarada y admitir un valor numérico.
El parser comprueba la estructura; el análisis semántico y la ejecución
comprobarán los valores y tipos según estén disponibles. Por ahora, el lexer
reconoce las palabras y valores y el parser valida su orden; no comprueban esas restricciones ni generan
números aleatorios. `elegir` deja de ser una palabra reservada.

`juego` y `calculadora` serán instrucciones de motivación incorporadas que
mostrarán un minijuego y una calculadora, respectivamente. El lenguaje también
permite escribir calculadoras y juegos sencillos usando las construcciones
generales. El comportamiento de esas instrucciones y la operación aleatoria
se implementarán en el entorno de ejecución; por ahora se valida su sintaxis.

## Errores léxicos y pruebas

Los caracteres sin regla, las comillas sin cerrar y los escapes desconocidos
producen errores léxicos. El driver reporta su posición y termina con código 1.
Una combinación de tokens válidos en un orden incorrecto será un error sintáctico;
usar una variable no declarada será un error semántico.

```bash
make test
make probar ARCHIVO=examples/lexer_completo.edu
make probar ARCHIVO=tests/fixtures/invalid/caracter.edu
```
