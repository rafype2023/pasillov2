import * as THREE from 'three';
import { officeMaterials } from './Materials.js';
import { officeProps } from './Props.js';
import { Navigation } from './Navigation.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Interprets the supplied floor plan within the existing playable bounds.
// Dimensions are gameplay estimates, not architectural measurements.
export class FloorPlan {
    constructor(scene) {
        this.scene = scene;
        this.materials = officeMaterials;
        this.props = officeProps;
        this.colliders = [];
        this.exits = [{pos: new THREE.Vector3(0, 0, -2), name: 'Escaleras de Emergencia'}];
        this.spawnPoint = new THREE.Vector3(0, 0, 12);
        this.loungePoint = new THREE.Vector3(16, 0, -12);
        this.cubicleDesks = [];
        this.lights = [];
        this.buildOffice();
        this.navigation = new Navigation(this.colliders);
    }

    setEmergencyLighting(enabled) {
        const mat = this.materials.get('fluorescentLight');
        mat.emissive.setHex(enabled ? 0xff2222 : 0xfffaed);
        mat.emissiveIntensity = enabled ? 2 : 1.25;
    }

    buildOffice() {
        this.group = new THREE.Group();
        const m = name => this.materials.get(name);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(54, 36), m('carpet'));
        floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
        this.group.add(floor);
        this.ceiling = new THREE.Mesh(new THREE.PlaneGeometry(54, 36), m('ceiling'));
        this.ceiling.rotation.x = Math.PI / 2; this.ceiling.position.y = 3.6;
        this.group.add(this.ceiling);
        this.addWall(0, 1.8, -18, 54, 3.6, .2, m('wall'));
        for (const x of [-27, 27]) this.addWall(x, 1.8, 0, .2, 3.6, 36, m('wall'));
        this.addWall(0, .35, 18, 54, .7, .2, m('wall'));
        this.addWall(0, 2.1, 18, 54, 2.8, .1, m('glass'));
        for (let x = -27; x <= 27; x += 3) this.addWall(x, 1.8, 17.9, .1, 3.6, .16, m('cubicleTrim'));

        // Three west banks and two east banks, divided by the circulation core.
        const prototypes = [this.props.createSpineCubiclePod('left'), this.props.createSpineCubiclePod('right')];
        for (const x of [-21, -13.5, -6, 11, 21]) this.createBank(x, prototypes);

        // Central stair enclosure opens south into the shared lobby.
        this.addWall(-2, 1.8, -9, .2, 3.6, 14, m('wall'));
        this.addWall(2, 1.8, -9, .2, 3.6, 14, m('wall'));
        this.addWall(0, 1.8, -16, 4, 3.6, .2, m('wall'));
        const stairs = this.props.createBackgroundStaircase();
        stairs.position.set(0, 0, -3); this.group.add(stairs);
        this.addWall(0, .8, -5, 2.5, 1.6, 2.8, m('stairCarpet'));
        this.createSign('ESCALERAS', 0, 2.85, -1.85);
        // Three elevator shafts stacked along the opposite side of the lobby.
        for (const z of [-13.5, -9.5, -5.5]) {
            this.addWall(5, 1.6, z, 2.5, 3.2, 3.5, m('wall'));
            this.addWall(3.7, 1.15, z, .08, 2.3, 2.4, m('filingCabinet'));
            this.addWall(3.64, 1.15, z, .04, 2.3, .03, m('deskLegs'));
        }

        // Meeting rooms along the top edge; every room has an open doorway.
        for (const [x, width] of [[-23, 7], [-14, 8], [-5.5, 7], [11, 7], [21, 9]]) {
            this.addWall(x-width/2, 1.6, -14, .14, 3.2, 8, m('wall'));
            this.addWall(x+width/2, 1.6, -14, .14, 3.2, 8, m('wall'));
            this.addWall(x-1, 1.6, -10, width-2, 3.2, .12, m('glass'));
            const table = this.props.createRoundMeetingTable(1, 4);
            table.position.set(x, 0, -15.5); this.group.add(table);
            this.addCollider(x, .5, -15.5, 2.6, 1, 2.6);
        }
        this.createSign('LOUNGE', 16, 2.5, -10);
        // Olive upholstered visitor chairs, as seen beside the cubicle entrances.
        for (const x of [15.5, 17]) {
            const chair = new THREE.Group();
            for (const [px,py,pz,w,h,d] of [[0,.43,0,.8,.22,.8],[0,.88,-.34,.8,.8,.18],[-.45,.62,0,.16,.45,.85],[.45,.62,0,.16,.45,.85]]) {
                const part = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), m('loungeFabric'));
                part.position.set(px,py,pz); chair.add(part);
            }
            chair.position.set(x,0,-16); this.group.add(chair);
            this.addCollider(x,.6,-16,1.1,1.2,1);
        }
        for (const x of [-17,-2.8,7,17]) for (const z of [-8.5,9]) this.addWall(x,1.8,z,.45,3.6,.45,m('wall'));
        for (let x=-24;x<=24;x+=6) for (let z=-15;z<=15;z+=5) {
            const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.5,.06,.65), m('fluorescentLight'));
            fixture.position.set(x,3.55,z); this.lights.push(fixture); this.group.add(fixture);
        }
        this.batchStaticMeshes();
        this.scene.add(this.group);
    }

    addCollider(x,y,z,w,h,d) {
        this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x,y,z),new THREE.Vector3(w,h,d)));
    }

    createBank(x, prototypes) {
        const panel = (px,pz,w,d) => {
            this.addWall(px,.85,pz,w,1.7,d,this.materials.get('cubicleFabric'));
            this.addWall(px,1.72,pz,w+.025,.04,d+.025,this.materials.get('cubicleTrim'));
            this.addWall(px,.065,pz,w,.13,d+.02,this.materials.get('filingCabinet'));
        };
        panel(x,0,.12,14.4);
        for(let row=0;row<=4;row++) panel(x,-7.2+row*3.6,5.6,.10);
        for(let row=0;row<4;row++) for(const side of [-1,1]) {
            const z=-5.4+row*3.6;
            const pod=prototypes[side<0?0:1].clone(true);
            pod.position.set(x+side*1.45,0,z-.5); this.group.add(pod);
            // Separate main desktop and return bounds preserve the chair recess.
            this.addCollider(x+side*1.45,.4,z-.5,2.4,.8,1.6);
            this.addCollider(x+side*1.45+(side<0?-.88:.88),.4,z+.52,.64,.8,1.25);
            this.cubicleDesks.push(pod.position.clone());
            this.addWall(x+side*1.45,1.42,z-1.32,2.25,.38,.36,this.materials.get('filingCabinet'));
            if(row%2===0) {
                const board=this.props.createWhiteboard(.8,.45);
                board.position.set(x+side*1.45,1.25,z-1.24); this.group.add(board);
            }
        }
    }

    createSign(text, x, y, z) {
        const canvas = document.createElement('canvas');
        canvas.width = 768; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#123c3c'; ctx.fillRect(0, 0, 768, 128);
        ctx.fillStyle = '#bbdfb0'; ctx.fillRect(0, 0, 10, 128);
        ctx.fillStyle = '#ffffff'; ctx.font = '500 42px sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(text, 384, 79);
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.57), new THREE.MeshBasicMaterial({map: tex, side: THREE.DoubleSide}));
        sign.position.set(x, y, z); this.group.add(sign);
    }

    batchStaticMeshes() {
        this.group.updateMatrixWorld(true);
        const batches = new Map();
        this.group.traverse(mesh => {
            if (!mesh.isMesh || Array.isArray(mesh.material) || mesh === this.ceiling || this.lights.includes(mesh)) return;
            let parent = mesh.parent;
            while (parent && parent !== this.group) {
                if (this.lights.includes(parent)) return;
                parent = parent.parent;
            }
            const key = mesh.material.uuid;
            if (!batches.has(key)) batches.set(key, []);
            batches.get(key).push(mesh);
        });
        for (const meshes of batches.values()) {
            if (meshes.length < 2) continue;
            const geometries = meshes.map(mesh => {
                let geo = mesh.geometry.clone();
                if (geo.index) { const indexed = geo; geo = geo.toNonIndexed(); indexed.dispose(); }
                geo.applyMatrix4(mesh.matrixWorld);
                return geo;
            });
            const geometry = mergeGeometries(geometries);
            geometries.forEach(geo => geo.dispose());
            if (!geometry) continue;
            const batch = new THREE.Mesh(geometry, meshes[0].material);
            batch.castShadow = meshes.some(mesh => mesh.castShadow);
            batch.receiveShadow = true;
            meshes.forEach(mesh => mesh.removeFromParent());
            this.group.add(batch);
        }
    }

    updateView(camera) {
        const interior = camera.position.y < 3.45;
        this.ceiling.visible = interior;
        this.lights.forEach(light => { light.visible = interior; });
    }

    addWall(x, y, z, w, h, d, material) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        const col = new THREE.Box3();
        col.setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, d));
        this.colliders.push(col);
    }
}
