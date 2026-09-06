"""Build Alejandro as a stylized, animated office character."""
import bpy
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT / 'art-source' / 'colleague.blend'))
rig = bpy.data.objects['OfficeCharacter']
rig.data.pose_position = 'REST'

# Slim silhouette, slightly larger head and clear, non-yellow Latino skin tone.
for obj in list(bpy.context.scene.objects):
    if obj.type != 'MESH':
        continue
    for vertex in obj.data.vertices:
        z = vertex.co.z
        head = max(0.0, min(1.0, (z - 1.34) / .08))
        torso = max(0.0, 1.0 - abs(z - 1.05) / .42)
        vertex.co.x *= 1.0 - .12 * torso + .13 * head
        vertex.co.y *= 1.0 - .08 * torso + .08 * head
    obj.data.update()

skin = bpy.data.objects['Skin']
skin_material = skin.data.materials[0]
skin_bsdf = skin_material.node_tree.nodes.get('Principled BSDF')
skin_bsdf.inputs['Base Color'].default_value = (.72, .48, .34, 1)
skin_bsdf.inputs['Roughness'].default_value = .68

# Dark blue hair, a recognizable visual cue without yellow cartoon skin.
hair = bpy.data.objects.get('Skin.short02')
if hair:
    hair_material = hair.data.materials[0].copy()
    hair_material.name = 'Alejandro dark blue hair'
    hair_bsdf = hair_material.node_tree.nodes.get('Principled BSDF')
    for link in list(hair_bsdf.inputs['Base Color'].links):
        hair_material.node_tree.links.remove(link)
    hair_bsdf.inputs['Base Color'].default_value = (.015, .035, .14, 1)
    hair.data.materials[0] = hair_material

def parent_to_head(obj):
    world = obj.matrix_world.copy()
    obj.parent = rig
    obj.parent_type = 'BONE'
    obj.parent_bone = 'mixamorig:Head'
    obj.matrix_world = world

glass = bpy.data.materials.new('Alejandro glasses')
glass.use_nodes = True
glass_bsdf = glass.node_tree.nodes.get('Principled BSDF')
glass_bsdf.inputs['Base Color'].default_value = (.015, .025, .09, 1)
glass_bsdf.inputs['Metallic'].default_value = .15
glass_bsdf.inputs['Roughness'].default_value = .3

# Large round glasses with a bridge. Coordinates are local to the head bone.
for x in (-.052, .052):
    bpy.ops.mesh.primitive_torus_add(major_radius=.047, minor_radius=.005,
        major_segments=32, minor_segments=8, location=(x, -.183, 1.492),
        rotation=(1.5708, 0, 0))
    frame = bpy.context.object
    frame.name = 'Alejandro glasses frame'
    frame.scale.z = 1.08
    frame.data.materials.append(glass)
    parent_to_head(frame)

for x, length in [(0, .014), (-.108, .045), (.108, .045)]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, -.183, 1.492))
    bar = bpy.context.object
    bar.name = 'Alejandro glasses bridge'
    bar.dimensions = (length, .009, .009)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bar.data.materials.append(glass)
    parent_to_head(bar)

# Rounded nose in the same light Latino skin tone.
nose_material = bpy.data.materials.new('Alejandro nose skin')
nose_material.use_nodes = True
nose_bsdf = nose_material.node_tree.nodes.get('Principled BSDF')
nose_bsdf.inputs['Base Color'].default_value = (.58, .37, .27, 1)
nose_bsdf.inputs['Roughness'].default_value = .72
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=16,
    location=(0, -.194, 1.455), scale=(.027, .037, .032))
nose = bpy.context.object
nose.name = 'Alejandro rounded nose'
nose.data.materials.append(nose_material)
parent_to_head(nose)

# Slightly shorter than the other slim colleagues while preserving animation.
rig.scale = (.96, .96, .94)
rig.data.pose_position = 'POSE'
bpy.context.scene.frame_set(2)
bpy.context.scene.frame_set(1)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT / 'public/models/alejandro.glb'),
    export_format='GLB', use_selection=True, export_animations=True,
    export_animation_mode='ACTIONS', export_skins=True, export_morph=False,
    export_image_format='JPEG', export_image_quality=90, export_yup=True)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'art-source/alejandro.blend'))

# Studio preview.
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 24
scene.render.resolution_x = 850
scene.render.resolution_y = 1050
scene.render.resolution_percentage = 100
scene.world.color = (.18, .18, .18)
bpy.ops.object.camera_add(location=(.3, -3.7, 1.65))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, .95)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.lens = 65
scene.camera = camera
for location, power, size in [((2, -3, 4), 230, 3), ((-3, -2, 2), 150, 3), ((1, 2, 3), 170, 2)]:
    bpy.ops.object.light_add(type='AREA', location=location)
    light = bpy.context.object
    light.data.energy = power
    light.data.shape = 'DISK'
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, .9)) - light.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200)
scene.render.filepath = str(ROOT / 'art-source/alejandro-preview.png')
bpy.ops.render.render(write_still=True)
