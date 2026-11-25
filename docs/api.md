# API de compilación y ejecución de `.edu`

La API admite solicitudes anónimas. El cliente envía cuerpos y mensajes de
texto JSON en UTF-8.

## Compilar

Envía `POST /compilar` con `Content-Type: application/json` y el texto del editor.

```json
{"codigo":"mostrar 42\n"}
```

Con `200`, el cuerpo contiene el [código intermedio de versión 1](intermedio.md)
que también exporta la terminal. Con `422`, el cuerpo contiene `diagnosticos`.
Cada posición empieza en 1 y puede ser `null` si la etapa desconoce su valor.

```json
{
  "diagnosticos": [
    {"etapa":"semantica","mensaje":"la variable 'dato' no está declarada.","linea":1,"columna":9}
  ]
}
```

Las etapas del compilador se identifican como `lexer`, `gramatica`, `semantica`
e `intermedio`. La API usa `peticion`, `protocolo`, `ejecucion`, `limite` y
`servicio` para los demás diagnósticos. Usa `403` para orígenes web ajenos a
la lista configurada, `413` para solicitudes demasiado
grandes, `429` para límites por IP, `503` si todos los cupos están ocupados y
`504` si se agota el plazo del subproceso. Un fallo inesperado del subproceso
devuelve `500`.

El editor puede enviar el texto tras una pausa al escribir y aplicar los
diagnósticos solo si la respuesta corresponde a la versión actual del texto.

## Ejecutar

Abre `/ejecutar` y envía un único mensaje de inicio con el objeto recibido al
compilar, por ejemplo `{"tipo":"iniciar","intermedio":{"version":1,"instrucciones":[]}}`.
Cada conexión mantiene el estado de un programa hasta que se cierra.

| Evento del servidor | Contenido |
| --- | --- |
| `salida` | `texto` contiene un valor de `mostrar`. |
| `pregunta` | `mensaje` contiene el texto de la pregunta. Envía `{"tipo":"respuesta","texto":"…"}` cuando llegue este evento. |
| `entrada_invalida` | `mensaje` indica el tipo esperado. El siguiente evento vuelve a emitir la pregunta. |
| `fin` | La ejecución terminó correctamente. |
| `error` | `diagnosticos` explica el error e incluye las posiciones cuando están disponibles. |

El servidor cierra la conexión después de `fin` o `error`. Un origen web ajeno
a la lista configurada recibe `403` durante la negociación. Al superar los
límites de tasa o concurrencia, la negociación devuelve `429` o `503`.

| Límite | Valor inicial |
| --- | --- |
| Fuente / cuerpo HTTP / mensaje WebSocket | 64 KiB / 1 MiB / 1 MiB |
| Salida de `mostrar` por ejecución | 64 KiB de texto UTF-8. Un evento vacío consume un byte del cupo. |
| Plazo por compilación / por pregunta / por sesión | 5 s / 30 s por pregunta emitida / 2 min |
| Memoria virtual / CPU por subproceso en Linux | 256 MiB / 2 s |
| Cupos globales disponibles | 2 compilaciones y 4 ejecuciones simultáneas |
| Ventana móvil por IP | 120 solicitudes de compilación y 10 intentos de apertura WebSocket por minuto |
| Cupo por IP | 1 ejecución simultánea |

Una respuesta de compilación puede superar 1 MiB si el código genera muchas
instrucciones. Para una ejecución interactiva, el mensaje `iniciar` completo
debe caber en 1 MiB. El servidor WebSocket puede cerrar con código `1009` antes
de que el mensaje llegue a la aplicación si supera ese tamaño. El supervisor
recoge el subproceso al finalizar, al vencer un plazo o al detectar la desconexión.

## Orígenes del editor

`EDU_ORIGENES` admite una lista de orígenes exactos separados por comas para
HTTP (CORS) y WebSocket. Incluye el esquema y el puerto si corresponde, como en
`https://editor.example.com,http://localhost:5173`. Con el valor vacío se
rechazan las solicitudes con `Origin`. Los clientes directos que omiten
`Origin` pueden usar la API anónima.

## Despliegue en Render

Cuando `main` incluya la API y los archivos de Docker, crea un Blueprint de
Render con `render.yaml`. El Blueprint define el servicio web Free
`code-compiler-api` y comprueba su salud en `/openapi.json`. Introduce el
origen real del editor en `EDU_ORIGENES` al crear el Blueprint. [Referencia de Blueprints](https://render.com/docs/blueprint-spec)

Render establece `RENDER=true`. En ese entorno, la API usa una única dirección
IPv4 o IPv6 válida de `CF-Connecting-IP` para aplicar los límites. Si falta la
cabecera o su valor es inválido, usa la IP de la conexión. El contenedor
desactiva el procesamiento de cabeceras de proxy de Uvicorn. [Variables de Render](https://render.com/docs/environment-variables) · [IP del cliente en Render](https://render.com/articles/host-pocketbase-on-render)

Para comprobar la imagen localmente con un puerto configurable, ejecuta desde
la raíz del repositorio los siguientes comandos.

```bash
docker build -t code-compiler-api .
docker run --rm -p 127.0.0.1:8000:8000 -e PORT=8000 \
  -e EDU_ORIGENES=http://localhost:5173 code-compiler-api
```

Comprueba `/openapi.json`, compila `mostrar 42` y ejecuta el resultado por
WebSocket. Repite el intento HTTP y la apertura de WebSocket con otro origen
y comprueba que ambos devuelven `403`.

Antes de compartir la URL pública, prueba `https://<servicio>.onrender.com/compilar`
y `wss://<servicio>.onrender.com/ejecutar` desde el origen real del editor.
Para comprobar los cupos por IP, mantén una ejecución esperando una respuesta
y abre otra desde una conexión con una IP pública distinta. Ambas deben poder
ejecutarse a la vez. Otra apertura desde la primera IP debe recibir `429`.
[WebSockets en Render](https://render.com/docs/websocket)

## Despliegue manual en Linux

Instala `requirements.txt` y ejecuta `make generar` según el [README](../README.md).
Inicia un proceso ASGI como usuario sin privilegios desde la raíz del repo.

```bash
EDU_ORIGENES=https://editor.example.com python -m uvicorn web.api:app --app-dir src \
  --host 127.0.0.1 --port 8000 --workers 1 --proxy-headers \
  --forwarded-allow-ips 127.0.0.1 --ws websockets-sansio --ws-max-size 1048576 \
  --ws-per-message-deflate false --no-access-log
```

Ejemplo de proxy nginx en el mismo servidor. Sustituye el dominio y las rutas
del certificado. Las cabeceras de IP se establecen desde la conexión al proxy.
Mantén Uvicorn en la interfaz local. [Configuración de Uvicorn](https://uvicorn.dev/settings/)

```nginx
map $http_upgrade $edu_connection {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl;
    server_name api.example.com;
    ssl_certificate /ruta/fullchain.pem;
    ssl_certificate_key /ruta/privkey.pem;
    access_log off;

    client_max_body_size 1m;
    client_body_buffer_size 1m;
    client_body_timeout 10s;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $edu_connection;
        proxy_read_timeout 130s;
        proxy_buffering off;
    }
}
```

El proxy termina HTTPS/WSS. Uvicorn usa la IP reenviada por ese proxy para
aplicar los límites. La aplicación registra por operación el estado y la
duración, así como el código de salida de un subproceso fallido. El intercambio
de programas y respuestas usa memoria y tuberías. Los límites y cupos por IP
residen en memoria del proceso ASGI, por lo que este despliegue usa un solo
proceso. [Proxy WebSocket de nginx](https://nginx.org/en/docs/http/websocket.html)
