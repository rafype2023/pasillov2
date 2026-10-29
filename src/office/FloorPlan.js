import * as THREE from 'three';
import { officeMaterials } from './Materials.js';
import { officeProps } from './Props.js';
import { Navigation } from './Navigation.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * FloorPlan: Rebuilds the FirstBank office game map from the floor plan (Plano2.png),
 * real office photos (cub1..5, IMG_2245, IMG_2843, IMG_4361, IMG_9457, conf),
 * and the 1:1 FirstBank 1130 Data Center scan (version 2/3DGS.ply).
 */
export class FloorPlan {
    constructor(scene) {
        this.scene = scene;
        this.materials = officeMaterials;
        this.props = officeProps;
        this.colliders = [];
        this.exits = [{ pos: new THREE.Vector3(0, 0, -2), name: 'Escaleras de Emergencia' }];
        this.spawnPoint = new THREE.Vector3(0, 0, 12);
        this.loungePoint = new THREE.Vector3(16, 0, -12);
        this.dataCenterPoint = new THREE.Vector3(20, 0, 14);
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

        // Three west banks (-21, -13.5, -6) and one east-central bank (11 - Rafael Perez's spine),
        // while the East/South-East wing (X in [15.8, 26.8], Z in [-7.2, 17.8]) houses the 1130 Data Center from 3DGS.ply!
        const prototypes = [this.props.createSpineCubiclePod('left'), this.props.createSpineCubiclePod('right')];
        for (const x of [-21, -13.5, -6, 11]) this.createBank(x, prototypes);

        // Rafael Perez's cubicle details on the x=11 spine (cub1, cub4, cub5, IMG_2245):
        // 1130 DATA CENTER 3D poster taped inside partition + green bottle & Newton's cradle + two olive lounge chairs outside!
        const dcPoster = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72), m('dcPoster'));
        dcPoster.position.set(11.08, 1.25, 1.8);
        dcPoster.rotation.y = Math.PI / 2;
        this.group.add(dcPoster);

        const rafAcc = this.props.createRafaelDeskAccessories();
        rafAcc.position.set(12.8, 0.78, 1.6);
        this.group.add(rafAcc);

        // Pair of olive-green upholstered lounge armchairs outside Rafael Perez's cubicle (cub4 & cub5)
        for (const zChair of [4.2, 5.4]) {
            const chair = new THREE.Group();
            for (const [px, py, pz, w, h, d] of [[0, .43, 0, .8, .22, .8], [0, .88, -.34, .8, .8, .18], [-.45, .62, 0, .16, .45, .85], [.45, .62, 0, .16, .45, .85]]) {
                const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m('loungeFabric'));
                part.position.set(px, py, pz); chair.add(part);
            }
            chair.rotation.y = -Math.PI / 2;
            chair.position.set(7.6, 0, zChair);
            this.group.add(chair);
        }

        // FIRSTBANK 1130 DATA CENTER (Reconstructed 1:1 from version 2/3DGS.ply in X in [15.8, 26.8], Z in [-6.8, 17.5])
        this.createDataCenter1130();

        // Central stair enclosure opens south into the shared lobby (rose/terracotta walls from Plano2 & scene_level3).
        this.addWall(-2, 1.8, -9, .2, 3.6, 14, m('stairWall'));
        this.addWall(2, 1.8, -9, .2, 3.6, 14, m('stairWall'));
        this.addWall(0, 1.8, -16, 4, 3.6, .2, m('stairWall'));
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

        // Meeting rooms & Breakroom Buffet Lounge along the top North edge; every room has an open doorway.
        for (const [x, width] of [[-23, 7], [-14, 8], [-5.5, 7], [11, 7], [21, 9]]) {
            this.addWall(x - width / 2, 1.6, -14, .14, 3.2, 8, m('wall'));
            this.addWall(x + width / 2, 1.6, -14, .14, 3.2, 8, m('wall'));
            this.addWall(x - 1, 1.6, -10, width - 2, 3.2, .12, m('glass'));
            if (x === 21) {
                // Authentic Birthday Snack Buffet Counter from IMG_2843.png in the North-East Lounge!
                const buffet = this.props.createSnacksTable();
                buffet.position.set(x, 0, -15.6);
                this.group.add(buffet);
                this.addCollider(x, .5, -15.6, 2.8, 1, 1.4);
            } else {
                const table = this.props.createRoundMeetingTable(1, 4);
                table.position.set(x, 0, -15.5); this.group.add(table);
                this.addCollider(x, .5, -15.5, 2.6, 1, 2.6);
            }
        }
        this.createSign('LOUNGE BUFFET', 16, 2.5, -10);

        // Olive upholstered visitor chairs in Lounge
        for (const x of [15.5, 17]) {
            const chair = new THREE.Group();
            for (const [px, py, pz, w, h, d] of [[0, .43, 0, .8, .22, .8], [0, .88, -.34, .8, .8, .18], [-.45, .62, 0, .16, .45, .85], [.45, .62, 0, .16, .45, .85]]) {
                const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m('loungeFabric'));
                part.position.set(px, py, pz); chair.add(part);
            }
            chair.position.set(x, 0, -16); this.group.add(chair);
            this.addCollider(x, .6, -16, 1.1, 1.2, 1);
        }

        // Structural columns with dual overhead telemetry TVs (cub1, cub3, IMG_9457)
        for (const x of [-17, -2.8, 7, 17]) {
            for (const z of [-8.5, 9]) {
                this.addWall(x, 1.8, z, .45, 3.6, .45, m('wall'));
                if (z === -8.5 && (x === -2.8 || x === 7)) {
                    const tv = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 0.08), m('serverWall'));
                    tv.position.set(x, 2.82, z + 0.28);
                    this.group.add(tv);
                }
            }
        }

        for (let x = -24; x <= 24; x += 6) for (let z = -15; z <= 15; z += 5) {
            const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.5, .06, .65), m('fluorescentLight'));
            fixture.position.set(x, 3.55, z); this.lights.push(fixture); this.group.add(fixture);
        }
        this.batchStaticMeshes();
        this.scene.add(this.group);
    }

    /**
     * Builds the FIRSTBANK 1130 DATA CENTER in the East/South-East Wing (X in [15.8, 26.8], Z in [-6.8, 17.5])
     * Reconstructed 1:1 from version 2/3DGS.ply!
     */
    createDataCenter1130() {
        const m = name => this.materials.get(name);

        // 1. 60cm x 60cm White Raised Access Floor (ply_wide_grid_topdown.png)
        const dcFloor = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 24.2), m('dcRaisedFloor'));
        dcFloor.rotation.x = -Math.PI / 2;
        dcFloor.position.set(21.3, 0.015, 5.4);
        dcFloor.receiveShadow = true;
        this.group.add(dcFloor);

        // Cold-aisle dark perforated vent tiles on raised floor
        for (const vz of [-1.8, 4.2, 11.5]) {
            for (let vx = 17.2; vx <= 24.8; vx += 1.2) {
                const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), m('monitorPlastic'));
                vent.rotation.x = -Math.PI / 2;
                vent.position.set(vx, 0.022, vz);
                this.group.add(vent);
            }
        }

        // 2. West Partition Wall of 1130 Data Center with Double Oak Entrance Doors, Wreath & Rolling Step Stool (ply_cam_west.png)
        this.addWall(15.8, 1.8, -4.2, 0.2, 3.6, 5.0, m('wall'));
        this.addWall(15.8, 1.8, 5.2, 0.2, 3.6, 4.4, m('wall'));

        const dcDoors = this.props.createDataCenterEntranceAssembly();
        dcDoors.position.set(15.8, 0, 0.4);
        this.group.add(dcDoors);

        this.createSign('1130 DATA CENTER', 15.8, 2.85, 0.4);

        // 3. Parallel Rows of Black & White Server Racks (BJ-07..15 from ply_cam_north.png & IMG_2245.png)
        // Positioned at Z = -4.5, Z = +1.8, and Z = +6.5 so (18, 0, 14) safe zone and patrol paths (10..22, 8..16) are 100% clear!
        const rackPositions = [
            { x: 20.5, z: -4.5, count: 4 },
            { x: 20.5, z: 1.8, count: 4 },
            { x: 20.5, z: 6.2, count: 4 },
            { x: 24.4, z: 11.5, count: 2 } // Standalone Mainframe Island (ply_topdown_mid_slice.png)
        ];
        rackPositions.forEach(rp => {
            const row = this.props.createDataCenterRackRow(rp.count);
            row.position.set(rp.x, 0, rp.z);
            this.group.add(row);
            this.addCollider(rp.x, 1.1, rp.z, rp.count * 0.76, 2.2, 1.05);
        });

        // 4. East Wall Stenciled Column Grid ("AS  AR  AQ  AP  AO  AN" from ply_cam_east.png)
        const gridBanner = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 0.75), m('dcWallGrid'));
        gridBanner.rotation.y = -Math.PI / 2;
        gridBanner.position.set(26.78, 3.05, 5.0);
        this.group.add(gridBanner);

        // 5. Gray High-Voltage PDU / UPS Cabinet + Cardboard Box on Floor (ply_cam_east.png)
        const pdu = this.props.createPDUCabinetWithBox();
        pdu.rotation.y = -Math.PI / 2;
        pdu.position.set(26.1, 0, -1.2);
        this.group.add(pdu);
        this.addCollider(26.1, 1.1, -1.2, 0.9, 2.2, 1.0);

        // 6. Industrial Liebert CRAC Air Conditioning Units (ply_cam_east.png & ply_cam_south.png)
        const cracEast = this.props.createCRACUnit(2.6, 2.15, 0.90);
        cracEast.rotation.y = -Math.PI / 2;
        cracEast.position.set(26.2, 0, 4.8);
        this.group.add(cracEast);
        this.addCollider(26.2, 1.1, 4.8, 0.95, 2.2, 2.6);

        const cracSouth = this.props.createCRACUnit(2.8, 2.15, 0.90);
        cracSouth.rotation.y = Math.PI;
        cracSouth.position.set(20.5, 0, 17.2);
        this.group.add(cracSouth);
        this.addCollider(20.5, 1.1, 17.2, 2.8, 2.2, 0.95);
    }

    addCollider(x, y, z, w, h, d) {
        this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, d)));
    }

    createBank(x, prototypes) {
        const panel = (px, pz, w, d) => {
            this.addWall(px, .85, pz, w, 1.7, d, this.materials.get('cubicleFabric'));
            this.addWall(px, 1.72, pz, w + .025, .04, d + .025, this.materials.get('cubicleTrim'));
            this.addWall(px, .065, pz, w, .13, d + .02, this.materials.get('filingCabinet'));
        };
        panel(x, 0, .12, 14.4);
        for (let row = 0; row <= 4; row++) panel(x, -7.2 + row * 3.6, 5.6, .10);

        const wbVariants = ['whiteboard', 'whiteboardTeam', 'whiteboardBDB', 'whiteboardParking'];
        for (let row = 0; row < 4; row++) for (const side of [-1, 1]) {
            const z = -5.4 + row * 3.6;
            const pod = prototypes[side < 0 ? 0 : 1].clone(true);
            pod.position.set(x + side * 1.45, 0, z - .5); this.group.add(pod);
            // Separate main desktop and return bounds preserve the chair recess.
            this.addCollider(x + side * 1.45, .4, z - .5, 2.4, .8, 1.6);
            this.addCollider(x + side * 1.45 + (side < 0 ? -.88 : .88), .4, z + .52, .64, .8, 1.25);
            this.cubicleDesks.push(pod.position.clone());
            this.addWall(x + side * 1.45, 1.42, z - 1.32, 2.25, .38, .36, this.materials.get('filingCabinet'));
            if (row % 2 === 0) {
                const variant = wbVariants[(row + (side > 0 ? 1 : 0)) % wbVariants.length];
                const board = this.props.createWhiteboard(.8, .45, variant);
                board.position.set(x + side * 1.45, 1.25, z - 1.24); this.group.add(board);
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
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.57), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
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
