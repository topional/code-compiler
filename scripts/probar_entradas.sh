#!/usr/bin/env bash
# Comprueba las entradas .edu de gramática y semántica por su carpeta y etapa.
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."
interprete=${1:-.venv/bin/python}
grupo=${2:-todos}

case "$grupo" in
    todos) etapas=(gramatica semantica) ;;
    gramatica|semantica) etapas=("$grupo") ;;
    *) echo "Grupo inválido: $grupo. Usa gramatica, semantica o todos." >&2; exit 2 ;;
esac

if ! command -v -- "$interprete" >/dev/null; then
    echo "No se encuentra el intérprete Python: $interprete" >&2
    exit 2
fi

temporal=$(mktemp -d)
trap 'rm -rf -- "$temporal"' EXIT
shopt -s nullglob
total=0
fallos=0

for etapa in "${etapas[@]}"; do
    if [[ "$etapa" == gramatica ]]; then
        prefijo='Error sintáctico en '
        confirmacion='Análisis sintáctico correcto.'
    else
        prefijo='Error semántico en '
        confirmacion='Análisis semántico correcto.'
    fi

    for clase in validos invalidos; do
        entradas=("tests/$etapa/$clase/"*.edu)
        if (( ${#entradas[@]} == 0 )); then
            echo "No hay entradas .edu en tests/$etapa/$clase." >&2
            exit 2
        fi

        for entrada in "${entradas[@]}"; do
            total=$((total + 1))
            estado=0
            "$interprete" src/main.py "$entrada" --etapa "$etapa" \
                >"$temporal/salida" 2>"$temporal/errores" || estado=$?
            pasa=false

            if [[ "$clase" == validos ]]; then
                if [[ "$estado" == 0 && ! -s "$temporal/errores" ]] && \
                    grep -Fxq -- "$confirmacion" "$temporal/salida"; then
                    pasa=true
                fi
            else
                # Un error de otra etapa, un fallo de Python o un archivo ausente no sirven.
                if [[ "$estado" == 1 && ! -s "$temporal/salida" && -s "$temporal/errores" ]] && \
                    ! grep -qv -- "^$prefijo" "$temporal/errores"; then
                    pasa=true
                fi
            fi

            if "$pasa"; then
                echo "OK    $entrada"
            else
                fallos=$((fallos + 1))
                echo "FALLO $entrada (código de salida: $estado)"
                if [[ "$clase" == validos ]]; then
                    echo "      Se esperaba aceptación sin errores."
                else
                    echo "      Se esperaba rechazo con: $prefijo..."
                fi
                cat "$temporal/salida" "$temporal/errores"
            fi
        done
    done
done

echo "$total entradas revisadas: $((total - fallos)) correctas y $fallos fallos."
(( fallos == 0 ))
