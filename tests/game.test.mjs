import assert from 'node:assert/strict';
import * as THREE from 'three';
const ctx = new Proxy({}, {get: (_, key) => key === 'measureText' ? () => ({width: 40}) : key === 'createLinearGradient' || key === 'createRadialGradient' ? () => ({addColorStop(){}}) : () => {}});
globalThis.document = {createElement: () => ({getContext: () => ctx}), getElementById: () => null};
globalThis.window = {addEventListener(){}};
THREE.TextureLoader.prototype.load = () => new THREE.Texture();
const {FloorPlan} = await import('../src/office/FloorPlan.js');
const {Player} = await import('../src/entities/Player.js');
const {HumanoidBuilder} = await import('../src/entities/HumanoidBuilder.js');
const scene = new THREE.Scene();
const floor = new FloorPlan(scene);
const camera = new THREE.PerspectiveCamera();
const player = new Player(scene, camera, {});
player.die(); player.spawn(floor.spawnPoint);
assert.equal(player.mesh.rotation.x, 0, 'restart restores upright player');
assert.equal(player.isDead, false);
assert.equal(player.cameraMode, 'third');
player.toggleCameraMode(); player.updateCamera(1/60);
assert.equal(player.mesh.visible, false, 'first person hides player geometry');
player.toggleCameraMode(); player.updateCamera(1/60);
assert.equal(player.mesh.visible, true);
camera.position.y = 8; floor.updateView(camera); assert.equal(floor.ceiling.visible, false);
camera.position.y = 2; floor.updateView(camera); assert.equal(floor.ceiling.visible, true);
const obstacle = new THREE.Box3(new THREE.Vector3(0.5,0,-1),new THREE.Vector3(1,2,1));
player.spawn(new THREE.Vector3()); player.velocity.set(4,0,0); player.applyCollision(.1,[obstacle]);
assert.equal(player.position.x,0,'player cannot cross an obstacle');
for (const state of ['idle','run','crouch','jump','idle']) {
  for(let frame=0;frame<30;frame++) HumanoidBuilder.applyPose(player.modelParts,state,(player.animTime+=1/60),4.4);
  assert.ok(Number.isFinite(player.modelParts.leftLeg.rotation.x));
}
let meshes=0; floor.group.traverse(o=>{if(o.isMesh)meshes++;});
assert.ok(meshes<400, `static batching keeps office draw objects bounded: ${meshes}`);
// Flood-fill the playable floor to check that mission destinations remain reachable.
const step=.5, width=109, depth=73;
const key=(x,z)=>z*width+x;
const pos=(x,z)=>new THREE.Vector3(-27+x*step,0,-18+z*step);
const free=new Uint8Array(width*depth);
for(let z=0;z<depth;z++)for(let x=0;x<width;x++){
 const v=pos(x,z); const box=new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(v.x,.85,v.z),new THREE.Vector3(.7,1.7,.7));
 free[key(x,z)]=!floor.colliders.some(c=>c.intersectsBox(box));
}
const sx=Math.round((floor.spawnPoint.x+27)/step),sz=Math.round((floor.spawnPoint.z+18)/step);
assert.ok(free[key(sx,sz)],'spawn is clear');
const seen=new Set([key(sx,sz)]),queue=[[sx,sz]];
for(let i=0;i<queue.length;i++)for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){
 const x=queue[i][0]+dx,z=queue[i][1]+dz,k=key(x,z);
 if(x>=0&&x<width&&z>=0&&z<depth&&free[k]&&!seen.has(k)){seen.add(k);queue.push([x,z]);}
}
for(const [name,target,radius] of [['lounge',floor.loungePoint,2.3],['exit',floor.exits[0].pos,1.5],['northwest safe station',new THREE.Vector3(-24,0,-16),1.5],['conference safe station',new THREE.Vector3(-6,0,-14),1.5]]) {
 assert.ok(queue.some(([x,z])=>pos(x,z).distanceTo(target)<radius),`${name} is reachable from player spawn`);
}
console.log(`PASS: restart, camera modes, roof visibility, collisions, animation states, batching (${meshes} meshes), and mission routes (${seen.size} walkable cells).`);
const {HectorNPC} = await import('../src/entities/NPCs.js');
const racer = new HectorNPC(scene,new THREE.Vector3(-18,0,12));
const route = floor.navigation.route(racer.position, floor.loungePoint);
assert.ok(route.length>2,'race route uses hallway corners');
racer.setRoute(route);
for(let frame=0;frame<3000;frame++) {
    racer.update(1/60,camera);
    const body = new THREE.Box3().setFromCenterAndSize(racer.position.clone().add(new THREE.Vector3(0,.85,0)),new THREE.Vector3(.6,1.7,.6));
    assert.ok(!floor.colliders.some(box=>box.intersectsBox(body)),`racer stays clear of furniture at frame ${frame}`);
}
assert.ok(racer.position.distanceTo(floor.loungePoint)<1,'racer reaches lounge using corridors');
console.log('PASS: racer follows the complete route without crossing walls or desks.');
const {ParticleSystem} = await import('../src/entities/Particles.js');
const {SneezerNPC} = await import('../src/entities/NPCs.js');
const {sounds} = await import('../src/audio/SoundEffects.js');
sounds.isMuted = true;
const effects = new ParticleSystem(scene);
const sneezer = new SneezerNPC(scene,new THREE.Vector3(-4,0,4),[],effects);
sneezer.triggerSneeze(null);
assert.equal(effects.emitters.length,1,'sneeze produces a cloud without throwing');
let exposure = 0;
sneezer.triggerSneeze({position:sneezer.position.clone(), isDead:false, isMasked:false, infect(value){exposure += value;}});
assert.equal(exposure, 28, 'nearby player receives exposure and cough without throwing');
effects.createConfetti(new THREE.Vector3());
for(let i=0;i<400;i++)effects.update(1/60,camera);
assert.equal(effects.emitters.length,0);
assert.equal(effects.activeParticles.length,0,'expired particles are removed');
console.log('PASS: sneeze visual effect and particle lifecycle.');
