parser grammar EducativoParser;

// Configuración del parser
options {
    tokenVocab = EducativoLexer;
}

// Estructura del programa y separación por líneas
// Una alternativa sin símbolos representa epsilon.
// Una instrucción por línea; la última puede terminar en EOF.
programa : saltosOpt instrucciones EOF;
saltosOpt : SALTO_LINEA saltosOpt | ;
lineas : SALTO_LINEA saltosOpt;
instrucciones : sentencia restoPrograma | ;
restoPrograma : lineas instrucciones | ;

// Instrucciones disponibles
sentencia
    : declaracion
    | asignacion
    | salida
    | entrada
    | condicional
    | repeticion
    | mientras
    | funcion
    | retorno
    | llamada
    | motivacion
    ;

// Variables y entrada/salida
declaracion : CREAR VARIABLE ID;
asignacion : ASIGNAR ID VALOR DE expresion;
salida : MOSTRAR expresion;
entrada : PREGUNTAR TEXTO GUARDAR EN ID;

// Estructura de los bloques
// El encabezado y las instrucciones del bloque necesitan un salto.
// Los bloques pueden estar vacíos o anidados.
bloque : lineas instruccionesBloque;
instruccionesBloque : sentencia lineas instruccionesBloque | ;

// Condicionales y ciclos
condicional : SI expresion ENTONCES bloque alternativa FIN;
alternativa : SINO bloque | ;
repeticion : REPETIR expresion VECES bloque FIN;
mientras : MIENTRAS expresion HACER bloque FIN;

// Definición de funciones, parámetros, tipos y retorno
funcion : DEFINIR ID PAREN_IZQ parametrosOpt PAREN_DER DEVUELVE tipo bloque FIN;
parametrosOpt : parametros | ;
parametros : parametro restoParametros;
restoParametros : COMA parametro restoParametros | ;
parametro : tipo ID;
tipo : TIPO_NUMERO | TIPO_TEXTO | TIPO_LOGICO;
retorno : DEVOLVER expresion;

// Llamadas a funciones y argumentos
llamada : ID PAREN_IZQ argumentosOpt PAREN_DER;
argumentosOpt : argumentos | ;
argumentos : expresion restoArgumentos;
restoArgumentos : COMA expresion restoArgumentos | ;

// Instrucciones de motivación
motivacion : JUEGO | CALCULADORA;

// Expresiones y operadores lógicos
// Prioridad: disyunción, conjunción, negación, comparación, suma, producto y unaria.
// Las operaciones aritméticas se leen de izquierda a derecha.
expresion : disyuncion;
disyuncion : conjuncion restoO;
restoO : O conjuncion restoO | ;
conjuncion : negacion restoY;
restoY : Y negacion restoY | ;
negacion : NO negacion | comparacion;

// Comparaciones
comparacion : suma comparacionOpt;
comparacionOpt : operadorComparacion suma | ;
operadorComparacion
    : ES IGUAL A
    | ES DIFERENTE DE
    | ES MAYOR QUE
    | ES MENOR QUE
    | ES MAYOR O IGUAL QUE
    | ES MENOR O IGUAL QUE
    ;

// Operaciones aritméticas y negación numérica
suma : producto restoSuma;
restoSuma : SUMA producto restoSuma | RESTA producto restoSuma | ;
producto : unaria restoProducto;
restoProducto : MULT unaria restoProducto | DIV unaria restoProducto | ;
unaria : RESTA unaria | primaria;

// Expresiones primarias: valores, nombres y agrupaciones
primaria
    : NUMERO
    | TEXTO
    | VERDADERO
    | FALSO
    | llamada
    | ID
    | PAREN_IZQ expresion PAREN_DER
    | aleatorio
    ;

// Números aleatorios y límites del rango
// Límites: números con menos opcional o variables.
// La semántica comprueba tipos y, si se conocen los valores, enteros y orden.
aleatorio : TIPO_NUMERO ALEATORIO ENTRE limite Y limite;
limite : RESTA NUMERO | NUMERO | ID;
