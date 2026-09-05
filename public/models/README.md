# Personajes de oficina

`guillo.glb` y `colleague.glb` contienen geometría humana, esqueleto, texturas
integradas y las animaciones Idle, Walk, Run, Crouch y Jump. Son personajes
genéricos; no son escaneos ni reproducciones fieles de los compañeros.

Vestuario: camisas con cuello de manga corta y pantalones chinos (caqui o
gris). Las mangas y los pantalones están adaptados al estilo business casual
de la oficina; los personajes humanos no llevan chaqueta ni corbata.

Los modelos y las texturas proceden de los recursos gráficos CC0 de MakeHuman:
- https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html
- https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md

La herramienta de creación MPFB se distribuye por separado bajo GPL:
https://github.com/makehumancommunity/mpfb2
No se incluye su código en el juego. Las animaciones se construyen en
`tools/build_characters.py`; no son captura de movimiento.

Los archivos editables con texturas empaquetadas están en `art-source/`.
El juego solo necesita los GLB; no necesita Blender ni una conexión externa.
