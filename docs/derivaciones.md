# Ejemplos y derivaciones por la izquierda

Se aplica la [gramática completa](gramatica.md). En cada paso `⇒` se sustituye
solo el **no terminal más a la izquierda**; `ε` no añade ningún terminal.
Las derivaciones terminan en categorías de tokens: `id` no se deriva a `edad`,
ni `num` a `10`; esos lexemas los reconoce el lexer y aparecen en el ejemplo.
`nl` representa un salto de línea y `eof` el final del archivo.

Se muestran cuatro derivaciones por familia y un quinto ejemplo descriptivo.
Cada construcción usa como símbolo inicial el no terminal indicado. Para
expresiones incluidas en `mostrar` se deriva solo la expresión indicada; para
números aleatorios incluidos en una asignación se deriva solo `expresionAleatoria`.
Para bloques se deriva el contenido desde el salto posterior al encabezado,
sin incluir el `si` ni el `fin` exteriores.

Variantes que solo cambian nombres, literales o mayúsculas pueden tener la misma
derivación de tokens. En `motivacion` existen solo dos alternativas estructurales;
los cuatro ejemplos ilustran ambas y el reconocimiento sin distinguir mayúsculas.

## Declaración

Símbolo inicial: `declaracion`.

### Ejemplo 1

```text
crear variable edad
```

```text
declaracion
⇒ crear variable id
```

### Ejemplo 2

```text
crear variable nombre
```

```text
declaracion
⇒ crear variable id
```

### Ejemplo 3

```text
crear variable puntos2
```

```text
declaracion
⇒ crear variable id
```

### Ejemplo 4

```text
CREAR VARIABLE año
```

```text
declaracion
⇒ crear variable id
```

Quinto ejemplo para la descripción de la construcción:

```text
crear variable _contador
```

## Asignación

Símbolo inicial: `asignacion`.

### Ejemplo 1

```text
asignar edad valor de 10
```

```text
asignacion
⇒ asignar id valor de expresion
⇒ asignar id valor de disyuncion
⇒ asignar id valor de conjuncion restoO
⇒ asignar id valor de negacion restoY restoO
⇒ asignar id valor de comparacion restoY restoO
⇒ asignar id valor de suma comparacionOpt restoY restoO
⇒ asignar id valor de producto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de num restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de num restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de num comparacionOpt restoY restoO
⇒ asignar id valor de num restoY restoO
⇒ asignar id valor de num restoO
⇒ asignar id valor de num
```

### Ejemplo 2

```text
asignar precio valor de 3.5
```

```text
asignacion
⇒ asignar id valor de expresion
⇒ asignar id valor de disyuncion
⇒ asignar id valor de conjuncion restoO
⇒ asignar id valor de negacion restoY restoO
⇒ asignar id valor de comparacion restoY restoO
⇒ asignar id valor de suma comparacionOpt restoY restoO
⇒ asignar id valor de producto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de num restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de num restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de num comparacionOpt restoY restoO
⇒ asignar id valor de num restoY restoO
⇒ asignar id valor de num restoO
⇒ asignar id valor de num
```

### Ejemplo 3

```text
asignar nombre valor de "Ana"
```

```text
asignacion
⇒ asignar id valor de expresion
⇒ asignar id valor de disyuncion
⇒ asignar id valor de conjuncion restoO
⇒ asignar id valor de negacion restoY restoO
⇒ asignar id valor de comparacion restoY restoO
⇒ asignar id valor de suma comparacionOpt restoY restoO
⇒ asignar id valor de producto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de cad restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de cad restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de cad comparacionOpt restoY restoO
⇒ asignar id valor de cad restoY restoO
⇒ asignar id valor de cad restoO
⇒ asignar id valor de cad
```

### Ejemplo 4

```text
asignar copia valor de edad
```

```text
asignacion
⇒ asignar id valor de expresion
⇒ asignar id valor de disyuncion
⇒ asignar id valor de conjuncion restoO
⇒ asignar id valor de negacion restoY restoO
⇒ asignar id valor de comparacion restoY restoO
⇒ asignar id valor de suma comparacionOpt restoY restoO
⇒ asignar id valor de producto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de id restoProducto restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de id restoSuma comparacionOpt restoY restoO
⇒ asignar id valor de id comparacionOpt restoY restoO
⇒ asignar id valor de id restoY restoO
⇒ asignar id valor de id restoO
⇒ asignar id valor de id
```

Quinto ejemplo para la descripción de la construcción:

```text
asignar puntos valor de puntos + 1
```

## Salida

Símbolo inicial: `salida`.

### Ejemplo 1

```text
mostrar 10
```

```text
salida
⇒ mostrar expresion
⇒ mostrar disyuncion
⇒ mostrar conjuncion restoO
⇒ mostrar negacion restoY restoO
⇒ mostrar comparacion restoY restoO
⇒ mostrar suma comparacionOpt restoY restoO
⇒ mostrar producto restoSuma comparacionOpt restoY restoO
⇒ mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num restoSuma comparacionOpt restoY restoO
⇒ mostrar num comparacionOpt restoY restoO
⇒ mostrar num restoY restoO
⇒ mostrar num restoO
⇒ mostrar num
```

### Ejemplo 2

```text
mostrar "Hola"
```

```text
salida
⇒ mostrar expresion
⇒ mostrar disyuncion
⇒ mostrar conjuncion restoO
⇒ mostrar negacion restoY restoO
⇒ mostrar comparacion restoY restoO
⇒ mostrar suma comparacionOpt restoY restoO
⇒ mostrar producto restoSuma comparacionOpt restoY restoO
⇒ mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar cad restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar cad restoSuma comparacionOpt restoY restoO
⇒ mostrar cad comparacionOpt restoY restoO
⇒ mostrar cad restoY restoO
⇒ mostrar cad restoO
⇒ mostrar cad
```

### Ejemplo 3

```text
mostrar edad
```

```text
salida
⇒ mostrar expresion
⇒ mostrar disyuncion
⇒ mostrar conjuncion restoO
⇒ mostrar negacion restoY restoO
⇒ mostrar comparacion restoY restoO
⇒ mostrar suma comparacionOpt restoY restoO
⇒ mostrar producto restoSuma comparacionOpt restoY restoO
⇒ mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar id restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar id restoSuma comparacionOpt restoY restoO
⇒ mostrar id comparacionOpt restoY restoO
⇒ mostrar id restoY restoO
⇒ mostrar id restoO
⇒ mostrar id
```

### Ejemplo 4

```text
mostrar 2 + 3
```

```text
salida
⇒ mostrar expresion
⇒ mostrar disyuncion
⇒ mostrar conjuncion restoO
⇒ mostrar negacion restoY restoO
⇒ mostrar comparacion restoY restoO
⇒ mostrar suma comparacionOpt restoY restoO
⇒ mostrar producto restoSuma comparacionOpt restoY restoO
⇒ mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num restoSuma comparacionOpt restoY restoO
⇒ mostrar num + producto restoSuma comparacionOpt restoY restoO
⇒ mostrar num + unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num + primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num + num restoProducto restoSuma comparacionOpt restoY restoO
⇒ mostrar num + num restoSuma comparacionOpt restoY restoO
⇒ mostrar num + num comparacionOpt restoY restoO
⇒ mostrar num + num restoY restoO
⇒ mostrar num + num restoO
⇒ mostrar num + num
```

Quinto ejemplo para la descripción de la construcción:

```text
mostrar sumar(2, 3)
```

## Entrada

Símbolo inicial: `entrada`.

### Ejemplo 1

```text
preguntar "Edad" y guardar en edad
```

```text
entrada
⇒ preguntar cad y guardar en id
```

### Ejemplo 2

```text
preguntar "Nombre" y guardar en nombre
```

```text
entrada
⇒ preguntar cad y guardar en id
```

### Ejemplo 3

```text
preguntar "Respuesta" y guardar en respuesta
```

```text
entrada
⇒ preguntar cad y guardar en id
```

### Ejemplo 4

```text
PREGUNTAR "Puntos" Y GUARDAR EN puntos
```

```text
entrada
⇒ preguntar cad y guardar en id
```

Quinto ejemplo para la descripción de la construcción:

```text
preguntar "Resultado" y guardar en resultado
```

## Condicional

Símbolo inicial: `condicional`.

### Ejemplo 1

```text
si verdadero entonces
mostrar 1
fin
```

```text
condicional
⇒ si expresion entonces bloque alternativa fin
⇒ si disyuncion entonces bloque alternativa fin
⇒ si conjuncion restoO entonces bloque alternativa fin
⇒ si negacion restoY restoO entonces bloque alternativa fin
⇒ si comparacion restoY restoO entonces bloque alternativa fin
⇒ si suma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si producto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si unaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si primaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoO entonces bloque alternativa fin
⇒ si verdadero entonces bloque alternativa fin
⇒ si verdadero entonces lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl saltosOpt instruccionesBloque alternativa fin
⇒ si verdadero entonces nl instruccionesBloque alternativa fin
⇒ si verdadero entonces nl sentencia lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl salida lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar expresion lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar disyuncion lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar conjuncion restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar negacion restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar comparacion restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num restoY restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num restoO lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num nl saltosOpt instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num nl instruccionesBloque alternativa fin
⇒ si verdadero entonces nl mostrar num nl alternativa fin
⇒ si verdadero entonces nl mostrar num nl fin
```

### Ejemplo 2

```text
si edad es mayor que 10 entonces
mostrar edad
fin
```

```text
condicional
⇒ si expresion entonces bloque alternativa fin
⇒ si disyuncion entonces bloque alternativa fin
⇒ si conjuncion restoO entonces bloque alternativa fin
⇒ si negacion restoY restoO entonces bloque alternativa fin
⇒ si comparacion restoY restoO entonces bloque alternativa fin
⇒ si suma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si producto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si unaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si primaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si id restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si id restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si id comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si id operadorComparacion suma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que suma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que producto restoSuma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que unaria restoProducto restoSuma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que primaria restoProducto restoSuma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que num restoProducto restoSuma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que num restoSuma restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que num restoY restoO entonces bloque alternativa fin
⇒ si id es mayor que num restoO entonces bloque alternativa fin
⇒ si id es mayor que num entonces bloque alternativa fin
⇒ si id es mayor que num entonces lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl saltosOpt instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl sentencia lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl salida lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar expresion lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar disyuncion lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar conjuncion restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar negacion restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar comparacion restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id restoY restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id restoO lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id lineas instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id nl saltosOpt instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id nl instruccionesBloque alternativa fin
⇒ si id es mayor que num entonces nl mostrar id nl alternativa fin
⇒ si id es mayor que num entonces nl mostrar id nl fin
```

### Ejemplo 3

```text
si falso entonces
mostrar 1
sino
mostrar 2
fin
```

```text
condicional
⇒ si expresion entonces bloque alternativa fin
⇒ si disyuncion entonces bloque alternativa fin
⇒ si conjuncion restoO entonces bloque alternativa fin
⇒ si negacion restoY restoO entonces bloque alternativa fin
⇒ si comparacion restoY restoO entonces bloque alternativa fin
⇒ si suma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si producto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si unaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si primaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si falso restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si falso restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si falso comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si falso restoY restoO entonces bloque alternativa fin
⇒ si falso restoO entonces bloque alternativa fin
⇒ si falso entonces bloque alternativa fin
⇒ si falso entonces lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl saltosOpt instruccionesBloque alternativa fin
⇒ si falso entonces nl instruccionesBloque alternativa fin
⇒ si falso entonces nl sentencia lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl salida lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar expresion lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar disyuncion lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar conjuncion restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar negacion restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar comparacion restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num restoY restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num restoO lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num lineas instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num nl saltosOpt instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num nl instruccionesBloque alternativa fin
⇒ si falso entonces nl mostrar num nl alternativa fin
⇒ si falso entonces nl mostrar num nl sino bloque fin
⇒ si falso entonces nl mostrar num nl sino lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl saltosOpt instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl sentencia lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl salida lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar expresion lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar disyuncion lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num restoY restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num restoO lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num lineas instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num nl saltosOpt instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num nl instruccionesBloque fin
⇒ si falso entonces nl mostrar num nl sino nl mostrar num nl fin
```

### Ejemplo 4

```text
si verdadero entonces
si falso entonces
fin
fin
```

```text
condicional
⇒ si expresion entonces bloque alternativa fin
⇒ si disyuncion entonces bloque alternativa fin
⇒ si conjuncion restoO entonces bloque alternativa fin
⇒ si negacion restoY restoO entonces bloque alternativa fin
⇒ si comparacion restoY restoO entonces bloque alternativa fin
⇒ si suma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si producto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si unaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si primaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero comparacionOpt restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoY restoO entonces bloque alternativa fin
⇒ si verdadero restoO entonces bloque alternativa fin
⇒ si verdadero entonces bloque alternativa fin
⇒ si verdadero entonces lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl saltosOpt instruccionesBloque alternativa fin
⇒ si verdadero entonces nl instruccionesBloque alternativa fin
⇒ si verdadero entonces nl sentencia lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl condicional lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si expresion entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si disyuncion entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si conjuncion restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si negacion restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si comparacion restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si suma comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si producto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si unaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si primaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso comparacionOpt restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso restoY restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso restoO entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces bloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces lineas instruccionesBloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl saltosOpt instruccionesBloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl instruccionesBloque alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl alternativa fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl fin lineas instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl fin nl saltosOpt instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl fin nl instruccionesBloque alternativa fin
⇒ si verdadero entonces nl si falso entonces nl fin nl alternativa fin
⇒ si verdadero entonces nl si falso entonces nl fin nl fin
```

Quinto ejemplo para la descripción de la construcción:

```text
si no terminado entonces
mostrar "Sigue"
fin
```

## Repetición por cantidad

Símbolo inicial: `repeticion`.

### Ejemplo 1

```text
repetir 3 veces
mostrar 1
fin
```

```text
repeticion
⇒ repetir expresion veces bloque fin
⇒ repetir disyuncion veces bloque fin
⇒ repetir conjuncion restoO veces bloque fin
⇒ repetir negacion restoY restoO veces bloque fin
⇒ repetir comparacion restoY restoO veces bloque fin
⇒ repetir suma comparacionOpt restoY restoO veces bloque fin
⇒ repetir producto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir unaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir primaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoY restoO veces bloque fin
⇒ repetir num restoO veces bloque fin
⇒ repetir num veces bloque fin
⇒ repetir num veces lineas instruccionesBloque fin
⇒ repetir num veces nl saltosOpt instruccionesBloque fin
⇒ repetir num veces nl instruccionesBloque fin
⇒ repetir num veces nl sentencia lineas instruccionesBloque fin
⇒ repetir num veces nl salida lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar expresion lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar disyuncion lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num restoY restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num restoO lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num lineas instruccionesBloque fin
⇒ repetir num veces nl mostrar num nl saltosOpt instruccionesBloque fin
⇒ repetir num veces nl mostrar num nl instruccionesBloque fin
⇒ repetir num veces nl mostrar num nl fin
```

### Ejemplo 2

```text
repetir cantidad veces
mostrar "Hola"
fin
```

```text
repeticion
⇒ repetir expresion veces bloque fin
⇒ repetir disyuncion veces bloque fin
⇒ repetir conjuncion restoO veces bloque fin
⇒ repetir negacion restoY restoO veces bloque fin
⇒ repetir comparacion restoY restoO veces bloque fin
⇒ repetir suma comparacionOpt restoY restoO veces bloque fin
⇒ repetir producto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir unaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir primaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir id restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir id restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir id comparacionOpt restoY restoO veces bloque fin
⇒ repetir id restoY restoO veces bloque fin
⇒ repetir id restoO veces bloque fin
⇒ repetir id veces bloque fin
⇒ repetir id veces lineas instruccionesBloque fin
⇒ repetir id veces nl saltosOpt instruccionesBloque fin
⇒ repetir id veces nl instruccionesBloque fin
⇒ repetir id veces nl sentencia lineas instruccionesBloque fin
⇒ repetir id veces nl salida lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar expresion lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar disyuncion lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad restoY restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad restoO lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad lineas instruccionesBloque fin
⇒ repetir id veces nl mostrar cad nl saltosOpt instruccionesBloque fin
⇒ repetir id veces nl mostrar cad nl instruccionesBloque fin
⇒ repetir id veces nl mostrar cad nl fin
```

### Ejemplo 3

```text
repetir 2 + 1 veces
mostrar 1
fin
```

```text
repeticion
⇒ repetir expresion veces bloque fin
⇒ repetir disyuncion veces bloque fin
⇒ repetir conjuncion restoO veces bloque fin
⇒ repetir negacion restoY restoO veces bloque fin
⇒ repetir comparacion restoY restoO veces bloque fin
⇒ repetir suma comparacionOpt restoY restoO veces bloque fin
⇒ repetir producto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir unaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir primaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + producto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + unaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + primaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + num restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + num restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + num comparacionOpt restoY restoO veces bloque fin
⇒ repetir num + num restoY restoO veces bloque fin
⇒ repetir num + num restoO veces bloque fin
⇒ repetir num + num veces bloque fin
⇒ repetir num + num veces lineas instruccionesBloque fin
⇒ repetir num + num veces nl saltosOpt instruccionesBloque fin
⇒ repetir num + num veces nl instruccionesBloque fin
⇒ repetir num + num veces nl sentencia lineas instruccionesBloque fin
⇒ repetir num + num veces nl salida lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar expresion lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar disyuncion lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num restoY restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num restoO lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num lineas instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num nl saltosOpt instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num nl instruccionesBloque fin
⇒ repetir num + num veces nl mostrar num nl fin
```

### Ejemplo 4

```text
repetir 0 veces
fin
```

```text
repeticion
⇒ repetir expresion veces bloque fin
⇒ repetir disyuncion veces bloque fin
⇒ repetir conjuncion restoO veces bloque fin
⇒ repetir negacion restoY restoO veces bloque fin
⇒ repetir comparacion restoY restoO veces bloque fin
⇒ repetir suma comparacionOpt restoY restoO veces bloque fin
⇒ repetir producto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir unaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir primaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoSuma comparacionOpt restoY restoO veces bloque fin
⇒ repetir num comparacionOpt restoY restoO veces bloque fin
⇒ repetir num restoY restoO veces bloque fin
⇒ repetir num restoO veces bloque fin
⇒ repetir num veces bloque fin
⇒ repetir num veces lineas instruccionesBloque fin
⇒ repetir num veces nl saltosOpt instruccionesBloque fin
⇒ repetir num veces nl instruccionesBloque fin
⇒ repetir num veces nl fin
```

Quinto ejemplo para la descripción de la construcción:

```text
repetir 2 veces
repetir 3 veces
fin
fin
```

## Repetición por condición

Símbolo inicial: `sentenciaMientras`.

### Ejemplo 1

```text
mientras activo hacer
mostrar 1
fin
```

```text
sentenciaMientras
⇒ mientras expresion hacer bloque fin
⇒ mientras disyuncion hacer bloque fin
⇒ mientras conjuncion restoO hacer bloque fin
⇒ mientras negacion restoY restoO hacer bloque fin
⇒ mientras comparacion restoY restoO hacer bloque fin
⇒ mientras suma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras producto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras unaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras primaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoY restoO hacer bloque fin
⇒ mientras id restoO hacer bloque fin
⇒ mientras id hacer bloque fin
⇒ mientras id hacer lineas instruccionesBloque fin
⇒ mientras id hacer nl saltosOpt instruccionesBloque fin
⇒ mientras id hacer nl instruccionesBloque fin
⇒ mientras id hacer nl sentencia lineas instruccionesBloque fin
⇒ mientras id hacer nl salida lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar expresion lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar disyuncion lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num restoY restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num restoO lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num lineas instruccionesBloque fin
⇒ mientras id hacer nl mostrar num nl saltosOpt instruccionesBloque fin
⇒ mientras id hacer nl mostrar num nl instruccionesBloque fin
⇒ mientras id hacer nl mostrar num nl fin
```

### Ejemplo 2

```text
mientras edad es menor que 18 hacer
mostrar edad
fin
```

```text
sentenciaMientras
⇒ mientras expresion hacer bloque fin
⇒ mientras disyuncion hacer bloque fin
⇒ mientras conjuncion restoO hacer bloque fin
⇒ mientras negacion restoY restoO hacer bloque fin
⇒ mientras comparacion restoY restoO hacer bloque fin
⇒ mientras suma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras producto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras unaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras primaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id operadorComparacion suma restoY restoO hacer bloque fin
⇒ mientras id es menor que suma restoY restoO hacer bloque fin
⇒ mientras id es menor que producto restoSuma restoY restoO hacer bloque fin
⇒ mientras id es menor que unaria restoProducto restoSuma restoY restoO hacer bloque fin
⇒ mientras id es menor que primaria restoProducto restoSuma restoY restoO hacer bloque fin
⇒ mientras id es menor que num restoProducto restoSuma restoY restoO hacer bloque fin
⇒ mientras id es menor que num restoSuma restoY restoO hacer bloque fin
⇒ mientras id es menor que num restoY restoO hacer bloque fin
⇒ mientras id es menor que num restoO hacer bloque fin
⇒ mientras id es menor que num hacer bloque fin
⇒ mientras id es menor que num hacer lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl saltosOpt instruccionesBloque fin
⇒ mientras id es menor que num hacer nl instruccionesBloque fin
⇒ mientras id es menor que num hacer nl sentencia lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl salida lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar expresion lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar disyuncion lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id restoY restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id restoO lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id lineas instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id nl saltosOpt instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id nl instruccionesBloque fin
⇒ mientras id es menor que num hacer nl mostrar id nl fin
```

### Ejemplo 3

```text
mientras no terminado hacer
mostrar "Sigue"
fin
```

```text
sentenciaMientras
⇒ mientras expresion hacer bloque fin
⇒ mientras disyuncion hacer bloque fin
⇒ mientras conjuncion restoO hacer bloque fin
⇒ mientras negacion restoY restoO hacer bloque fin
⇒ mientras no negacion restoY restoO hacer bloque fin
⇒ mientras no comparacion restoY restoO hacer bloque fin
⇒ mientras no suma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no producto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no unaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no primaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no id restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no id restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no id comparacionOpt restoY restoO hacer bloque fin
⇒ mientras no id restoY restoO hacer bloque fin
⇒ mientras no id restoO hacer bloque fin
⇒ mientras no id hacer bloque fin
⇒ mientras no id hacer lineas instruccionesBloque fin
⇒ mientras no id hacer nl saltosOpt instruccionesBloque fin
⇒ mientras no id hacer nl instruccionesBloque fin
⇒ mientras no id hacer nl sentencia lineas instruccionesBloque fin
⇒ mientras no id hacer nl salida lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar expresion lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar disyuncion lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar conjuncion restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar negacion restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar comparacion restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad restoY restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad restoO lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad lineas instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad nl saltosOpt instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad nl instruccionesBloque fin
⇒ mientras no id hacer nl mostrar cad nl fin
```

### Ejemplo 4

```text
mientras activo y verdadero hacer
fin
```

```text
sentenciaMientras
⇒ mientras expresion hacer bloque fin
⇒ mientras disyuncion hacer bloque fin
⇒ mientras conjuncion restoO hacer bloque fin
⇒ mientras negacion restoY restoO hacer bloque fin
⇒ mientras comparacion restoY restoO hacer bloque fin
⇒ mientras suma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras producto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras unaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras primaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id restoY restoO hacer bloque fin
⇒ mientras id y negacion restoY restoO hacer bloque fin
⇒ mientras id y comparacion restoY restoO hacer bloque fin
⇒ mientras id y suma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y producto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y unaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y primaria restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y verdadero restoProducto restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y verdadero restoSuma comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y verdadero comparacionOpt restoY restoO hacer bloque fin
⇒ mientras id y verdadero restoY restoO hacer bloque fin
⇒ mientras id y verdadero restoO hacer bloque fin
⇒ mientras id y verdadero hacer bloque fin
⇒ mientras id y verdadero hacer lineas instruccionesBloque fin
⇒ mientras id y verdadero hacer nl saltosOpt instruccionesBloque fin
⇒ mientras id y verdadero hacer nl instruccionesBloque fin
⇒ mientras id y verdadero hacer nl fin
```

Quinto ejemplo para la descripción de la construcción:

```text
mientras puntos es menor o igual que 10 hacer
asignar puntos valor de puntos + 1
fin
```

## Definición de funciones

Símbolo inicial: `funcion`.

### Ejemplo 1

```text
definir saludo devuelve texto
devolver "Hola"
fin
```

```text
funcion
⇒ definir id parametrosOpt devuelve tipo bloque fin
⇒ definir id devuelve tipo bloque fin
⇒ definir id devuelve texto bloque fin
⇒ definir id devuelve texto lineas instruccionesBloque fin
⇒ definir id devuelve texto nl saltosOpt instruccionesBloque fin
⇒ definir id devuelve texto nl instruccionesBloque fin
⇒ definir id devuelve texto nl sentencia lineas instruccionesBloque fin
⇒ definir id devuelve texto nl retorno lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver expresion lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver disyuncion lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver conjuncion restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver negacion restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver comparacion restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad restoY restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad restoO lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad lineas instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad nl saltosOpt instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad nl instruccionesBloque fin
⇒ definir id devuelve texto nl devolver cad nl fin
```

### Ejemplo 2

```text
definir doble con numero dato devuelve numero
devolver dato * 2
fin
```

```text
funcion
⇒ definir id parametrosOpt devuelve tipo bloque fin
⇒ definir id con parametros devuelve tipo bloque fin
⇒ definir id con parametro restoParametros devuelve tipo bloque fin
⇒ definir id con tipo id restoParametros devuelve tipo bloque fin
⇒ definir id con numero id restoParametros devuelve tipo bloque fin
⇒ definir id con numero id devuelve tipo bloque fin
⇒ definir id con numero id devuelve numero bloque fin
⇒ definir id con numero id devuelve numero lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl saltosOpt instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl sentencia lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl retorno lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver expresion lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver disyuncion lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver conjuncion restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver negacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver comparacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num restoY restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num restoO lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num lineas instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num nl saltosOpt instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num nl instruccionesBloque fin
⇒ definir id con numero id devuelve numero nl devolver id * num nl fin
```

### Ejemplo 3

```text
definir copiar con texto mensaje devuelve texto
devolver mensaje
fin
```

```text
funcion
⇒ definir id parametrosOpt devuelve tipo bloque fin
⇒ definir id con parametros devuelve tipo bloque fin
⇒ definir id con parametro restoParametros devuelve tipo bloque fin
⇒ definir id con tipo id restoParametros devuelve tipo bloque fin
⇒ definir id con texto id restoParametros devuelve tipo bloque fin
⇒ definir id con texto id devuelve tipo bloque fin
⇒ definir id con texto id devuelve texto bloque fin
⇒ definir id con texto id devuelve texto lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl saltosOpt instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl sentencia lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl retorno lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver expresion lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver disyuncion lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver conjuncion restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver negacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver comparacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id restoY restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id restoO lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id lineas instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id nl saltosOpt instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id nl instruccionesBloque fin
⇒ definir id con texto id devuelve texto nl devolver id nl fin
```

### Ejemplo 4

```text
definir negar con logico estado devuelve logico
devolver no estado
fin
```

```text
funcion
⇒ definir id parametrosOpt devuelve tipo bloque fin
⇒ definir id con parametros devuelve tipo bloque fin
⇒ definir id con parametro restoParametros devuelve tipo bloque fin
⇒ definir id con tipo id restoParametros devuelve tipo bloque fin
⇒ definir id con logico id restoParametros devuelve tipo bloque fin
⇒ definir id con logico id devuelve tipo bloque fin
⇒ definir id con logico id devuelve logico bloque fin
⇒ definir id con logico id devuelve logico lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl saltosOpt instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl sentencia lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl retorno lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver expresion lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver disyuncion lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver conjuncion restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver negacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no negacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no comparacion restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no suma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id comparacionOpt restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id restoY restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id restoO lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id lineas instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id nl saltosOpt instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id nl instruccionesBloque fin
⇒ definir id con logico id devuelve logico nl devolver no id nl fin
```

Quinto ejemplo para la descripción de la construcción:

```text
definir sumar con numero primero, numero segundo devuelve numero
devolver primero + segundo
fin
```

## Retorno

Símbolo inicial: `retorno`.

### Ejemplo 1

```text
devolver 10
```

```text
retorno
⇒ devolver expresion
⇒ devolver disyuncion
⇒ devolver conjuncion restoO
⇒ devolver negacion restoY restoO
⇒ devolver comparacion restoY restoO
⇒ devolver suma comparacionOpt restoY restoO
⇒ devolver producto restoSuma comparacionOpt restoY restoO
⇒ devolver unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver num restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver num restoSuma comparacionOpt restoY restoO
⇒ devolver num comparacionOpt restoY restoO
⇒ devolver num restoY restoO
⇒ devolver num restoO
⇒ devolver num
```

### Ejemplo 2

```text
devolver "Hola"
```

```text
retorno
⇒ devolver expresion
⇒ devolver disyuncion
⇒ devolver conjuncion restoO
⇒ devolver negacion restoY restoO
⇒ devolver comparacion restoY restoO
⇒ devolver suma comparacionOpt restoY restoO
⇒ devolver producto restoSuma comparacionOpt restoY restoO
⇒ devolver unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver cad restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver cad restoSuma comparacionOpt restoY restoO
⇒ devolver cad comparacionOpt restoY restoO
⇒ devolver cad restoY restoO
⇒ devolver cad restoO
⇒ devolver cad
```

### Ejemplo 3

```text
devolver dato
```

```text
retorno
⇒ devolver expresion
⇒ devolver disyuncion
⇒ devolver conjuncion restoO
⇒ devolver negacion restoY restoO
⇒ devolver comparacion restoY restoO
⇒ devolver suma comparacionOpt restoY restoO
⇒ devolver producto restoSuma comparacionOpt restoY restoO
⇒ devolver unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver id restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver id restoSuma comparacionOpt restoY restoO
⇒ devolver id comparacionOpt restoY restoO
⇒ devolver id restoY restoO
⇒ devolver id restoO
⇒ devolver id
```

### Ejemplo 4

```text
devolver verdadero
```

```text
retorno
⇒ devolver expresion
⇒ devolver disyuncion
⇒ devolver conjuncion restoO
⇒ devolver negacion restoY restoO
⇒ devolver comparacion restoY restoO
⇒ devolver suma comparacionOpt restoY restoO
⇒ devolver producto restoSuma comparacionOpt restoY restoO
⇒ devolver unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver verdadero restoProducto restoSuma comparacionOpt restoY restoO
⇒ devolver verdadero restoSuma comparacionOpt restoY restoO
⇒ devolver verdadero comparacionOpt restoY restoO
⇒ devolver verdadero restoY restoO
⇒ devolver verdadero restoO
⇒ devolver verdadero
```

Quinto ejemplo para la descripción de la construcción:

```text
devolver primero + segundo
```

## Llamada a función

Símbolo inicial: `llamada`.

### Ejemplo 1

```text
saludo()
```

```text
llamada
⇒ id ( argumentosOpt )
⇒ id ( )
```

### Ejemplo 2

```text
doble(2)
```

```text
llamada
⇒ id ( argumentosOpt )
⇒ id ( argumentos )
⇒ id ( expresion restoArgumentos )
⇒ id ( disyuncion restoArgumentos )
⇒ id ( conjuncion restoO restoArgumentos )
⇒ id ( negacion restoY restoO restoArgumentos )
⇒ id ( comparacion restoY restoO restoArgumentos )
⇒ id ( suma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( producto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( unaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( primaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoY restoO restoArgumentos )
⇒ id ( num restoO restoArgumentos )
⇒ id ( num restoArgumentos )
⇒ id ( num )
```

### Ejemplo 3

```text
sumar(2, 3)
```

```text
llamada
⇒ id ( argumentosOpt )
⇒ id ( argumentos )
⇒ id ( expresion restoArgumentos )
⇒ id ( disyuncion restoArgumentos )
⇒ id ( conjuncion restoO restoArgumentos )
⇒ id ( negacion restoY restoO restoArgumentos )
⇒ id ( comparacion restoY restoO restoArgumentos )
⇒ id ( suma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( producto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( unaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( primaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoY restoO restoArgumentos )
⇒ id ( num restoO restoArgumentos )
⇒ id ( num restoArgumentos )
⇒ id ( num , expresion restoArgumentos )
⇒ id ( num , disyuncion restoArgumentos )
⇒ id ( num , conjuncion restoO restoArgumentos )
⇒ id ( num , negacion restoY restoO restoArgumentos )
⇒ id ( num , comparacion restoY restoO restoArgumentos )
⇒ id ( num , suma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , producto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , unaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , primaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , num restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , num restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , num comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , num restoY restoO restoArgumentos )
⇒ id ( num , num restoO restoArgumentos )
⇒ id ( num , num restoArgumentos )
⇒ id ( num , num )
```

### Ejemplo 4

```text
sumar(2, doble(3))
```

```text
llamada
⇒ id ( argumentosOpt )
⇒ id ( argumentos )
⇒ id ( expresion restoArgumentos )
⇒ id ( disyuncion restoArgumentos )
⇒ id ( conjuncion restoO restoArgumentos )
⇒ id ( negacion restoY restoO restoArgumentos )
⇒ id ( comparacion restoY restoO restoArgumentos )
⇒ id ( suma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( producto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( unaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( primaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num restoY restoO restoArgumentos )
⇒ id ( num restoO restoArgumentos )
⇒ id ( num restoArgumentos )
⇒ id ( num , expresion restoArgumentos )
⇒ id ( num , disyuncion restoArgumentos )
⇒ id ( num , conjuncion restoO restoArgumentos )
⇒ id ( num , negacion restoY restoO restoArgumentos )
⇒ id ( num , comparacion restoY restoO restoArgumentos )
⇒ id ( num , suma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , producto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , unaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , primaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , llamada restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( argumentosOpt ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( argumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( expresion restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( disyuncion restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( conjuncion restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( negacion restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( comparacion restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( suma comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( producto restoSuma comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( unaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( primaria restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num restoSuma comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num comparacionOpt restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num restoY restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num restoO restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num restoArgumentos ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num ) restoProducto restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num ) restoSuma comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num ) comparacionOpt restoY restoO restoArgumentos )
⇒ id ( num , id ( num ) restoY restoO restoArgumentos )
⇒ id ( num , id ( num ) restoO restoArgumentos )
⇒ id ( num , id ( num ) restoArgumentos )
⇒ id ( num , id ( num ) )
```

Quinto ejemplo para la descripción de la construcción:

```text
copiar("Hola")
```

## Número aleatorio

Símbolo inicial: `expresionAleatoria`.

### Ejemplo 1

```text
asignar dado valor de numero aleatorio entre 1 y 6
```

```text
expresionAleatoria
⇒ numero aleatorio entre limite y limite
⇒ numero aleatorio entre num y limite
⇒ numero aleatorio entre num y num
```

### Ejemplo 2

```text
asignar dado valor de numero aleatorio entre -3 y 3
```

```text
expresionAleatoria
⇒ numero aleatorio entre limite y limite
⇒ numero aleatorio entre - num y limite
⇒ numero aleatorio entre - num y num
```

### Ejemplo 3

```text
asignar dado valor de numero aleatorio entre minimo y maximo
```

```text
expresionAleatoria
⇒ numero aleatorio entre limite y limite
⇒ numero aleatorio entre id y limite
⇒ numero aleatorio entre id y id
```

### Ejemplo 4

```text
asignar dado valor de numero aleatorio entre 1 y maximo
```

```text
expresionAleatoria
⇒ numero aleatorio entre limite y limite
⇒ numero aleatorio entre num y limite
⇒ numero aleatorio entre num y id
```

Quinto ejemplo para la descripción de la construcción:

```text
asignar dado valor de numero aleatorio entre 4 y 4
```

## Motivación

Símbolo inicial: `motivacion`.

### Ejemplo 1

```text
juego
```

```text
motivacion
⇒ juego
```

### Ejemplo 2

```text
calculadora
```

```text
motivacion
⇒ calculadora
```

### Ejemplo 3

```text
JUEGO
```

```text
motivacion
⇒ juego
```

### Ejemplo 4

```text
Calculadora
```

```text
motivacion
⇒ calculadora
```

Quinto ejemplo para la descripción de la construcción:

```text
JuEgO
```

## Expresiones aritméticas

Símbolo inicial: `suma`.

### Ejemplo 1

```text
mostrar 2 + 3 * 4
```

```text
suma
⇒ producto restoSuma
⇒ unaria restoProducto restoSuma
⇒ primaria restoProducto restoSuma
⇒ num restoProducto restoSuma
⇒ num restoSuma
⇒ num + producto restoSuma
⇒ num + unaria restoProducto restoSuma
⇒ num + primaria restoProducto restoSuma
⇒ num + num restoProducto restoSuma
⇒ num + num * unaria restoProducto restoSuma
⇒ num + num * primaria restoProducto restoSuma
⇒ num + num * num restoProducto restoSuma
⇒ num + num * num restoSuma
⇒ num + num * num
```

### Ejemplo 2

```text
mostrar (2 + 3) * 4
```

```text
suma
⇒ producto restoSuma
⇒ unaria restoProducto restoSuma
⇒ primaria restoProducto restoSuma
⇒ ( expresion ) restoProducto restoSuma
⇒ ( disyuncion ) restoProducto restoSuma
⇒ ( conjuncion restoO ) restoProducto restoSuma
⇒ ( negacion restoY restoO ) restoProducto restoSuma
⇒ ( comparacion restoY restoO ) restoProducto restoSuma
⇒ ( suma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( producto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( unaria restoProducto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( primaria restoProducto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num restoProducto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + producto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + unaria restoProducto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + primaria restoProducto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + num restoProducto restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + num restoSuma comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + num comparacionOpt restoY restoO ) restoProducto restoSuma
⇒ ( num + num restoY restoO ) restoProducto restoSuma
⇒ ( num + num restoO ) restoProducto restoSuma
⇒ ( num + num ) restoProducto restoSuma
⇒ ( num + num ) * unaria restoProducto restoSuma
⇒ ( num + num ) * primaria restoProducto restoSuma
⇒ ( num + num ) * num restoProducto restoSuma
⇒ ( num + num ) * num restoSuma
⇒ ( num + num ) * num
```

### Ejemplo 3

```text
mostrar 10 - 3 - 2
```

```text
suma
⇒ producto restoSuma
⇒ unaria restoProducto restoSuma
⇒ primaria restoProducto restoSuma
⇒ num restoProducto restoSuma
⇒ num restoSuma
⇒ num - producto restoSuma
⇒ num - unaria restoProducto restoSuma
⇒ num - primaria restoProducto restoSuma
⇒ num - num restoProducto restoSuma
⇒ num - num restoSuma
⇒ num - num - producto restoSuma
⇒ num - num - unaria restoProducto restoSuma
⇒ num - num - primaria restoProducto restoSuma
⇒ num - num - num restoProducto restoSuma
⇒ num - num - num restoSuma
⇒ num - num - num
```

### Ejemplo 4

```text
mostrar -5 / 2
```

```text
suma
⇒ producto restoSuma
⇒ unaria restoProducto restoSuma
⇒ - unaria restoProducto restoSuma
⇒ - primaria restoProducto restoSuma
⇒ - num restoProducto restoSuma
⇒ - num / unaria restoProducto restoSuma
⇒ - num / primaria restoProducto restoSuma
⇒ - num / num restoProducto restoSuma
⇒ - num / num restoSuma
⇒ - num / num
```

Quinto ejemplo para la descripción de la construcción:

```text
mostrar edad + 1
```

## Comparaciones

Símbolo inicial: `comparacion`.

### Ejemplo 1

```text
mostrar edad es igual a 10
```

```text
comparacion
⇒ suma comparacionOpt
⇒ producto restoSuma comparacionOpt
⇒ unaria restoProducto restoSuma comparacionOpt
⇒ primaria restoProducto restoSuma comparacionOpt
⇒ id restoProducto restoSuma comparacionOpt
⇒ id restoSuma comparacionOpt
⇒ id comparacionOpt
⇒ id operadorComparacion suma
⇒ id es igual a suma
⇒ id es igual a producto restoSuma
⇒ id es igual a unaria restoProducto restoSuma
⇒ id es igual a primaria restoProducto restoSuma
⇒ id es igual a num restoProducto restoSuma
⇒ id es igual a num restoSuma
⇒ id es igual a num
```

### Ejemplo 2

```text
mostrar edad es diferente de 10
```

```text
comparacion
⇒ suma comparacionOpt
⇒ producto restoSuma comparacionOpt
⇒ unaria restoProducto restoSuma comparacionOpt
⇒ primaria restoProducto restoSuma comparacionOpt
⇒ id restoProducto restoSuma comparacionOpt
⇒ id restoSuma comparacionOpt
⇒ id comparacionOpt
⇒ id operadorComparacion suma
⇒ id es diferente de suma
⇒ id es diferente de producto restoSuma
⇒ id es diferente de unaria restoProducto restoSuma
⇒ id es diferente de primaria restoProducto restoSuma
⇒ id es diferente de num restoProducto restoSuma
⇒ id es diferente de num restoSuma
⇒ id es diferente de num
```

### Ejemplo 3

```text
mostrar edad es mayor o igual que 10
```

```text
comparacion
⇒ suma comparacionOpt
⇒ producto restoSuma comparacionOpt
⇒ unaria restoProducto restoSuma comparacionOpt
⇒ primaria restoProducto restoSuma comparacionOpt
⇒ id restoProducto restoSuma comparacionOpt
⇒ id restoSuma comparacionOpt
⇒ id comparacionOpt
⇒ id operadorComparacion suma
⇒ id es mayor o igual que suma
⇒ id es mayor o igual que producto restoSuma
⇒ id es mayor o igual que unaria restoProducto restoSuma
⇒ id es mayor o igual que primaria restoProducto restoSuma
⇒ id es mayor o igual que num restoProducto restoSuma
⇒ id es mayor o igual que num restoSuma
⇒ id es mayor o igual que num
```

### Ejemplo 4

```text
mostrar edad es menor o igual que 10
```

```text
comparacion
⇒ suma comparacionOpt
⇒ producto restoSuma comparacionOpt
⇒ unaria restoProducto restoSuma comparacionOpt
⇒ primaria restoProducto restoSuma comparacionOpt
⇒ id restoProducto restoSuma comparacionOpt
⇒ id restoSuma comparacionOpt
⇒ id comparacionOpt
⇒ id operadorComparacion suma
⇒ id es menor o igual que suma
⇒ id es menor o igual que producto restoSuma
⇒ id es menor o igual que unaria restoProducto restoSuma
⇒ id es menor o igual que primaria restoProducto restoSuma
⇒ id es menor o igual que num restoProducto restoSuma
⇒ id es menor o igual que num restoSuma
⇒ id es menor o igual que num
```

Quinto ejemplo para la descripción de la construcción:

```text
mostrar edad es menor que 10
```

## Expresiones lógicas

Símbolo inicial: `expresion`.

### Ejemplo 1

```text
mostrar verdadero
```

```text
expresion
⇒ disyuncion
⇒ conjuncion restoO
⇒ negacion restoY restoO
⇒ comparacion restoY restoO
⇒ suma comparacionOpt restoY restoO
⇒ producto restoSuma comparacionOpt restoY restoO
⇒ unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ verdadero restoProducto restoSuma comparacionOpt restoY restoO
⇒ verdadero restoSuma comparacionOpt restoY restoO
⇒ verdadero comparacionOpt restoY restoO
⇒ verdadero restoY restoO
⇒ verdadero restoO
⇒ verdadero
```

### Ejemplo 2

```text
mostrar no falso
```

```text
expresion
⇒ disyuncion
⇒ conjuncion restoO
⇒ negacion restoY restoO
⇒ no negacion restoY restoO
⇒ no comparacion restoY restoO
⇒ no suma comparacionOpt restoY restoO
⇒ no producto restoSuma comparacionOpt restoY restoO
⇒ no unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ no primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ no falso restoProducto restoSuma comparacionOpt restoY restoO
⇒ no falso restoSuma comparacionOpt restoY restoO
⇒ no falso comparacionOpt restoY restoO
⇒ no falso restoY restoO
⇒ no falso restoO
⇒ no falso
```

### Ejemplo 3

```text
mostrar activo y listo
```

```text
expresion
⇒ disyuncion
⇒ conjuncion restoO
⇒ negacion restoY restoO
⇒ comparacion restoY restoO
⇒ suma comparacionOpt restoY restoO
⇒ producto restoSuma comparacionOpt restoY restoO
⇒ unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id restoProducto restoSuma comparacionOpt restoY restoO
⇒ id restoSuma comparacionOpt restoY restoO
⇒ id comparacionOpt restoY restoO
⇒ id restoY restoO
⇒ id y negacion restoY restoO
⇒ id y comparacion restoY restoO
⇒ id y suma comparacionOpt restoY restoO
⇒ id y producto restoSuma comparacionOpt restoY restoO
⇒ id y unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id y primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id y id restoProducto restoSuma comparacionOpt restoY restoO
⇒ id y id restoSuma comparacionOpt restoY restoO
⇒ id y id comparacionOpt restoY restoO
⇒ id y id restoY restoO
⇒ id y id restoO
⇒ id y id
```

### Ejemplo 4

```text
mostrar activo o listo y no terminado
```

```text
expresion
⇒ disyuncion
⇒ conjuncion restoO
⇒ negacion restoY restoO
⇒ comparacion restoY restoO
⇒ suma comparacionOpt restoY restoO
⇒ producto restoSuma comparacionOpt restoY restoO
⇒ unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id restoProducto restoSuma comparacionOpt restoY restoO
⇒ id restoSuma comparacionOpt restoY restoO
⇒ id comparacionOpt restoY restoO
⇒ id restoY restoO
⇒ id restoO
⇒ id o conjuncion restoO
⇒ id o negacion restoY restoO
⇒ id o comparacion restoY restoO
⇒ id o suma comparacionOpt restoY restoO
⇒ id o producto restoSuma comparacionOpt restoY restoO
⇒ id o unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id o primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id o id restoProducto restoSuma comparacionOpt restoY restoO
⇒ id o id restoSuma comparacionOpt restoY restoO
⇒ id o id comparacionOpt restoY restoO
⇒ id o id restoY restoO
⇒ id o id y negacion restoY restoO
⇒ id o id y no negacion restoY restoO
⇒ id o id y no comparacion restoY restoO
⇒ id o id y no suma comparacionOpt restoY restoO
⇒ id o id y no producto restoSuma comparacionOpt restoY restoO
⇒ id o id y no unaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id o id y no primaria restoProducto restoSuma comparacionOpt restoY restoO
⇒ id o id y no id restoProducto restoSuma comparacionOpt restoY restoO
⇒ id o id y no id restoSuma comparacionOpt restoY restoO
⇒ id o id y no id comparacionOpt restoY restoO
⇒ id o id y no id restoY restoO
⇒ id o id y no id restoO
⇒ id o id y no id
```

Quinto ejemplo para la descripción de la construcción:

```text
mostrar no (activo o listo)
```

## Programa completo

Símbolo inicial: `programa`.

### Ejemplo 1

```text
# Archivo vacío
```

```text
programa
⇒ saltosOpt instrucciones eof
⇒ instrucciones eof
⇒ eof
```

### Ejemplo 2

```text
mostrar 1
```

```text
programa
⇒ saltosOpt instrucciones eof
⇒ instrucciones eof
⇒ sentencia restoPrograma eof
⇒ salida restoPrograma eof
⇒ mostrar expresion restoPrograma eof
⇒ mostrar disyuncion restoPrograma eof
⇒ mostrar conjuncion restoO restoPrograma eof
⇒ mostrar negacion restoY restoO restoPrograma eof
⇒ mostrar comparacion restoY restoO restoPrograma eof
⇒ mostrar suma comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar producto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar num restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar num restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar num comparacionOpt restoY restoO restoPrograma eof
⇒ mostrar num restoY restoO restoPrograma eof
⇒ mostrar num restoO restoPrograma eof
⇒ mostrar num restoPrograma eof
⇒ mostrar num eof
```

### Ejemplo 3

```text
crear variable edad
asignar edad valor de 10
mostrar edad

```

```text
programa
⇒ saltosOpt instrucciones eof
⇒ instrucciones eof
⇒ sentencia restoPrograma eof
⇒ declaracion restoPrograma eof
⇒ crear variable id restoPrograma eof
⇒ crear variable id lineas instrucciones eof
⇒ crear variable id nl saltosOpt instrucciones eof
⇒ crear variable id nl instrucciones eof
⇒ crear variable id nl sentencia restoPrograma eof
⇒ crear variable id nl asignacion restoPrograma eof
⇒ crear variable id nl asignar id valor de expresion restoPrograma eof
⇒ crear variable id nl asignar id valor de disyuncion restoPrograma eof
⇒ crear variable id nl asignar id valor de conjuncion restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de negacion restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de comparacion restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de suma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de producto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de unaria restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de primaria restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num restoPrograma eof
⇒ crear variable id nl asignar id valor de num lineas instrucciones eof
⇒ crear variable id nl asignar id valor de num nl saltosOpt instrucciones eof
⇒ crear variable id nl asignar id valor de num nl instrucciones eof
⇒ crear variable id nl asignar id valor de num nl sentencia restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl salida restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar expresion restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar disyuncion restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar conjuncion restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar negacion restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar comparacion restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar suma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar producto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id restoProducto restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id restoSuma comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id comparacionOpt restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id restoY restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id restoO restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id restoPrograma eof
⇒ crear variable id nl asignar id valor de num nl mostrar id lineas instrucciones eof
⇒ crear variable id nl asignar id valor de num nl mostrar id nl saltosOpt instrucciones eof
⇒ crear variable id nl asignar id valor de num nl mostrar id nl instrucciones eof
⇒ crear variable id nl asignar id valor de num nl mostrar id nl eof
```

### Ejemplo 4

```text

si verdadero entonces
mostrar "Hola"
fin

```

```text
programa
⇒ saltosOpt instrucciones eof
⇒ nl saltosOpt instrucciones eof
⇒ nl instrucciones eof
⇒ nl sentencia restoPrograma eof
⇒ nl condicional restoPrograma eof
⇒ nl si expresion entonces bloque alternativa fin restoPrograma eof
⇒ nl si disyuncion entonces bloque alternativa fin restoPrograma eof
⇒ nl si conjuncion restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si negacion restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si comparacion restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si suma comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si producto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si unaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si primaria restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero restoProducto restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero restoSuma comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero comparacionOpt restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero restoY restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero restoO entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces bloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl saltosOpt instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl sentencia lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl salida lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar expresion lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar disyuncion lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar conjuncion restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar negacion restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar comparacion restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad restoSuma comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad comparacionOpt restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad restoY restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad restoO lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad lineas instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad nl saltosOpt instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad nl instruccionesBloque alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad nl alternativa fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad nl fin restoPrograma eof
⇒ nl si verdadero entonces nl mostrar cad nl fin lineas instrucciones eof
⇒ nl si verdadero entonces nl mostrar cad nl fin nl saltosOpt instrucciones eof
⇒ nl si verdadero entonces nl mostrar cad nl fin nl instrucciones eof
⇒ nl si verdadero entonces nl mostrar cad nl fin nl eof
```

Quinto ejemplo para la descripción de la construcción:

```text
juego
calculadora
```

## Bloques

Símbolo inicial: `bloque`.

### Ejemplo 1

```text
si verdadero entonces
fin
```

```text
bloque
⇒ lineas instruccionesBloque
⇒ nl saltosOpt instruccionesBloque
⇒ nl instruccionesBloque
⇒ nl
```

### Ejemplo 2

```text
si verdadero entonces
mostrar 1
fin
```

```text
bloque
⇒ lineas instruccionesBloque
⇒ nl saltosOpt instruccionesBloque
⇒ nl instruccionesBloque
⇒ nl sentencia lineas instruccionesBloque
⇒ nl salida lineas instruccionesBloque
⇒ nl mostrar expresion lineas instruccionesBloque
⇒ nl mostrar disyuncion lineas instruccionesBloque
⇒ nl mostrar conjuncion restoO lineas instruccionesBloque
⇒ nl mostrar negacion restoY restoO lineas instruccionesBloque
⇒ nl mostrar comparacion restoY restoO lineas instruccionesBloque
⇒ nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoO lineas instruccionesBloque
⇒ nl mostrar num lineas instruccionesBloque
⇒ nl mostrar num nl saltosOpt instruccionesBloque
⇒ nl mostrar num nl instruccionesBloque
⇒ nl mostrar num nl
```

### Ejemplo 3

```text
si verdadero entonces
mostrar 1
mostrar 2
fin
```

```text
bloque
⇒ lineas instruccionesBloque
⇒ nl saltosOpt instruccionesBloque
⇒ nl instruccionesBloque
⇒ nl sentencia lineas instruccionesBloque
⇒ nl salida lineas instruccionesBloque
⇒ nl mostrar expresion lineas instruccionesBloque
⇒ nl mostrar disyuncion lineas instruccionesBloque
⇒ nl mostrar conjuncion restoO lineas instruccionesBloque
⇒ nl mostrar negacion restoY restoO lineas instruccionesBloque
⇒ nl mostrar comparacion restoY restoO lineas instruccionesBloque
⇒ nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoY restoO lineas instruccionesBloque
⇒ nl mostrar num restoO lineas instruccionesBloque
⇒ nl mostrar num lineas instruccionesBloque
⇒ nl mostrar num nl saltosOpt instruccionesBloque
⇒ nl mostrar num nl instruccionesBloque
⇒ nl mostrar num nl sentencia lineas instruccionesBloque
⇒ nl mostrar num nl salida lineas instruccionesBloque
⇒ nl mostrar num nl mostrar expresion lineas instruccionesBloque
⇒ nl mostrar num nl mostrar disyuncion lineas instruccionesBloque
⇒ nl mostrar num nl mostrar conjuncion restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar negacion restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar comparacion restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num restoY restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num restoO lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num lineas instruccionesBloque
⇒ nl mostrar num nl mostrar num nl saltosOpt instruccionesBloque
⇒ nl mostrar num nl mostrar num nl instruccionesBloque
⇒ nl mostrar num nl mostrar num nl
```

### Ejemplo 4

```text
si verdadero entonces
repetir 2 veces
mostrar 1
fin
fin
```

```text
bloque
⇒ lineas instruccionesBloque
⇒ nl saltosOpt instruccionesBloque
⇒ nl instruccionesBloque
⇒ nl sentencia lineas instruccionesBloque
⇒ nl repeticion lineas instruccionesBloque
⇒ nl repetir expresion veces bloque fin lineas instruccionesBloque
⇒ nl repetir disyuncion veces bloque fin lineas instruccionesBloque
⇒ nl repetir conjuncion restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir negacion restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir comparacion restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir suma comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir producto restoSuma comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir unaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir primaria restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir num restoProducto restoSuma comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir num restoSuma comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir num comparacionOpt restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir num restoY restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir num restoO veces bloque fin lineas instruccionesBloque
⇒ nl repetir num veces bloque fin lineas instruccionesBloque
⇒ nl repetir num veces lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl saltosOpt instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl sentencia lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl salida lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar expresion lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar disyuncion lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar conjuncion restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar negacion restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar comparacion restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar suma comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar producto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar unaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar primaria restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num restoProducto restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num restoSuma comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num comparacionOpt restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num restoY restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num restoO lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num lineas instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num nl saltosOpt instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num nl instruccionesBloque fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num nl fin lineas instruccionesBloque
⇒ nl repetir num veces nl mostrar num nl fin nl saltosOpt instruccionesBloque
⇒ nl repetir num veces nl mostrar num nl fin nl instruccionesBloque
⇒ nl repetir num veces nl mostrar num nl fin nl
```

Quinto ejemplo para la descripción de la construcción:

```text
si verdadero entonces

mostrar "Hola"
fin
```
