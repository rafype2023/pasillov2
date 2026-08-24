import * as THREE from 'three';
import { officeMaterials } from './Materials.js';
import { officeProps } from './Props.js';

/**
 * FloorPlan: Photorealistic 3D Office Environment ("THE SPINE")
 * Faithfully matches the Unreal Engine reference image:
 * - Central Spine cubicle rows with modular beige fabric partitions and top aluminum trim
 * - Ergonomic curved maple desks with dual monitors, potted plants, photo frames, phones, and mesh chairs
 * - Integrated whiteboard milestone notes on partition walls
 * - Floor-to-ceiling glass executive boardroom with multi-monitor server monitoring video wall
 * - Suspended acoustic drop ceiling with warm-neutral fluorescent troffers
 * - Recessed red carpeted stairwell with silver handrails and office clock
 */
export class FloorPlan {
    constructor(scene) {
        this.scene = scene;
        this.materials = officeMaterials;
        this.props = officeProps;
        this.colliders = [];
        this.exits = [{ pos: new THREE.Vector3(0, 0, -17.2), name: 'Escaleras de Emergencia' }];
        this.spawnPoint = new THREE.Vector3(0, 0, 8); // Start at the front of the Spine
        this.loungePoint = new THREE.Vector3(16, 0, -2); // Boardroom / Lounge
        this.cubicleDesks = [];
        this.lights = [];

        this.buildOffice();
    }

    setEmergencyLighting(enabled) {
        const mat = this.materials.get('fluorescentLight');
        if (mat) {
            mat.emissive.setHex(enabled ? 0xff2222 : 0xfffaed);
            mat.emissiveIntensity = enabled ? 2.0 : 1.25;
        }
    }

    buildOffice() {
        this.group = new THREE.Group();

        // 1. Commercial Loop-Pile Carpet Floor & Suspended Acoustic Drop Ceiling
        this.createFloorAndCeiling();

        // 2. Perimeter Structural Walls & Panoramic Glass Mullions
        this.createPerimeterWalls();

        // 3. THE CENTRAL SPINE (Primary Cubicle Bank matching reference image)
        this.createCentralSpine();

        // 4. West Wing (Left): Additional Cubicle Banks & Manager Pods
        this.createWestWing();

        // 5. East Wing (Right): Glass Command Center / Boardroom with Server Video Wall
        this.createEastCommandCenter();

        // 6. Background Alcove: Red Carpeted Staircase & Office Clock
        this.createBackgroundStaircase();

        // 7. Ceiling Light Troffers (Overhead Corporate Illumination)
        this.createCeilingLights();

        this.scene.add(this.group);
    }

    createFloorAndCeiling() {
        // Floor: 56m wide x 38m deep
        const floorGeo = new THREE.PlaneGeometry(56, 38);
        const floorMesh = new THREE.Mesh(floorGeo, this.materials.get('carpet'));
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.receiveShadow = true;
        this.group.add(floorMesh);

        // Suspended Drop Ceiling Tile Grid at height y = 3.6m
        const ceilGeo = new THREE.PlaneGeometry(56, 38);
        const ceilMesh = new THREE.Mesh(ceilGeo, this.materials.get('ceiling'));
        ceilMesh.rotation.x = Math.PI / 2;
        ceilMesh.position.y = 3.6;
        this.group.add(ceilMesh);
    }

    createPerimeterWalls() {
        const wallMat = this.materials.get('wall');
        const glassMat = this.materials.get('glass');
        const trimMat = this.materials.get('cubicleTrim');
        const height = 3.6;

        // North Wall (Back)
        this.addWall(-10, height / 2, -18, 36, height, 0.3, wallMat);
        this.addWall(16, height / 2, -18, 16, height, 0.3, wallMat);

        // South Wall (Front)
        this.addWall(0, 0.45, 18, 54, 0.9, 0.3, wallMat);
        this.addWall(0, 2.25, 18, 54, 2.7, 0.15, glassMat);

        // West Wall (Left)
        this.addWall(-27, height / 2, 0, 0.3, height, 36, wallMat);

        // East Wall (Right)
        this.addWall(27, height / 2, 0, 0.3, height, 36, wallMat);

        // Window mullions (vertical aluminum pillars)
        for (let x = -24; x <= 24; x += 6) {
            const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.18, height, 0.3), trimMat);
            mullion.position.set(x, height / 2, 18);
            this.group.add(mullion);
        }
    }

    /**
     * Builds the signature "Central Spine" cubicle cluster (centered along Z axis)
     * Matches the exact layout, beige acoustic fabric, aluminum cap channels,
     * curved maple desks, whiteboards, and accessories from the reference image!
     */
    createCentralSpine() {
        const spineGroup = new THREE.Group();
        const fabricMat = this.materials.get('cubicleFabric');
        const trimMat = this.materials.get('cubicleTrim');
        const spineCapMat = this.materials.get('spineCap');

        const partitionH = 1.30;
        const spineH = 1.40;
        const podLength = 3.4; // Length per cubicle pair along Z
        const podCount = 4;    // 4 dual rows down the spine

        // 1. Central Structural Cable Spine Channel (runs through middle along Z)
        const spineLength = podCount * podLength + 0.6;
        const spineZCenter = 0;

        // Central Double-Sided Divider Partition
        const spineWallGeo = new THREE.BoxGeometry(0.12, partitionH, spineLength);
        const spineWall = new THREE.Mesh(spineWallGeo, fabricMat);
        spineWall.position.set(0, partitionH / 2, spineZCenter);
        spineWall.castShadow = true;
        spineGroup.add(spineWall);

        // Elevated Top Spine Channel Box / Shelf Cap
        const capGeo = new THREE.BoxGeometry(0.32, 0.14, spineLength);
        const cap = new THREE.Mesh(capGeo, spineCapMat);
        cap.position.set(0, partitionH + 0.07, spineZCenter);
        cap.castShadow = true;
        spineGroup.add(cap);

        // Top Aluminum Trim Line
        const trimGeo = new THREE.BoxGeometry(0.34, 0.025, spineLength);
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.set(0, partitionH + 0.145, spineZCenter);
        spineGroup.add(trim);

        // Register central spine collider
        const spineBox = new THREE.Box3();
        spineBox.setFromCenterAndSize(new THREE.Vector3(0, partitionH / 2, spineZCenter), new THREE.Vector3(0.4, partitionH, spineLength));
        this.colliders.push(spineBox);

        // 2. Transverse Dividers & Cubicle Pods (Left & Right of Spine)
        for (let i = 0; i < podCount; i++) {
            const z = (i - (podCount - 1) / 2) * podLength;

            // Transverse Divider Wall (Separating cubicles along Z)
            const divW = 2.7;
            const divGeo = new THREE.BoxGeometry(divW, partitionH, 0.10);

            // Left transverse partition
            const divLeft = new THREE.Mesh(divGeo, fabricMat);
            divLeft.position.set(-divW / 2 - 0.06, partitionH / 2, z - podLength / 2);
            divLeft.castShadow = true;
            spineGroup.add(divLeft);

            const divLeftTrim = new THREE.Mesh(new THREE.BoxGeometry(divW, 0.035, 0.12), trimMat);
            divLeftTrim.position.set(-divW / 2 - 0.06, partitionH + 0.018, z - podLength / 2);
            spineGroup.add(divLeftTrim);

            // Right transverse partition
            const divRight = new THREE.Mesh(divGeo, fabricMat);
            divRight.position.set(divW / 2 + 0.06, partitionH / 2, z - podLength / 2);
            divRight.castShadow = true;
            spineGroup.add(divRight);

            const divRightTrim = new THREE.Mesh(new THREE.BoxGeometry(divW, 0.035, 0.12), trimMat);
            divRightTrim.position.set(divW / 2 + 0.06, partitionH + 0.018, z - podLength / 2);
            spineGroup.add(divRightTrim);

            // Colliders for transverse walls
            const colL = new THREE.Box3();
            colL.setFromCenterAndSize(new THREE.Vector3(-divW / 2 - 0.06, partitionH / 2, z - podLength / 2), new THREE.Vector3(divW, partitionH, 0.2));
            this.colliders.push(colL);

            const colR = new THREE.Box3();
            colR.setFromCenterAndSize(new THREE.Vector3(divW / 2 + 0.06, partitionH / 2, z - podLength / 2), new THREE.Vector3(divW, partitionH, 0.2));
            this.colliders.push(colR);

            // Integrated Whiteboard mounted on partition wall (e.g. at pods 1 & 2)
            if (i === 1 || i === 2) {
                const wb = this.props.createWhiteboard(1.3, 0.85);
                wb.position.set(divW / 2 + 0.06, partitionH * 0.58, z - podLength / 2 + 0.06);
                spineGroup.add(wb);
            }

            // 3. Left Cubicle Pod Equipment & Desk
            const podL = this.props.createSpineCubiclePod('left');
            podL.position.set(-1.45, 0, z);
            spineGroup.add(podL);

            // 4. Right Cubicle Pod Equipment & Desk
            const podR = this.props.createSpineCubiclePod('right');
            podR.position.set(1.45, 0, z);
            spineGroup.add(podR);

            // Register desk collider boxes
            const deskBoxL = new THREE.Box3();
            deskBoxL.setFromCenterAndSize(new THREE.Vector3(-1.45, 0.4, z), new THREE.Vector3(2.2, 0.8, 1.4));
            this.colliders.push(deskBoxL);

            const deskBoxR = new THREE.Box3();
            deskBoxR.setFromCenterAndSize(new THREE.Vector3(1.45, 0.4, z), new THREE.Vector3(2.2, 0.8, 1.4));
            this.colliders.push(deskBoxR);
        }

        // End Caps for Spine
        const endZ = podCount * podLength / 2;
        const endWallL = new THREE.Mesh(new THREE.BoxGeometry(2.7, partitionH, 0.10), fabricMat);
        endWallL.position.set(-1.41, partitionH / 2, endZ);
        spineGroup.add(endWallL);

        const endWallR = new THREE.Mesh(new THREE.BoxGeometry(2.7, partitionH, 0.10), fabricMat);
        endWallR.position.set(1.41, partitionH / 2, endZ);
        spineGroup.add(endWallR);

        this.group.add(spineGroup);
    }

    /**
     * Builds West Wing (Left side cubicle clusters & open manager stations)
     */
    createWestWing() {
        const westGroup = new THREE.Group();
        const fabricMat = this.materials.get('cubicleFabric');
        const trimMat = this.materials.get('cubicleTrim');

        // Parallel cubicle cluster at X: -10
        for (let i = 0; i < 3; i++) {
            const z = (i - 1) * 3.4;
            const podL = this.props.createSpineCubiclePod('left');
            podL.position.set(-10, 0, z);
            westGroup.add(podL);

            const dBox = new THREE.Box3();
            dBox.setFromCenterAndSize(new THREE.Vector3(-10, 0.4, z), new THREE.Vector3(2.4, 0.8, 1.5));
            this.colliders.push(dBox);
        }

        // Corner Meeting Pod at X: -18, Z: 6
        const roundTable = this.props.createRoundMeetingTable(1.1, 4);
        roundTable.position.set(-18, 0, 6);
        westGroup.add(roundTable);

        this.group.add(westGroup);
    }

    /**
     * Builds the Executive Glass Boardroom & Server Telemetry Command Center on the right (matching reference image)
     */
    createEastCommandCenter() {
        const cmdGroup = new THREE.Group();
        const glassMat = this.materials.get('glass');
        const wallMat = this.materials.get('wall');
        const trimMat = this.materials.get('cubicleTrim');
        const height = 3.2;

        const xCenter = 16;
        const zCenter = 0;
        const width = 10;
        const depth = 12;

        // 1. Glass Wall Front facing the Central Aisle (X: 11)
        const glassWallGeo = new THREE.BoxGeometry(0.08, height, depth - 2.0);
        const glassWall = new THREE.Mesh(glassWallGeo, glassMat);
        glassWall.position.set(11, height / 2, zCenter - 1.0);
        cmdGroup.add(glassWall);

        // Aluminum mullions along the glass wall
        for (let z = -depth / 2 + 1; z <= depth / 2 - 1; z += 2.0) {
            const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.14, height, 0.12), trimMat);
            mullion.position.set(11, height / 2, z);
            cmdGroup.add(mullion);
        }

        // Glass Door Opening (Z: +5)
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, height, 1.4), trimMat);
        doorFrame.position.set(11, height / 2, 5.2);
        cmdGroup.add(doorFrame);

        // Glass Door (Ajar at 45 degrees)
        const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.4, 1.1), glassMat);
        door.rotation.y = 0.55;
        door.position.set(11.2, 1.2, 5.2);
        cmdGroup.add(door);

        // Solid Boundary Walls
        this.addWall(xCenter + width / 2, height / 2, zCenter, 0.3, height, depth, wallMat);
        this.addWall(xCenter, height / 2, -depth / 2, width, height, 0.3, wallMat);
        this.addWall(xCenter, height / 2, depth / 2, width, height, 0.3, wallMat);

        // Register collider for glass perimeter
        const glassBox = new THREE.Box3();
        glassBox.setFromCenterAndSize(new THREE.Vector3(11, height / 2, zCenter - 1.0), new THREE.Vector3(0.3, height, depth - 2.0));
        this.colliders.push(glassBox);

        // 2. Command Center Furniture & 6-Screen Server Video Wall
        const interior = this.props.createCommandCenter(width, depth, height);
        interior.position.set(xCenter, 0, zCenter);
        cmdGroup.add(interior);

        this.group.add(cmdGroup);
    }

    /**
     * Builds the Red Carpeted Stairway Alcove & Clock in the central background (matching reference image)
     */
    createBackgroundStaircase() {
        const stairs = this.props.createBackgroundStaircase();
        stairs.position.set(0, 0, -17.2);
        this.group.add(stairs);

        // Stairwell doorway collider
        const stairCol = new THREE.Box3();
        stairCol.setFromCenterAndSize(new THREE.Vector3(0, 1.0, -18.5), new THREE.Vector3(3.0, 2.0, 1.0));
        this.colliders.push(stairCol);
    }

    /**
     * Suspended Fluorescent Light Troffers across the Ceiling
     * Casts clean corporate illumination and contact shadows
     */
    createCeilingLights() {
        const lightGeo = new THREE.BoxGeometry(1.6, 0.04, 0.8);
        const lightMat = this.materials.get('fluorescentLight');
        const trimMat = this.materials.get('cubicleTrim');

        // Light Troffers in 4 longitudinal columns matching office rows
        const xCols = [-14, -4, 4, 16];
        const zRows = [-14, -8, -2, 4, 10, 15];

        xCols.forEach(x => {
            zRows.forEach(z => {
                const group = new THREE.Group();
                const fixture = new THREE.Mesh(lightGeo, lightMat);
                fixture.position.set(0, 3.58, 0);
                group.add(fixture);

                const frame = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.02, 0.86), trimMat);
                frame.position.set(0, 3.595, 0);
                group.add(frame);

                group.position.set(x, 0, z);
                this.group.add(group);
            });
        });
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
