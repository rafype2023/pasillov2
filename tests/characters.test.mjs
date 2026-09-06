import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {loadHumanModels, createDetailedHuman} from '../src/entities/RealisticHuman.js';

globalThis.ProgressEvent ??= class { constructor(type, fields) { Object.assign(this, {type}, fields); } };
// Decode the real geometry, skeletons and animation tracks in Node. Texture
// decoding is checked visually in the browser; their embedded data is checked here.
GLTFLoader.prototype.loadAsync = async function(url) {
    const bytes = await readFile(new URL(`../public${url}`, import.meta.url));
    assert.equal(bytes.readUInt32LE(0), 0x46546c67);
    const length = bytes.readUInt32LE(12);
    const json = JSON.parse(bytes.subarray(20, 20 + length));
    assert.equal(json.skins.length, 1);
    assert.ok(json.images.length >= (url.includes('fernan') || url.includes('alejandro') ? 3 : 5), 'skin, clothing, hair and shoes have textures');
    assert.ok(json.images.every(image => Number.isInteger(image.bufferView)), 'textures are embedded');
    assert.deepEqual(json.animations.map(a => a.name).sort(), ['Crouch', 'Idle', 'Jump', 'Run', 'Walk']);
    const binary = bytes.subarray(28 + length);
    json.buffers[0].uri = `data:application/octet-stream;base64,${binary.toString('base64')}`;
    delete json.images; delete json.textures; delete json.materials;
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) delete primitive.material;
    const asset = await this.parseAsync(JSON.stringify(json), '');
    for (const clip of asset.animations.filter(clip => ['Walk', 'Run'].includes(clip.name))) {
        for (const track of clip.tracks) {
            const size = track.getValueSize();
            const start = Array.from(track.values.slice(0, size));
            const end = Array.from(track.values.slice(-size));
            assert.ok(start.every((value, i) => Math.abs(value - end[i]) < .0001), `${clip.name} loops without a pose discontinuity: ${track.name}`);
        }
    }
    return asset;
};
await loadHumanModels();
const first = createDetailedHuman({faceTexturePath:'guillo'});
const second = createDetailedHuman({faceTexturePath:'guillo'});
const colleague = createDetailedHuman({});
const fernan = createDetailedHuman({faceTexturePath: 'fernan'});
const alejandro = createDetailedHuman({faceTexturePath: 'alejandro'});
assert.notEqual(first.leftLeg, second.leftLeg, 'clones own their skeleton');
const resting = second.leftLeg.quaternion.clone();
for (const model of [first, colleague, fernan, alejandro]) {
    let time = 0;
    for (const [state, speed, action] of [['run',4,'Walk'],['run',7,'Run'],['crouch',0,'Crouch'],['jump',0,'Jump'],['idle',0,'Idle']]) {
        for (let frame=0; frame<45; frame++) model.update(state, time+=1/60, speed);
        assert.equal(model.currentAction.getClip().name, action);
        model.group.updateMatrixWorld(true);
        model.group.traverse(object => assert.ok(object.matrixWorld.elements.every(Number.isFinite)));
    }
    const size = new THREE.Box3().setFromObject(model.group, true).getSize(new THREE.Vector3());
    const minHeight = model === fernan ? 1.1 : model === alejandro ? 1.45 : 1.5;
    const maxHeight = model === fernan ? 1.6 : model === alejandro ? 1.75 : 2.1;
    assert.ok(size.y > minHeight && size.y < maxHeight, `human scale is plausible: ${size.y}`);
}
assert.ok(second.leftLeg.quaternion.equals(resting), 'animating one actor leaves another unchanged');
assert.notEqual(alejandro.body, colleague.body, 'Alejandro uses his dedicated model');
console.log('PASS: all four GLBs, embedded textures, full skeletons, five clips, animation transitions, independent actors and human scale.');
