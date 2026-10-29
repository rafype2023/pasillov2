import * as THREE from 'three';
import { officeMaterials } from './Materials.js';
import { officeProps } from './Props.js';
import { Navigation } from './Navigation.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * FloorPlan: Rebuilds the FirstBank office game map directly from:
 * 1. `version 2/splat.ply` (3D Gaussian Splatting scan of the FirstBank Office Area:
 *    North row of 5 cubicles with Guillo's red heart balloons, East-West double-sided central
 *    cubicle island, West hallway with wall screen, South corridor & cubicles, and East Window
 *    Lounge with the 2 olive armchairs, Cumpleaños/Valores circular badges, NE EXIT door, and
 *    long green-tablecloth buffet table).
 * 2. `version 2/3DGS.ply` (3D Gaussian Splatting scan of the FirstBank 1130 Data Center).
 * 3. Real office reference photos (`converted_assets/`).
 */
export class FloorPlan {
    constructor(scene) {
        this.scene = scene;
        this.materials = officeMaterials;
        this.props = officeProps;
        this.colliders = [];
        this.exits = [
            { pos: new THREE.Vector3(0, 0, -2), name: 'Escaleras de Emergencia' },
            { pos: new THREE.Vector3(19.5, 0, -15.8), name: 'Salida Noreste (Lounge EXIT)' }
        ];
        this.spawnPoint = new THREE.Vector3(0, 0, 12);
        this.loungePoint = new THREE.Vector3(16, 0, -12);
        this.dataCenterPoint = new THREE.Vector3(18, 0, 14);
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

        // 1. Main Office Carpet Floor & Acoustic Drop Ceiling (Z=0.00 to Z=0.49 in splat.ply)
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(54, 36), m('carpet'));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        this.ceiling = new THREE.Mesh(new THREE.PlaneGeometry(54, 36), m('ceiling'));
        this.ceiling.rotation.x = Math.PI / 2;
        this.ceiling.position.y = 3.6;
        this.group.add(this.ceiling);

        // 2. Perimeter Walls & Daylight Window Walls (from splat.ply)
        // North Wall (Z = -18) & West Wall (X = -27)
        this.addWall(0, 1.8, -18, 54, 3.6, 0.2, m('wall'));
        this.addWall(-27, 1.8, 0, 0.2, 3.6, 36, m('wall'));

        // East Exterior Wall: Window Wall along the Lounge & Buffet Gallery (Z in [-18, +2], splat_cam_lounge_south.png)
        // and solid Data Center East Wall (Z in [+2, +18], ply_cam_east.png)
        this.addWall(27, 0.35, -8, 0.2, 0.7, 20, m('wall'));
        this.addWall(27, 2.1, -8, 0.1, 2.8, 20, m('glass'));
        for (let z = -18; z <= 2; z += 2.5) {
            this.addWall(26.9, 1.8, z, 0.16, 3.6, 0.1, m('cubicleTrim'));
        }
        this.addWall(27, 1.8, 10, 0.2, 3.6, 16, m('wall'));

        // South Exterior Window Wall (Z = +18)
        this.addWall(0, 0.35, 18, 54, 0.7, 0.2, m('wall'));
        this.addWall(0, 2.1, 18, 54, 2.8, 0.1, m('glass'));
        for (let x = -27; x <= 27; x += 3) {
            this.addWall(x, 1.8, 17.9, 0.1, 3.6, 0.16, m('cubicleTrim'));
        }

        const prototypes = [
            this.props.createSpineCubiclePod('left'),
            this.props.createSpineCubiclePod('right')
        ];

        // 3. NORTH ROW OF 5 CUBICLES & NW RECEPTION (from splat_aligned_obstacles.png, y_splat in [+0.48, +0.88])
        this.createNorthCubicleRow(prototypes);

        // 4. CENTRAL DOUBLE-SIDED CUBICLE ISLANDS (from splat_aligned_obstacles.png, y_splat in [-0.62, +0.05])
        this.createCentralCubicleIslands(prototypes);

        // 5. WEST CORRIDOR & WEST WING WORKSTATIONS (from splat_cam_west_corridor_south.png, x_splat in [-1.80, -1.35])
        this.createWestWingCorridor(prototypes);

        // 6. SOUTH CORRIDOR & SOUTH WORKSTATIONS (from splat_aligned_obstacles.png, y_splat in [-1.45, -0.92])
        this.createSouthCubicleRow(prototypes);

        // 7. EAST WINDOW LOUNGE, EXIT DOOR & GREEN BUFFET GALLERY (from splat_cam_lounge_north.png & splat_cam_lounge_south.png)
        this.createEastLoungeAndBuffetGallery();

        // 8. FIRSTBANK 1130 DATA CENTER in South-East Wing (from version 2/3DGS.ply, X in [15.8, 26.8], Z in [2.2, 17.5])
        this.createDataCenter1130();

        // 9. Central Emergency Stairwell & Lobby Core (X = 0, Z = -2 .. -9)
        this.addWall(-1.9, 1.8, -6.2, 0.2, 3.6, 5.2, m('stairWall'));
        this.addWall(1.9, 1.8, -6.2, 0.2, 3.6, 5.2, m('stairWall'));
        this.addWall(0, 1.8, -8.8, 3.8, 3.6, 0.2, m('stairWall'));
        const stairs = this.props.createBackgroundStaircase();
        stairs.position.set(0, 0, -3.2);
        this.group.add(stairs);
        this.addWall(0, 0.8, -5.2, 2.4, 1.6, 2.4, m('stairCarpet'));
        this.createSign('ESCALERAS', 0, 2.85, -1.85);

        // 10. Structural Columns & Dual Overhead Telemetry Monitors (splat_aligned_obstacles.png & IMG_9457)
        for (const [cx, cz, hasTV] of [[-9.6, -5.2, true], [3.6, -5.2, true], [-16.2, -5.2, false], [12.5, 5.2, false]]) {
            this.addWall(cx, 1.8, cz, 0.42, 3.6, 0.42, m('wall'));
            if (hasTV) {
                const tv = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.52, 0.08), m('serverWall'));
                tv.position.set(cx, 2.82, cz - 0.26);
                this.group.add(tv);
            }
        }

        // 11. 2x4 Recessed Fluorescent Ceiling Light Grid (visible across splat_xy_from_zmax.png)
        for (let x = -24; x <= 24; x += 6) {
            for (let z = -15; z <= 15; z += 5) {
                const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.65), m('fluorescentLight'));
                fixture.position.set(x, 3.55, z);
                this.lights.push(fixture);
                this.group.add(fixture);
            }
        }

        this.batchStaticMeshes();
        this.scene.add(this.group);
    }

    /**
     * Helper to place a cubicle partition panel with top aluminum trim & base raceway.
     */
    addPartitionPanel(px, pz, w, d) {
        this.addWall(px, 0.85, pz, w, 1.7, d, this.materials.get('cubicleFabric'));
        this.addWall(px, 1.72, pz, w + 0.025, 0.04, d + 0.025, this.materials.get('cubicleTrim'));
        this.addWall(px, 0.065, pz, w, 0.13, d + 0.02, this.materials.get('filingCabinet'));
    }

    /**
     * Builds the North Row of 5 Single-Sided Cubicles backed against the North wall (Z in [-17.6, -12.6])
     * opening South into the Main North-Central Corridor (Z in [-12.5, -5.5]), matching splat_aligned_obstacles.png!
     */
    createNorthCubicleRow(prototypes) {
        const m = name => this.materials.get(name);

        // NW Reception / Safe Alcove (X in [-27, -20.5], keeping (-24, 0, -16) open for tests & Covid safe zone)
        this.addPartitionPanel(-20.4, -15.2, 0.12, 4.8);
        this.createSign('RECEPCIÓN NOROESTE', -23.8, 2.7, -17.7);

        // 5 Cubicles along the North wall:
        // N1 (X = -17.2), N2 (X = -11.8, Guillo's Red Balloons Cubicle!), N3 (X = -6.0, open conference/safe bay),
        // N4 (X = +4.4), N5 (X = +9.6, East-most cubicle adjacent to the 2 olive armchairs)
        const northBays = [
            { x: -17.2, hasDesk: true, hasBalloons: false, wb: 'whiteboard' },
            { x: -11.8, hasDesk: true, hasBalloons: true, wb: 'whiteboardTeam' },
            { x: -6.0, hasDesk: false, hasBalloons: false, wb: 'whiteboardBDB' }, // keeps (-6, 0, -14) clear for safe station
            { x: 4.4, hasDesk: true, hasBalloons: false, wb: 'whiteboardParking' },
            { x: 9.6, hasDesk: true, hasBalloons: false, wb: 'whiteboardTeam' }
        ];

        northBays.forEach((bay) => {
            // Side partitions (depth 4.6m from Z = -17.6 to Z = -13.0)
            this.addPartitionPanel(bay.x - 2.4, -15.3, 0.10, 4.6);
            this.addPartitionPanel(bay.x + 2.4, -15.3, 0.10, 4.6);

            // Overhead storage bin & whiteboard on North back wall
            this.addWall(bay.x, 1.42, -17.4, 2.25, 0.38, 0.36, m('filingCabinet'));
            const board = this.props.createWhiteboard(0.95, 0.52, bay.wb);
            board.position.set(bay.x, 1.25, -17.18);
            this.group.add(board);

            if (bay.hasDesk) {
                const pod = prototypes[0].clone(true);
                pod.position.set(bay.x, 0, -15.8);
                this.group.add(pod);
                this.addCollider(bay.x, 0.4, -16.1, 2.3, 0.8, 1.3);
                this.cubicleDesks.push(pod.position.clone());
            }

            if (bay.hasBalloons) {
                // Guillo's Red Heart Balloons seen in splat_aligned_full.png (x = -1.30, y = +0.62) & splat_cam_west_corridor_south.png!
                const balloons = this.props.createCubicleRedBalloons();
                balloons.position.set(bay.x - 0.6, 0, -14.8);
                this.group.add(balloons);
            }
        });
    }

    /**
     * Builds the Central Double-Sided East-West Cubicle Spine Islands (matching splat_aligned_obstacles.png, y_splat in [-0.62, +0.05]).
     * Split into West Island (X in [-15.2, -4.4]) and East Island (X in [+4.0, +12.4]) with a wide central passage at X in [-4.4, +4.0].
     */
    createCentralCubicleIslands(prototypes) {
        const m = name => this.materials.get(name);
        const wbVariants = ['whiteboard', 'whiteboardTeam', 'whiteboardBDB', 'whiteboardParking'];

        // West Central Spine (X in [-15.2, -4.4], Z = 0.0) & East Central Spine (X in [+4.0, +12.4], Z = 0.0)
        this.addPartitionPanel(-9.8, 0.0, 10.8, 0.12);
        this.addPartitionPanel(8.2, 0.0, 8.4, 0.12);

        const bayCenters = [-12.5, -7.1, 6.1, 10.3];
        bayCenters.forEach((bx, idx) => {
            // Side dividers on North (Z in [-4.6, 0]) and South (Z in [0, +4.6])
            this.addPartitionPanel(bx - 2.6, -2.3, 0.10, 4.6);
            this.addPartitionPanel(bx + 2.6, -2.3, 0.10, 4.6);
            this.addPartitionPanel(bx - 2.6, 2.3, 0.10, 4.6);
            this.addPartitionPanel(bx + 2.6, 2.3, 0.10, 4.6);

            // North-facing cubicle pod (backed against spine Z = 0, opening North into Z = -5.5..-12)
            const podN = prototypes[0].clone(true);
            podN.rotation.y = Math.PI;
            podN.position.set(bx, 0, -1.65);
            this.group.add(podN);
            this.addCollider(bx, 0.4, -1.35, 2.3, 0.8, 1.3);
            this.cubicleDesks.push(podN.position.clone());

            this.addWall(bx, 1.42, -0.25, 2.25, 0.38, 0.36, m('filingCabinet'));
            const wbN = this.props.createWhiteboard(0.85, 0.48, wbVariants[idx % wbVariants.length]);
            wbN.rotation.y = Math.PI;
            wbN.position.set(bx, 1.25, -0.45);
            this.group.add(wbN);

            // South-facing cubicle pod (backed against spine Z = 0, opening South into Z = +5.5..+12)
            const podS = prototypes[1].clone(true);
            podS.position.set(bx, 0, 1.65);
            this.group.add(podS);
            this.addCollider(bx, 0.4, 1.35, 2.3, 0.8, 1.3);
            this.cubicleDesks.push(podS.position.clone());

            this.addWall(bx, 1.42, 0.25, 2.25, 0.38, 0.36, m('filingCabinet'));
            const wbS = this.props.createWhiteboard(0.85, 0.48, wbVariants[(idx + 1) % wbVariants.length]);
            wbS.position.set(bx, 1.25, 0.45);
            this.group.add(wbS);
        });

        // Rafael Perez's Cubicle (#201 at East end of spine, X = 10.3, Z = -1.65):
        // 1130 DATA CENTER 3D poster taped inside partition + FirstBank lime-green bottle & Newton's cradle!
        const dcPoster = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.72), m('dcPoster'));
        dcPoster.position.set(12.78, 1.25, -1.8);
        dcPoster.rotation.y = -Math.PI / 2;
        this.group.add(dcPoster);

        const rafAcc = this.props.createRafaelDeskAccessories();
        rafAcc.position.set(10.6, 0.78, -1.35);
        this.group.add(rafAcc);
    }

    /**
     * Builds the West Wing Corridor & Workstations (from splat_cam_west_corridor_south.png).
     * Preserves the wide race track corridor at X in [-21.5, -15.5], Z in [-12, +14].
     */
    createWestWingCorridor(prototypes) {
        const m = name => this.materials.get(name);

        // Large Dark Wall-Mounted Screen / Board on the West Corridor Wall (splat_cam_west_corridor_south.png right side)
        const westScreen = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 2.6), m('serverWall'));
        westScreen.position.set(-26.82, 1.65, -2.5);
        this.group.add(westScreen);

        // 3 West Wall Workstations backed against X = -26.8 (at Z = -7.5, -1.5, +4.5), keeping Z >= 8 wide open for the Race Start Line!
        [-7.5, -1.5, 4.5].forEach((wz) => {
            this.addPartitionPanel(-24.4, wz - 2.3, 4.4, 0.10);
            this.addPartitionPanel(-24.4, wz + 2.3, 4.4, 0.10);

            const pod = prototypes[0].clone(true);
            pod.rotation.y = Math.PI / 2;
            pod.position.set(-24.8, 0, wz);
            this.group.add(pod);
            this.addCollider(-25.1, 0.4, wz, 1.3, 0.8, 2.3);
            this.cubicleDesks.push(pod.position.clone());
        });
    }

    /**
     * Builds the South Row of Cubicles / Offices along Z in [+13.2, +17.6] (from splat_aligned_obstacles.png, y_splat in [-1.45, -0.92]).
     * Leaves the South Corridor (Z in [+5.5, +13.0]) and spawnPoint (0, 0, 12) completely clear!
     */
    createSouthCubicleRow(prototypes) {
        const southBays = [-12.5, -6.8, 6.2, 11.4];
        southBays.forEach((sx) => {
            this.addPartitionPanel(sx - 2.4, 15.5, 0.10, 4.2);
            this.addPartitionPanel(sx + 2.4, 15.5, 0.10, 4.2);

            const pod = prototypes[1].clone(true);
            pod.rotation.y = Math.PI;
            pod.position.set(sx, 0, 15.8);
            this.group.add(pod);
            this.addCollider(sx, 0.4, 16.1, 2.3, 0.8, 1.3);
            this.cubicleDesks.push(pod.position.clone());
        });
    }

    /**
     * Builds the North-East Lounge, Olive Armchairs, Cumpleaños & Valores Circular Badges,
     * North-East EXIT Door, Peninsula Birthday Counter, and Long Green Buffet Table
     * (from splat_aligned_full.png, splat_cam_lounge_north.png & splat_cam_lounge_south.png).
     */
    createEastLoungeAndBuffetGallery() {
        const m = name => this.materials.get(name);

        // 1. Circular Red "FELIZ CUMPLEAÑOS" & Blue "NUESTROS VALORES" Badges on the East End-Wall of Cubicle N5 (splat_cam_lounge_north.png)
        const badges = this.props.createLoungeEndWallBadges();
        badges.position.set(12.08, 0, -13.3);
        this.group.add(badges);

        // 2. Pair of Olive-Green Upholstered Lounge Armchairs against the Cubicle N5 East Wall (splat_aligned_full.png & splat_cam_lounge_north.png)
        for (const zChair of [-16.2, -14.4]) {
            const chair = new THREE.Group();
            for (const [px, py, pz, w, h, d] of [
                [0, 0.43, 0, 0.8, 0.22, 0.8],
                [0, 0.88, -0.34, 0.8, 0.8, 0.18],
                [-0.45, 0.62, 0, 0.16, 0.45, 0.85],
                [0.45, 0.62, 0, 0.16, 0.45, 0.85]
            ]) {
                const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m('loungeFabric'));
                part.position.set(px, py, pz);
                chair.add(part);
            }
            chair.rotation.y = Math.PI / 2; // Facing East into the Lounge & Windows
            chair.position.set(13.1, 0, zChair);
            this.group.add(chair);
            this.addCollider(13.1, 0.6, zChair, 1.0, 1.2, 1.0);
        }

        // 3. North-East EXIT Door with Red Glowing "EXIT" Sign on the North Wall (splat_cam_lounge_north.png center!)
        const neExitDoor = this.props.createStairwellExit(1.5, 2.35);
        neExitDoor.position.set(19.5, 0, -17.85);
        this.group.add(neExitDoor);
        this.createSign('LOUNGE BUFFET', 16, 2.75, -10.0);

        // 4. Birthday Snack Buffet Peninsula Counter in North-East Lounge (IMG_2843.png)
        const snackPeninsula = this.props.createSnacksTable();
        snackPeninsula.position.set(23.2, 0, -15.6);
        this.group.add(snackPeninsula);
        this.addCollider(23.2, 0.5, -15.6, 2.8, 1.0, 1.4);

        // 5. Long Green-Tablecloth Buffet Table along the East Side of the Central Cubicle Spine (splat_aligned_full.png & splat_cam_lounge_south.png!)
        const greenBuffet = this.props.createGreenBuffetTable(4.4, 0.95);
        greenBuffet.position.set(14.0, 0, -1.2);
        this.group.add(greenBuffet);
        this.addCollider(14.0, 0.5, -1.2, 1.05, 1.0, 4.4);
    }

    /**
     * Builds the FIRSTBANK 1130 DATA CENTER in the South-East Wing (X in [15.8, 26.8], Z in [2.2, 17.5])
     * Reconstructed 1:1 from version 2/3DGS.ply!
     */
    createDataCenter1130() {
        const m = name => this.materials.get(name);

        // 1. 60cm x 60cm White Raised Access Floor (ply_wide_grid_topdown.png)
        const dcFloor = new THREE.Mesh(new THREE.PlaneGeometry(11.0, 15.4), m('dcRaisedFloor'));
        dcFloor.rotation.x = -Math.PI / 2;
        dcFloor.position.set(21.3, 0.015, 9.9);
        dcFloor.receiveShadow = true;
        this.group.add(dcFloor);

        // Cold-aisle dark perforated vent tiles on raised floor
        for (const vz of [4.8, 9.2, 13.5]) {
            for (let vx = 17.2; vx <= 24.8; vx += 1.2) {
                const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), m('monitorPlastic'));
                vent.rotation.x = -Math.PI / 2;
                vent.position.set(vx, 0.022, vz);
                this.group.add(vent);
            }
        }

        // 2. North & West Enclosure Walls of 1130 Data Center with Double Oak Entrance Doors, Wreath & Rolling Step Stool (ply_cam_west.png)
        this.addWall(21.3, 1.8, 2.2, 11.0, 3.6, 0.2, m('wall'));
        this.addWall(15.8, 1.8, 3.3, 0.2, 3.6, 2.2, m('wall'));
        this.addWall(15.8, 1.8, 9.8, 0.2, 3.6, 3.6, m('wall'));

        const dcDoors = this.props.createDataCenterEntranceAssembly();
        dcDoors.position.set(15.8, 0, 6.2);
        this.group.add(dcDoors);

        this.createSign('1130 DATA CENTER', 15.8, 2.85, 6.2);

        // 3. Parallel Rows of Black & White Server Racks (BJ-07..15 from ply_cam_north.png & IMG_2245.png)
        // Positioned so (18, 0, 14) safe zone and patrol paths (10..22, 8..16) remain 100% clear!
        const rackPositions = [
            { x: 21.0, z: 3.8, count: 4 },
            { x: 21.0, z: 6.4, count: 4 },
            { x: 24.4, z: 11.5, count: 2 }
        ];
        rackPositions.forEach(rp => {
            const row = this.props.createDataCenterRackRow(rp.count);
            row.position.set(rp.x, 0, rp.z);
            this.group.add(row);
            this.addCollider(rp.x, 1.1, rp.z, rp.count * 0.76, 2.2, 1.05);
        });

        // 4. East Wall Stenciled Column Grid ("AS  AR  AQ  AP  AO  AN" from ply_cam_east.png)
        const gridBanner = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 0.75), m('dcWallGrid'));
        gridBanner.rotation.y = -Math.PI / 2;
        gridBanner.position.set(26.78, 3.05, 9.8);
        this.group.add(gridBanner);

        // 5. Gray High-Voltage PDU / UPS Cabinet + Cardboard Box on Floor (ply_cam_east.png)
        const pdu = this.props.createPDUCabinetWithBox();
        pdu.rotation.y = -Math.PI / 2;
        pdu.position.set(26.1, 0, 4.2);
        this.group.add(pdu);
        this.addCollider(26.1, 1.1, 4.2, 0.9, 2.2, 1.0);

        // 6. Industrial Liebert CRAC Air Conditioning Units (ply_cam_east.png & ply_cam_south.png)
        const cracEast = this.props.createCRACUnit(2.6, 2.15, 0.90);
        cracEast.rotation.y = -Math.PI / 2;
        cracEast.position.set(26.2, 0, 8.2);
        this.group.add(cracEast);
        this.addCollider(26.2, 1.1, 8.2, 0.95, 2.2, 2.6);

        const cracSouth = this.props.createCRACUnit(2.8, 2.15, 0.90);
        cracSouth.rotation.y = Math.PI;
        cracSouth.position.set(21.0, 0, 17.2);
        this.group.add(cracSouth);
        this.addCollider(21.0, 1.1, 17.2, 2.8, 2.2, 0.95);
    }

    addWall(x, y, z, w, h, d, material) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
        wall.position.set(x, y, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.group.add(wall);
        if (y - h / 2 < 1.9 && y + h / 2 > 0.25 && material !== this.materials.get('glass')) {
            this.addCollider(x, y, z, w, h, d);
        }
        return wall;
    }

    addCollider(x, y, z, w, h, d) {
        this.colliders.push(new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(x, y, z), new THREE.Vector3(w, h, d)));
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
        sign.position.set(x, y, z);
        this.group.add(sign);
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
        if (this.ceiling) this.ceiling.visible = camera.position.y < 5;
    }
}
