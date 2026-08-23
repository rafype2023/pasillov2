import * as THREE from 'three';
import { officeMaterials } from './Materials.js';
import { officeProps } from './Props.js';

export class FloorPlan {
    constructor(scene) {
        this.scene = scene;
        this.materials = officeMaterials;
        this.props = officeProps;
        this.colliders = []; // List of bounding boxes for physics collision
        this.exits = [];     // List of exit locations (stairwells)
        this.spawnPoint = new THREE.Vector3(0, 0, 0); // Central Lobby corridor
        this.loungePoint = new THREE.Vector3(26, 0, -8); // Breakroom Lounge
        this.cubicleDesks = [];
        this.lights = [];
        this.interactiveObjects = [];

        this.buildOffice();
    }

    buildOffice() {
        this.group = new THREE.Group();

        // 1. Floor (Wide aspect ratio matching Plano2.png: 78m x 28m)
        this.createFloorAndCeiling();

        // 2. Outer Perimeter Walls
        this.createPerimeterWalls();

        // 3. Central Core: 3 Elevators, Restrooms & Main Corridors
        this.createCentralCore();

        // 4. West Wing (Left): Boardroom, Executive Pods, Lounge Booths & 4 Cubicle Rows
        this.createWestWing();

        // 5. East Wing (Right): Conference Suites, 3 Long Cubicle Banks & Green Breakout Lounges
        this.createEastWing();

        // 6. Emergency Stairwell Exits (Matching Plano2.png)
        this.createStairwellExits();

        // 7. Ceiling Lighting Grid & Office Details
        this.createCeilingLights();

        this.scene.add(this.group);
    }

    createFloorAndCeiling() {
        // Floor Mesh: 78m wide x 28m deep (matching Plano2.png)
        const floorGeo = new THREE.PlaneGeometry(80, 30);
        const floorMesh = new THREE.Mesh(floorGeo, this.materials.get('carpet'));
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        this.group.add(floorMesh);

        // Open top beams for structural realism without obstructing camera view
        const beamMat = this.materials.get('cubicleTrim');
        for (let x = -36; x <= 36; x += 12) {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 29), beamMat);
            beam.position.set(x, 3.4, 0);
            this.group.add(beam);
        }
    }

    createPerimeterWalls() {
        const wallMat = this.materials.get('wall');
        const glassMat = this.materials.get('glass');
        const trimMat = this.materials.get('cubicleTrim');
        const height = 3.2;

        // North Perimeter: Alternating Lower Wall + Upper Panoramic Glass
        this.addWall(0, 0.45, -14, 78, 0.9, 0.3, wallMat);
        this.addWall(0, 2.05, -14, 78, 2.3, 0.15, glassMat);

        // South Perimeter: Lower Wall + Panoramic Glass
        this.addWall(0, 0.45, 14, 78, 0.9, 0.3, wallMat);
        this.addWall(0, 2.05, 14, 78, 2.3, 0.15, glassMat);

        // West Perimeter: Solid Wall + Emergency Exit Framing
        this.addWall(-39, height / 2, 0, 0.3, height, 28, wallMat);

        // East Perimeter: Solid Wall + Corner Glass
        this.addWall(39, height / 2, 0, 0.3, height, 28, wallMat);

        // Window mullions (vertical aluminum pillars)
        for (let x = -36; x <= 36; x += 6) {
            const colN = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, 0.35), trimMat);
            colN.position.set(x, height / 2, -14);
            this.group.add(colN);

            const colS = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, 0.35), trimMat);
            colS.position.set(x, height / 2, 14);
            this.group.add(colS);
        }

        // 3D Exterior City Skyline (San Juan / Hato Rey Financial District Panorama)
        this.createCitySkylineBackdrop();
    }

    createCitySkylineBackdrop() {
        const skyGroup = new THREE.Group();
        const buildingMat1 = new THREE.MeshStandardMaterial({ color: 0x1e2738, roughness: 0.3, metalness: 0.7 });
        const buildingMat2 = new THREE.MeshStandardMaterial({ color: 0x2c3545, roughness: 0.4, metalness: 0.5 });
        const buildingMat3 = new THREE.MeshStandardMaterial({ color: 0x151c28, roughness: 0.2, metalness: 0.8 });
        const windowGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe6aa, transparent: true, opacity: 0.75 });

        const mats = [buildingMat1, buildingMat2, buildingMat3];

        // North Skyscraper Skyline (Beyond Z: -22)
        const northTowers = [
            { x: -35, z: -28, w: 14, d: 14, h: 42 },
            { x: -18, z: -32, w: 18, d: 16, h: 58 },
            { x: 0, z: -26, w: 16, d: 14, h: 36 },
            { x: 18, z: -30, w: 15, d: 15, h: 48 },
            { x: 35, z: -27, w: 16, d: 14, h: 38 }
        ];

        // South Skyscraper Skyline (Beyond Z: +22)
        const southTowers = [
            { x: -32, z: 28, w: 15, d: 15, h: 46 },
            { x: -14, z: 32, w: 18, d: 16, h: 54 },
            { x: 5, z: 27, w: 16, d: 14, h: 40 },
            { x: 22, z: 30, w: 16, d: 15, h: 50 },
            { x: 38, z: 28, w: 14, d: 14, h: 36 }
        ];

        [...northTowers, ...southTowers].forEach((t, idx) => {
            const mat = mats[idx % mats.length];
            const tower = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), mat);
            tower.position.set(t.x, t.h / 2 - 8, t.z);
            skyGroup.add(tower);

            // Roof antenna
            const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 8, 8), mat);
            antenna.position.set(t.x, t.h - 4, t.z);
            skyGroup.add(antenna);
        });

        this.group.add(skyGroup);
    }

    addWall(x, y, z, w, h, d, material, isCubicle = false) {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.group.add(mesh);

        // Register collider box for collision detection
        const box = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(x, isCubicle ? 0.8 : y, z),
            new THREE.Vector3(w, isCubicle ? 1.6 : h, d)
        );
        this.colliders.push(box);
        return mesh;
    }

    createCentralCore() {
        const wallMat = this.materials.get('wall');
        const glassMat = this.materials.get('glass');
        const height = 3.2;

        // Elevator Bank (3 Elevators at X: 4.5, Z: [-3.2, 0, 3.2])
        const elevators = this.props.createElevatorBank();
        elevators.position.set(4.5, 0, 0);
        this.group.add(elevators);

        // Elevator shaft back and side walls
        this.addWall(4.5, height / 2, 0, 0.3, height, 9.6, wallMat);
        this.addWall(6.0, height / 2, -4.8, 3.0, height, 0.3, wallMat);
        this.addWall(6.0, height / 2, 4.8, 3.0, height, 0.3, wallMat);
        this.addWall(7.5, height / 2, 0, 0.3, height, 9.6, wallMat);

        // Restroom Core (West of elevator lobby: X: -2, Z: -5.5)
        this.addWall(-2.0, height / 2, -5.5, 0.3, height, 15.0, wallMat);
        this.addWall(-4.5, height / 2, 2.0, 5.0, height, 0.3, wallMat);

        // Water cooler / Sanitizer in central lobby
        const sanitizer = this.props.createHandSanitizer();
        sanitizer.position.set(0, 0, 0);
        this.group.add(sanitizer);
        this.interactiveObjects.push({ type: 'sanitizer', mesh: sanitizer, pos: new THREE.Vector3(0, 0, 0) });
    }

    createWestWing() {
        const wallMat = this.materials.get('wall');
        const glassMat = this.materials.get('glass');
        const cubicleMat = this.materials.get('cubicleFabric');
        const height = 3.2;
        const partitionH = 1.55;

        // 1. Boardroom Conference Room (Top-West: X: [-36, -26], Z: [-13, -5])
        this.addWall(-31, height / 2, -5.0, 10.0, height, 0.25, wallMat);
        this.addWall(-26, height / 2, -9.0, 0.25, height, 8.0, wallMat);
        // Glass doorway transom
        this.addWall(-26, height / 2, -5.0, 0.2, height, 2.0, glassMat);

        // Large Conference Table inside Boardroom
        const confTableW = this.props.createConferenceTable(5.2, 1.8, 10);
        confTableW.position.set(-31, 0, -9.0);
        this.group.add(confTableW);

        // Whiteboard on Boardroom Wall
        const wb1 = this.props.createWhiteboard(3.0, 1.4);
        wb1.position.set(-31, 1.8, -13.8);
        this.group.add(wb1);

        // 2. South-West Conference Room (X: [-36, -26], Z: [5, 13])
        this.addWall(-31, height / 2, 5.0, 10.0, height, 0.25, wallMat);
        this.addWall(-26, height / 2, 9.0, 0.25, height, 8.0, wallMat);

        const confTableSW = this.props.createConferenceTable(4.2, 1.6, 8);
        confTableSW.position.set(-31, 0, 9.0);
        this.group.add(confTableSW);

        // 3. West Executive Discussion Pods (Far West center: X: -33, Z: 0)
        const roundTableW = this.props.createRoundMeetingTable(1.1, 4);
        roundTableW.position.set(-33, 0, 0);
        this.group.add(roundTableW);

        // 4. Executive Suite & U-shaped Lounge Booths (Top Center-West: X: [-24, -14], Z: [-13, -7])
        this.addWall(-19, height / 2, -7.0, 10.0, height, 0.25, wallMat);
        const loungeTable = this.props.createConferenceTable(3.6, 1.4, 6);
        loungeTable.position.set(-19, 0, -10.5);
        this.group.add(loungeTable);

        // 5. 4 Double-Sided Cubicle Workstation Rows in West Wing (X: -24, -19, -14, -9)
        const westRowX = [-24, -19, -14, -9];
        const westZSlots = [-2, 1, 4, 7, 10];

        westRowX.forEach(x => {
            // Center partition dividing double rows
            this.addWall(x, partitionH / 2, 4.0, 0.12, partitionH, 13.0, cubicleMat, true);

            westZSlots.forEach(z => {
                // Left Desk (Facing East)
                const deskL = this.props.createCubicleDesk(1.8, 1.2, 0.75);
                deskL.position.set(x - 0.95, 0, z);
                deskL.rotation.y = Math.PI / 2;
                this.group.add(deskL);
                this.cubicleDesks.push({ pos: new THREE.Vector3(x - 0.95, 0, z) });

                // Right Desk (Facing West)
                const deskR = this.props.createCubicleDesk(1.8, 1.2, 0.75);
                deskR.position.set(x + 0.95, 0, z);
                deskR.rotation.y = -Math.PI / 2;
                this.group.add(deskR);
                this.cubicleDesks.push({ pos: new THREE.Vector3(x + 0.95, 0, z) });

                // Cross partition
                this.addWall(x - 0.95, partitionH / 2, z + 0.9, 1.9, partitionH, 0.1, cubicleMat, true);
                this.addWall(x + 0.95, partitionH / 2, z + 0.9, 1.9, partitionH, 0.1, cubicleMat, true);

                // Add filing cabinet
                const cabinet = this.props.createFilingCabinet();
                cabinet.position.set(x - 1.5, 0, z - 0.4);
                this.group.add(cabinet);
            });
        });
    }

    createEastWing() {
        const wallMat = this.materials.get('wall');
        const glassMat = this.materials.get('glass');
        const cubicleMat = this.materials.get('cubicleFabric');
        const height = 3.2;
        const partitionH = 1.55;

        // 1. North-East Conference Suite (X: [9, 17], Z: [-13, -5])
        this.addWall(13, height / 2, -5.0, 8.0, height, 0.25, wallMat);
        this.addWall(17, height / 2, -9.0, 0.25, height, 8.0, wallMat);
        // Glass wall
        this.addWall(9, height / 2, -9.0, 0.25, height, 8.0, glassMat);

        const confTableNE = this.props.createConferenceTable(4.8, 1.8, 8);
        confTableNE.position.set(13, 0, -9.0);
        this.group.add(confTableNE);

        // 2. Central-East Oval Conference Room (X: [9, 17], Z: [-2, 6])
        this.addWall(13, height / 2, -2.0, 8.0, height, 0.25, wallMat);
        this.addWall(13, height / 2, 6.0, 8.0, height, 0.25, wallMat);
        this.addWall(17, height / 2, 2.0, 0.25, height, 8.0, glassMat);

        const confTableCE = this.props.createConferenceTable(4.2, 1.6, 8);
        confTableCE.position.set(13, 0, 2.0);
        this.group.add(confTableCE);

        // 3. 3 Long Double-Sided Cubicle Workstation Rows (X: 21, 26, 31)
        const eastRowX = [21, 26, 31];
        const eastZSlots = [-10, -7, -4, -1, 2, 5, 8, 11];

        eastRowX.forEach(x => {
            // Main spine partition
            this.addWall(x, partitionH / 2, 0.5, 0.12, partitionH, 23.0, cubicleMat, true);

            eastZSlots.forEach(z => {
                // West-facing desk
                const deskW = this.props.createCubicleDesk(1.8, 1.2, 0.75);
                deskW.position.set(x - 0.95, 0, z);
                deskW.rotation.y = Math.PI / 2;
                this.group.add(deskW);
                this.cubicleDesks.push({ pos: new THREE.Vector3(x - 0.95, 0, z) });

                // East-facing desk
                const deskE = this.props.createCubicleDesk(1.8, 1.2, 0.75);
                deskE.position.set(x + 0.95, 0, z);
                deskE.rotation.y = -Math.PI / 2;
                this.group.add(deskE);
                this.cubicleDesks.push({ pos: new THREE.Vector3(x + 0.95, 0, z) });

                // Cross divider
                this.addWall(x - 0.95, partitionH / 2, z + 0.9, 1.9, partitionH, 0.1, cubicleMat, true);
                this.addWall(x + 0.95, partitionH / 2, z + 0.9, 1.9, partitionH, 0.1, cubicleMat, true);
            });
        });

        // 4. Breakout Lounges with Olive Green Armchairs (cub4.png, cub5.png)
        // Lounge Area 1 (X: 35.5, Z: -8)
        const chair1 = this.props.createGreenArmchair();
        chair1.position.set(35.5, 0, -9.0);
        chair1.rotation.y = -Math.PI / 4;
        this.group.add(chair1);

        const chair2 = this.props.createGreenArmchair();
        chair2.position.set(35.5, 0, -7.0);
        chair2.rotation.y = -Math.PI * 0.75;
        this.group.add(chair2);

        // Lounge Area 2 (X: 35.5, Z: 8)
        const chair3 = this.props.createGreenArmchair();
        chair3.position.set(35.5, 0, 7.0);
        chair3.rotation.y = -Math.PI / 4;
        this.group.add(chair3);

        const chair4 = this.props.createGreenArmchair();
        chair4.position.set(35.5, 0, 9.0);
        chair4.rotation.y = -Math.PI * 0.75;
        this.group.add(chair4);

        // Breakroom Snack Table (Level 2 destination)
        const snackTable = this.props.createSnacksTable();
        snackTable.position.set(this.loungePoint.x, 0, this.loungePoint.z);
        this.group.add(snackTable);
    }

    createStairwellExits() {
        // 1. West Main Stairwell Escape (Red highlighted stairwell in Plano2.png: X: -3.5, Z: 8.5)
        const exitWest = this.props.createStairwellExit(1.4, 2.4);
        exitWest.position.set(-3.5, 0, 8.5);
        exitWest.rotation.y = Math.PI;
        this.group.add(exitWest);
        this.exits.push({ pos: new THREE.Vector3(-3.5, 0, 8.5), name: 'Escalera Oeste (Principal)' });

        // 2. Far West Fire Exit (X: -38, Z: 0)
        const exitFarWest = this.props.createStairwellExit(1.4, 2.4);
        exitFarWest.position.set(-38.0, 0, 0);
        exitFarWest.rotation.y = Math.PI / 2;
        this.group.add(exitFarWest);
        this.exits.push({ pos: new THREE.Vector3(-38.0, 0, 0), name: 'Salida de Emergencia Oeste' });

        // 3. Far East Fire Exit (X: 38, Z: 0)
        const exitEast = this.props.createStairwellExit(1.4, 2.4);
        exitEast.position.set(38.0, 0, 0);
        exitEast.rotation.y = -Math.PI / 2;
        this.group.add(exitEast);
        this.exits.push({ pos: new THREE.Vector3(38.0, 0, 0), name: 'Salida de Emergencia Este' });

        // 4. North Exit (X: 0, Z: -13.5)
        const exitNorth = this.props.createStairwellExit(1.4, 2.4);
        exitNorth.position.set(0, 0, -13.5);
        exitNorth.rotation.y = 0;
        this.group.add(exitNorth);
        this.exits.push({ pos: new THREE.Vector3(0, 0, -13.5), name: 'Salida Norte' });
    }

    createCeilingLights() {
        // Grid of fluorescent lights across the 78m x 28m office floor
        const lightGeo = new THREE.BoxGeometry(1.6, 0.08, 0.45);
        const lightMat = this.materials.get('fluorescentLight');

        for (let x = -34; x <= 34; x += 8) {
            for (let z = -10; z <= 10; z += 5) {
                const lightMesh = new THREE.Mesh(lightGeo, lightMat);
                lightMesh.position.set(x, 3.35, z);
                this.group.add(lightMesh);

                // Soft point light every alternating grid
                if ((x + z) % 10 === 0) {
                    const pl = new THREE.PointLight(0xfffaed, 0.35, 14);
                    pl.position.set(x, 3.0, z);
                    this.group.add(pl);
                    this.lights.push(pl);
                }
            }
        }
    }

    setEmergencyLighting(isAlert) {
        this.lights.forEach(light => {
            if (isAlert) {
                light.color.setHex(0xff1111);
                light.intensity = 0.7;
            } else {
                light.color.setHex(0xfffaed);
                light.intensity = 0.35;
            }
        });
    }

    getRandomSafeSpot() {
        const spots = [
            new THREE.Vector3(-31, 0, -9.0),  // Boardroom
            new THREE.Vector3(-31, 0, 9.0),   // SW Conference
            new THREE.Vector3(-19, 0, -10.5), // Top Lounge
            new THREE.Vector3(13, 0, -9.0),   // NE Conference
            new THREE.Vector3(13, 0, 2.0),    // Central-East Conference
            new THREE.Vector3(35, 0, -8.0),   // East Green Lounge
            new THREE.Vector3(35, 0, 8.0),    // East Breakout Lounge
            new THREE.Vector3(0, 0, 6.0)      // Central Lobby
        ];
        return spots[Math.floor(Math.random() * spots.length)].clone();
    }
}
