"""Apply the supplied Guillo portrait to his existing editable animated model."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art-source/guillo.blend'))
rig=bpy.data.objects['OfficeCharacter']
rig.data.pose_position='REST'
skin=bpy.data.objects['Skin']
# Widen the head slightly to fit the reference without changing body proportions.
if not skin.get('guillo_reference_shape'):
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH': continue
        for v in obj.data.vertices:
            blend=max(0,min(1,(v.co.z-1.48)/.045))
            v.co.x*=1+.20*blend
            if obj.name=='Skin.short01' and v.co.z>1.69:
                v.co.z=1.69+(v.co.z-1.69)*.55
    skin['guillo_reference_shape']=True

photo=bpy.data.images.load(str(ROOT/'public/models/guillo-face.png'))
old=skin.data.uv_layers.get('GuilloFront')
if old:skin.data.uv_layers.remove(old)
face=bpy.data.materials.new('Guillo reference face');face.use_nodes=True
bsdf=face.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.72
tex=face.node_tree.nodes.new('ShaderNodeTexImage');tex.image=photo
uvnode=face.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='GuilloFront'
face.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
face.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
skin.data.materials.append(face);face_index=len(skin.data.materials)-1
uv=skin.data.uv_layers.new(name='GuilloFront')
# Frontal projection uses anatomical coordinates before body deformation.
for poly in skin.data.polygons:
    c=poly.center
    if c.z>1.49 and c.y<-.035:
        poly.material_index=face_index
    for li in poly.loop_indices:
        p=skin.data.vertices[skin.data.loops[li].vertex_index].co
        uv.data[li].uv=(.5+p.x/.262, (p.z-1.49)/.24)
rig.data.pose_position='POSE';bpy.context.scene.frame_set(2);bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/guillo.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_morph=False,export_image_format='JPEG',export_image_quality=90,export_yup=True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art-source/guillo.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=850;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.world.color=(.18,.18,.18)
bpy.ops.object.camera_add(location=(.25,-3.6,1.65));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,1.0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=65;scene.camera=cam
for loc,power,size in [((2,-3,4),230,3),((-3,-2,2),150,3),((1,2,3),170,2)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200)
scene.render.filepath=str(ROOT/'art-source/guillo-preview.png');bpy.ops.render.render(write_still=True)
