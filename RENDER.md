# Publicar PASILLO GAMES en Render

El juego funciona como sitio estático: no necesita servidor ni base de datos.

1. En Render, selecciona **New → Static Site**.
2. Conecta el repositorio `rafype2023/pasillov2`.
3. Selecciona la rama `main`.
4. Usa `npm ci && npm run build` como **Build Command**.
5. Usa `dist` como **Publish Directory**.
6. Añade la variable `NODE_VERSION` con valor `24.14.0`.
7. Pulsa **Create Static Site**. Render asignará una dirección HTTPS.

También puedes usar **New → Blueprint** con este repositorio; `render.yaml`
incluye la configuración del sitio estático.

Render ofrece sitios estáticos gratuitos, sujetos a los límites de ancho de
banda y minutos de compilación de la cuenta: https://render.com/docs/free.

## Estado de esta versión

- Personajes humanos GLB con texturas, esqueleto y cinco animaciones.
- Cámara inicial en tercera persona y mejoras de iluminación.
- Rutas por los pasillos, colisiones y reinicio corregidos.
- Pruebas locales: `npm test`.
- Compilación: `npm run build`.

Los personajes del juego están en `public/models`. Los originales editables
están en `art-source`; Render no los incluye en el sitio compilado.
