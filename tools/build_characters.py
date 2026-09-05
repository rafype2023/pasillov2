"""Build clothed, skinned office characters from the CC0 MakeHuman assets.

Run with Blender in background mode. MPFB and the system asset pack are only
build-time dependencies; the game loads the self-contained GLB exports.
"""
import math
import os
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector, Quaternion

ROOT = Path(__file__).resolve().parents[1]
ASSETS = Path('/tmp/fbpr-human-user/data')
sys.path.insert(0, '/tmp/fbpr-mpfb/mpfb2-master/src')
bpy.utils.extension_path_user = lambda *args, **kwargs: '/tmp/fbpr-human-user'

import mpfb
bpy.context.preferences.addons.new().module = 'mpfb'
original_preference = mpfb.get_preference
mpfb.get_preference = lambda key: '/tmp/fbpr-human-user' if key == 'mpfb_user_data' else original_preference(key)

def task_resource(kind, path='', create=False):
    dest = os.path.join('/tmp/fbpr-blender-user', kind, path)
    os.makedirs(dest, exist_ok=True)
    return dest

bpy.utils.user_resource = task_resource
mpfb.register()
from mpfb.services.humanservice import HumanService
from mpfb.services.targetservice import TargetService


def material(obj, name, mhmat_path, roughness=.65, alpha=False):
    values = {}
    for line in mhmat_path.read_text().splitlines():
        parts = line.split(maxsplit=1)
        if len(parts) == 2 and not line.startswith('#'):
            values[parts[0]] = parts[1]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Specular IOR Level'].default_value = .28
    if name == 'Skin':
        bsdf.inputs['Subsurface Weight'].default_value = .065
        bsdf.inputs['Subsurface Radius'].default_value = (1, .35, .2)
    for key, socket in [('diffuseTexture', 'Base Color'), ('normalmapTexture', 'Normal')]:
        if key not in values:
            continue
        path = (mhmat_path.parent / values[key]).resolve()
        if not path.exists():
            raise FileNotFoundError(path)
        image = bpy.data.images.load(str(path), check_existing=True)
        if max(image.size) > 2048:
            ratio = 2048 / max(image.size)
            image.scale(round(image.size[0] * ratio), round(image.size[1] * ratio))
        node = mat.node_tree.nodes.new('ShaderNodeTexImage')
        node.image = image
        if key == 'normalmapTexture':
            image.colorspace_settings.name = 'Non-Color'
            normal = mat.node_tree.nodes.new('ShaderNodeNormalMap')
            normal.inputs['Strength'].default_value = .65
            mat.node_tree.links.new(node.outputs['Color'], normal.inputs['Color'])
            mat.node_tree.links.new(normal.outputs['Normal'], bsdf.inputs[socket])
        else:
            mat.node_tree.links.new(node.outputs['Color'], bsdf.inputs[socket])
            if alpha:
                mat.node_tree.links.new(node.outputs['Alpha'], bsdf.inputs['Alpha'])
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    return mat


def asset(human, category, name, material_name=None, roughness=.65, alpha=False):
    directory = ASSETS / category / name
    obj = HumanService.add_mhclo_asset(str(directory / (name + '.mhclo')), human,
        asset_type=category.capitalize(), subdiv_levels=0, material_type='MAKESKIN')
    mhmat = directory / (name + '.mhmat')
    if mhmat.exists():
        material(obj, material_name or name, mhmat, roughness, alpha)
    return obj


def rotate_world(bone, axis, radians):
    # Animate anatomical motion in armature space, independent of bone roll.
    local_axis = bone.bone.matrix_local.to_3x3().inverted() @ Vector(axis)
    bone.rotation_quaternion = Quaternion(local_axis.normalized(), radians)


def business_casual(clothes, human, rig, name):
    # Tailor the fitted long-sleeve shirt into a short-sleeve shirt. Preserve
    # interpolated UVs and skin weights along the new sleeve openings.
    bm = bmesh.new()
    bm.from_mesh(clothes.data)
    scale = rig.data.bones['mixamorig:LeftArm'].head_local.z / 1.3762896
    for side in ['Left', 'Right']:
        arm = rig.data.bones['mixamorig:' + side + 'Arm']
        normal = (arm.tail_local - arm.head_local).normalized()
        point = arm.head_local.lerp(arm.tail_local, .58)
        sign = 1 if side == 'Left' else -1
        faces = [f for f in bm.faces if any(v.co.x * sign > .23 * scale and v.co.z > .75 * scale for v in f.verts)]
        verts = set(v for f in faces for v in f.verts)
        edges = set(e for f in faces for e in f.edges)
        bmesh.ops.bisect_plane(bm, geom=list(verts) + list(edges) + faces,
            plane_co=point, plane_no=normal, clear_outer=True, dist=.00001)
        # Reveal the skin beneath the removed sleeves before applying masks.
        exposed = [v.index for v in human.data.vertices if v.co.x * sign > .20 * scale and v.co.z > .75 * scale
            and (v.co - point).dot(normal) > -.08 * scale]
        for modifier in human.modifiers:
            if modifier.type == 'MASK' and modifier.invert_vertex_group:
                group = human.vertex_groups.get(modifier.vertex_group)
                if group:
                    group.remove(exposed)
    # Close decorative tears inherited from the denim source before turning
    # the trousers into office chinos; leave waist and ankle openings intact.
    tears = [e for e in bm.edges if e.is_boundary and all(.12 * scale < v.co.z < .85 * scale for v in e.verts)]
    if tears:
        bmesh.ops.holes_fill(bm, edges=tears, sides=0)
    bm.to_mesh(clothes.data)
    bm.free()

    pants = clothes.data.materials[0].copy()
    pants.name = 'ChinoPants'
    bsdf = pants.node_tree.nodes.get('Principled BSDF')
    for link in list(bsdf.inputs['Base Color'].links):
        pants.node_tree.links.remove(link)
    bsdf.inputs['Base Color'].default_value = (.42, .34, .22, 1) if name == 'guillo' else (.12, .14, .16, 1)
    bsdf.inputs['Roughness'].default_value = .85
    clothes.data.materials.append(pants)
    clothes.data.update()
    for poly in clothes.data.polygons:
        if poly.center.z < .95 * scale:
            poly.material_index = 1


def animate(rig):
    rig.animation_data_create()
    bones = rig.pose.bones
    def bone(name):
        return bones['mixamorig:' + name]
    for b in bones:
        b.rotation_mode = 'QUATERNION'
    bpy.context.scene.render.fps = 30
    for name, frames in [('Idle', 90), ('Walk', 30), ('Run', 22), ('Crouch', 60), ('Jump', 30)]:
        action = bpy.data.actions.new(name)
        rig.animation_data.action = action
        for frame in range(1, frames + 2):
            phase = (frame - 1) / frames * math.tau
            for b in bones:
                b.rotation_quaternion = Quaternion()
                b.location = (0, 0, 0)
            # The supplied mesh has an A-pose with elbows bent; relax the arms.
            for side, sign in [('Left', 1), ('Right', -1)]:
                rotate_world(bone(side + 'Arm'), (0, 1, 0), sign * .52)
            stride = .38 if name == 'Walk' else .65 if name == 'Run' else .0
            if stride:
                for side, sign in [('Left', 1), ('Right', -1)]:
                    leg_phase = phase + (0 if sign == 1 else math.pi)
                    swing = math.cos(leg_phase)
                    # Positive X bends the knee toward the back of the body.
                    # Lift the heel during recovery; keep the support leg long.
                    lift = max(0, math.sin(leg_phase)) ** 2
                    thigh = swing * stride
                    knee = .06 + lift * (.72 if name == 'Walk' else 1.35)
                    rotate_world(bone(side + 'UpLeg'), (1, 0, 0), thigh)
                    rotate_world(bone(side + 'Leg'), (1, 0, 0), knee)
                    rotate_world(bone(side + 'Foot'), (1, 0, 0), -(thigh + knee) * .75)
                    arm = bone(side + 'Arm')
                    local = arm.bone.matrix_local.to_3x3().inverted() @ Vector((1, 0, 0))
                    arm.rotation_quaternion @= Quaternion(local.normalized(), -swing * stride * .75)
                    rotate_world(bone(side + 'ForeArm'), (1, 0, 0), -.12 if name == 'Walk' else -.65)
                rotate_world(bone('Spine'), (1, 0, 0), .04 if name == 'Walk' else .12)
                rotate_world(bone('Spine2'), (0, 0, 1), math.sin(phase) * .035)
                rotate_world(bone('Hips'), (0, 0, 1), -math.sin(phase) * .035)
                bob = (.015 if name == 'Walk' else .035) * (1 - math.cos(2 * phase))
                bone('Hips').location = bone('Hips').bone.matrix_local.to_3x3().inverted() @ Vector((.012 * math.sin(phase), 0, bob))
            elif name == 'Crouch':
                for side in ['Left', 'Right']:
                    rotate_world(bone(side + 'UpLeg'), (1, 0, 0), .75)
                    rotate_world(bone(side + 'Leg'), (1, 0, 0), -1.1)
                rotate_world(bone('Spine'), (1, 0, 0), .25)
                bone('Hips').location = bone('Hips').bone.matrix_local.to_3x3().inverted() @ Vector((0, 0, -.24))
            elif name == 'Jump':
                for side in ['Left', 'Right']:
                    rotate_world(bone(side + 'UpLeg'), (1, 0, 0), .35)
                    rotate_world(bone(side + 'Leg'), (1, 0, 0), -.55)
                    rotate_world(bone(side + 'ForeArm'), (1, 0, 0), .5)
            else:
                rotate_world(bone('Spine2'), (1, 0, 0), math.sin(phase) * .007)
                rotate_world(bone('Head'), (0, 0, 1), math.sin(phase) * .014)
            for b in bones:
                b.keyframe_insert('rotation_quaternion', frame=frame, group=b.name)
                if b.name.endswith('Hips'):
                    b.keyframe_insert('location', frame=frame, group=b.name)
        action.use_fake_user = True
    rig.animation_data.action = bpy.data.actions['Idle']
    bpy.context.scene.frame_set(1)


def preview(name):
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 24
    scene.render.resolution_x = 850
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 100
    scene.world.color = (.14, .14, .14)
    bpy.ops.object.camera_add(location=(2.4, -4.4, 1.8))
    cam = bpy.context.object
    cam.rotation_euler = (Vector((0, 0, .95)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    cam.data.lens = 68
    scene.camera = cam
    for location, power, size in [((2, -3, 4), 170, 3), ((-3, -1, 2), 75, 3), ((1, 2, 3), 180, 2)]:
        bpy.ops.object.light_add(type='AREA', location=location)
        light = bpy.context.object
        light.data.energy = power
        light.data.shape = 'DISK'
        light.data.size = size
        light.rotation_euler = (Vector((0, 0, 1)) - light.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.mesh.primitive_plane_add(size=200)
    plane = bpy.context.object
    mat = bpy.data.materials.new('StudioFloor')
    mat.diffuse_color = (.055, .065, .075, 1)
    plane.data.materials.append(mat)
    scene.render.filepath = str(ROOT / 'art-source' / (name + '-preview.png'))
    bpy.ops.render.render(write_still=True)


(ROOT / 'public/models').mkdir(parents=True, exist_ok=True)
(ROOT / 'art-source').mkdir(exist_ok=True)
for name, age, suit, hair, skin in [
    ('guillo', .57, 'male_casualsuit01', 'short01', 'middleage_caucasian_male'),
    ('colleague', .37, 'male_casualsuit01', 'short02', 'young_caucasian_male')
]:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    macro = TargetService.get_default_macro_info_dict()
    macro.update(gender=1.0, age=age, muscle=.46, weight=.48)
    human = HumanService.create_human(macro_detail_dict=macro)
    human.name = 'Skin'
    rig = HumanService.add_builtin_rig(human, 'mixamo')
    rig.name = 'OfficeCharacter'
    material(human, 'Skin', ASSETS / 'skins' / skin / (skin + '.mhmat'), .58)
    clothes = asset(human, 'clothes', suit, 'OfficeClothes')
    bpy.context.view_layer.objects.active = human
    if human.data.shape_keys:
        bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
    business_casual(clothes, human, rig, name)
    asset(human, 'clothes', 'shoes01', 'LeatherShoes', .38)
    asset(human, 'hair', hair, 'Hair', .8, True)
    asset(human, 'eyebrows', 'eyebrow001', 'Eyebrows', .85, True)
    eyes = asset(human, 'eyes', 'high-poly')
    material(eyes, 'Eyes', ASSETS / 'eyes/materials/brown.mhmat', .2)
    for obj in list(bpy.context.scene.objects):
        if obj.type != 'MESH':
            continue
        bpy.context.view_layer.objects.active = obj
        if obj.data.shape_keys:
            bpy.ops.object.shape_key_remove(all=True, apply_mix=True)
        for modifier in list(obj.modifiers):
            if modifier.type != 'ARMATURE':
                bpy.ops.object.modifier_apply(modifier=modifier.name)
        for face in obj.data.polygons:
            face.use_smooth = True
    animate(rig)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=str(ROOT / 'public/models' / (name + '.glb')),
        export_format='GLB', use_selection=True, export_animations=True,
        export_animation_mode='ACTIONS', export_skins=True, export_morph=False,
        export_image_format='JPEG', export_image_quality=88, export_yup=True)
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'art-source' / (name + '.blend')))
    preview(name)
    print('CHARACTER_COMPLETE', name, flush=True)
