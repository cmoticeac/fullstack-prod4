# TODO LIST

## BACKLOG
* Websockets en Apollo:
https://www.apollographql.com/docs/apollo-server/data/subscriptions/#schema-definition
* Hay dos opciones:
    * Seguir los pasos de la web tal cual, sin usar socket.io en el server, sino la librería ws
        (para el cliente, sí podemos exponer públicamente el código de socket.io)
    * Intentar adaptar los pasos de la web con los sockets de socket-io que ya tenemos.
* TEST de carga de archivos en Linux (ahora que ya funciona en Windows)

## TODO


## DOING



## DONE
### 2023-12-19
* BUG: la generación de la ruta para guardar el archivo subido tiene formato de URL, que es válido en Linux/Mac pero no en Windows. Corregirlo para que funcione también en Windows:
    * https://github.com/nodejs/node/issues/37845
    * https://nodejs.org/api/url.html#url_url_fileurltopath_url
    * RESUELTO en `/handlers/upload.js`
