# Personajes de oficina

`alejandro.glb` es una variante estilizada, delgada y de piel clara latina,
con gafas grandes, nariz redondeada y cabello azul oscuro. Conserva las cinco
animaciones. Su fuente editable está en `art-source/alejandro.blend` y se
reconstruye con `tools/build_alejandro.py`.

Guillo usa `guillo-face.png`, un retrato frontal interpretado a partir de la
captura proporcionada por el usuario, aplicado a la cabeza de `guillo.glb`.
`tools/build_guillo_face.py` actualiza su modelo editable y conserva el cuerpo
y las cinco animaciones.

`fernan.glb` es la variante baja y robusta de Fernan, con un rostro preparado
a partir de la fotografía proporcionada por el usuario. La textura frontal
`fernan-face.png` es una interpretación de esa referencia, no un escaneo 3D.
Conserva las cinco animaciones del personaje base. Su fuente editable está en
`art-source/fernan.blend` y se reconstruye con `tools/build_fernan.py`.

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
