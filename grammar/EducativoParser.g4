parser grammar EducativoParser;

options {
    tokenVocab = EducativoLexer;
}

// Una instruccion por linea; la ultima puede terminar directamente en EOF.
programa
    : SALTO_LINEA* (sentencia SALTO_LINEA+)* sentencia? EOF
    ;

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

declaracion : CREAR VARIABLE ID;
asignacion : ASIGNAR ID VALOR DE expresion;
salida : MOSTRAR expresion;
entrada : PREGUNTAR TEXTO Y GUARDAR EN ID;

// Cada encabezado y cada instruccion del bloque terminan con salto de linea.
// Se permiten bloques vacios, lineas en blanco y bloques anidados.
bloque : SALTO_LINEA+ (sentencia SALTO_LINEA+)*;

condicional : SI expresion ENTONCES bloque (SINO bloque)? FIN;
repeticion : REPETIR expresion VECES bloque FIN;
mientras : MIENTRAS expresion HACER bloque FIN;

funcion : DEFINIR ID (CON parametros)? DEVUELVE tipo bloque FIN;
parametros : parametro (COMA parametro)*;
parametro : tipo ID;
tipo : TIPO_NUMERO | TIPO_TEXTO | TIPO_LOGICO;
retorno : DEVOLVER expresion;
llamada : ID PAREN_IZQ argumentos? PAREN_DER;
argumentos : expresion (COMA expresion)*;
motivacion : JUEGO | CALCULADORA;

// Precedencia, de menor a mayor: o, y, no, comparacion, +/-, */ y menos unario.
// Las listas de operadores aritmeticos se interpretaran de izquierda a derecha.
expresion : disyuncion;
disyuncion : conjuncion (O conjuncion)*;
conjuncion : negacion (Y negacion)*;
negacion : NO negacion | comparacion;
comparacion : suma (operadorComparacion suma)?;
operadorComparacion
    : ES IGUAL A
    | ES DIFERENTE DE
    | ES MAYOR QUE
    | ES MENOR QUE
    | ES MAYOR O IGUAL QUE
    | ES MENOR O IGUAL QUE
    ;
suma : producto ((SUMA | RESTA) producto)*;
producto : unaria ((MULT | DIV) unaria)*;
unaria : RESTA unaria | primaria;
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

// Los limites son literales numericos (con signo opcional) o variables.
// Enteros, tipos y orden del rango se comprobaran en las etapas posteriores.
aleatorio : TIPO_NUMERO ALEATORIO ENTRE limite Y limite;
limite : RESTA? NUMERO | ID;
