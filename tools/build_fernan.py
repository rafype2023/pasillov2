"""Create Fernan from the editable colleague rig and supplied face reference."""
import bpy, math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'art-source/colleague.blend'))
rig=bpy.data.objects['OfficeCharacter']
rig.data.pose_position='REST'
# Short limbs, a broad rounded torso, and a fuller head, applied to rig and mesh.
def shape(p):
    x,y,z=p
    # Keep joints in their authored rest positions; widen the belly and face
    # smoothly while leaving the arm and leg attachment points stable.
    center=math.exp(-(abs(x)/.27)**6)
    belly=math.exp(-((z-1.04)/.20)**2)*center
    head=max(0,min(1,(z-1.32)/.07))
    return Vector((x*(1+.60*belly+.45*head), y*(1+.75*belly+.15*head)-.045*belly,z))
# Replace the swept hairstyle with a bald crown. Facial hairline is in the reference.
for name in ['Skin.short02','Skin.eyebrow001']:
    bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
skin=bpy.data.objects['Skin']
photo=bpy.data.images.load(str(ROOT/'public/models/fernan-face.png'))
face=bpy.data.materials.new('Fernan reference face');face.use_nodes=True
bsdf=face.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Roughness'].default_value=.72
tex=face.node_tree.nodes.new('ShaderNodeTexImage');tex.image=photo
uvnode=face.node_tree.nodes.new('ShaderNodeUVMap');uvnode.uv_map='FernanFront'
face.node_tree.links.new(uvnode.outputs['UV'],tex.inputs['Vector'])
face.node_tree.links.new(tex.outputs['Color'],bsdf.inputs['Base Color'])
skin.data.materials.append(face);face_index=len(skin.data.materials)-1
uv=skin.data.uv_layers.new(name='FernanFront')
# Frontal projection uses anatomical coordinates before body deformation.
for poly in skin.data.polygons:
    c=poly.center
    if c.z>1.345 and c.y<-.035:
        poly.material_index=face_index
    for li in poly.loop_indices:
        p=skin.data.vertices[skin.data.loops[li].vertex_index].co
        uv.data[li].uv=(.5+p.x/.218, (p.z-1.345)/.238)
for obj in list(bpy.context.scene.objects):
    if obj.type=='MESH':
        for v in obj.data.vertices:v.co=shape(v.co)
        obj.data.update()
# Uniform rig scale preserves the original animation coordinate frames.
rig.scale=(1.02,1.02,.78)
# Keep existing shirt collar and chinos; change the shirt to the reference blue.
clothes=bpy.data.objects['Skin.male_casualsuit01']
mat=clothes.data.materials[0].copy();mat.name='Fernan blue polo'
node=mat.node_tree.nodes.get('Principled BSDF')
for link in list(node.inputs['Base Color'].links):mat.node_tree.links.remove(link)
node.inputs['Base Color'].default_value=(.025,.10,.32,1)
for link in list(node.inputs['Alpha'].links):mat.node_tree.links.remove(link)
node.inputs['Alpha'].default_value=1
clothes.data.materials[0]=mat
rig.data.pose_position='POSE';bpy.context.scene.frame_set(2);bpy.context.scene.frame_set(1)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/fernan.glb'),export_format='GLB',use_selection=True,export_animations=True,export_animation_mode='ACTIONS',export_skins=True,export_morph=False,export_image_format='JPEG',export_image_quality=90,export_yup=True)
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'art-source/fernan.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=850;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.world.color=(.18,.18,.18)
bpy.ops.object.camera_add(location=(.55,-3.6,1.6));cam=bpy.context.object
cam.rotation_euler=(Vector((0,0,.73))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=65;scene.camera=cam
for loc,power,size in [((2,-3,4),230,3),((-3,-2,2),150,3),((1,2,3),170,2)]:
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.data.energy=power;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.8))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.mesh.primitive_plane_add(size=200)
scene.render.filepath=str(ROOT/'art-source/fernan-preview.png');bpy.ops.render.render(write_still=True)
