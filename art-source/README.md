# Fuentes editables

Los archivos `.blend` contienen cada personaje con texturas empaquetadas,
esqueleto y cinco acciones. Se pueden editar directamente en Blender y volver
a exportar como GLB, seleccionando el personaje y activando las animaciones.

Las imágenes `*-preview.png` son revisiones de estudio, no capturas del juego.

Para reconstruir desde los recursos originales, `tools/build_characters.py`
usa Blender 5.1, MPFB en `/tmp/fbpr-mpfb/mpfb2-master/src` y el paquete gráfico
MakeHuman CC0 extraído en `/tmp/fbpr-human-user/data`. Esas dependencias
temporales deben descargarse nuevamente si se borran. No son necesarias para
editar los archivos Blender empaquetados ni para ejecutar el juego.
