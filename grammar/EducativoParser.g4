parser grammar EducativoParser;

options {
    tokenVocab = EducativoLexer;
}

// Una instrucción por línea; la última puede terminar en EOF.
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

// El encabezado y las instrucciones del bloque necesitan un salto.
// Los bloques pueden estar vacíos o anidados.
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

// Prioridad: o, y, no, comparación, +/-, */ y menos unario.
// Las operaciones aritméticas se leen de izquierda a derecha.
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

// Límites: números con menos opcional o variables.
// Falta validar los tipos y el orden del rango.
aleatorio : TIPO_NUMERO ALEATORIO ENTRE limite Y limite;
limite : RESTA? NUMERO | ID;
