import * as THREE from 'three';
import { officeMaterials } from './Materials.js';

export class OfficeProps {
    constructor() {
        this.materials = officeMaterials;
    }

    /**
     * Builds the high-fidelity Central Spine Cubicle Pod (matching the reference render)
     * Features: L-shaped curved maple desks, central cable spine, whiteboards, dual monitors,
     * potted succulents, picture frames, phones, water bottles, ergonomic mesh chairs, and 3-drawer pedestals.
     */
    createSpineCubiclePod(side = 'left') {
        const group = new THREE.Group();
        const deskWidth = 2.4;
        const deskDepth = 1.6;
        const deskHeight = 0.74;
        const isLeft = (side === 'left');

        // Pale laminate L desk with an open knee/chair recess, as in cub2/cub3.
        const outline = new THREE.Shape();
        outline.moveTo(-1.2, -.8); outline.lineTo(1.2, -.8);
        outline.lineTo(1.2, 1.65); outline.lineTo(.56, 1.65);
        outline.lineTo(.56, .62); outline.quadraticCurveTo(.56, .35, .26, .35);
        outline.lineTo(-1.2, .35); outline.closePath();
        const deskGeometry = new THREE.ExtrudeGeometry(outline, {depth:.04, bevelEnabled:false, curveSegments:12});
        deskGeometry.rotateX(Math.PI/2);
        if (isLeft) deskGeometry.scale(-1,1,1);
        const mainDesk = new THREE.Mesh(deskGeometry, this.materials.get('deskTop'));
        mainDesk.position.y = deskHeight+.04;
        mainDesk.castShadow = true; mainDesk.receiveShadow = true; group.add(mainDesk);

        // Modesty Panel & Legs (Black metal)
        const modestyGeo = new THREE.BoxGeometry(deskWidth - 0.2, 0.45, 0.02);
        const modesty = new THREE.Mesh(modestyGeo, this.materials.get('deskLegs'));
        modesty.position.set(0, deskHeight - 0.25, -deskDepth / 2 + 0.1);
        group.add(modesty);

        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, deskHeight, 12);
        const legMat = this.materials.get('deskLegs');
        [[-deskWidth / 2 + 0.1, -deskDepth / 2 + 0.1], [deskWidth / 2 - 0.1, -deskDepth / 2 + 0.1],
         [-deskWidth / 2 + 0.1, deskDepth / 2 - 0.1], [deskWidth / 2 - 0.1, deskDepth / 2 - 0.1]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(lx, deskHeight / 2, lz);
            leg.castShadow = true;
            group.add(leg);
        });

        // 2. Under-Desk 3-Drawer Filing Pedestal
        const pedestal = this.createFilingPedestal();
        pedestal.position.set(isLeft ? -deskWidth / 2 + 0.4 : deskWidth / 2 - 0.4, 0, -deskDepth / 4);
        group.add(pedestal);

        // 3. Dual Black Monitors on Articulated Monitor Arms
        const monitor1 = this.createSlimMonitor();
        monitor1.position.set(-0.32, deskHeight + 0.02, -0.35);
        monitor1.rotation.y = 0.18;
        group.add(monitor1);

        const monitor2 = this.createSlimMonitor();
        monitor2.position.set(0.32, deskHeight + 0.02, -0.35);
        monitor2.rotation.y = -0.18;
        group.add(monitor2);

        // 4. Black Desk Mat & Slim Keyboard
        const padGeo = new THREE.BoxGeometry(0.85, 0.005, 0.42);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x181a1f, roughness: 0.8 });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(0, deskHeight + 0.022, 0.15);
        group.add(pad);

        const kbGeo = new THREE.BoxGeometry(0.44, 0.012, 0.14);
        const kbMat = new THREE.MeshStandardMaterial({ color: 0x2d3139, roughness: 0.4 });
        const kb = new THREE.Mesh(kbGeo, kbMat);
        kb.position.set(-0.08, deskHeight + 0.028, 0.15);
        group.add(kb);

        const mouseGeo = new THREE.BoxGeometry(0.06, 0.02, 0.10);
        const mouse = new THREE.Mesh(mouseGeo, this.materials.get('deskLegs'));
        mouse.position.set(0.24, deskHeight + 0.03, 0.15);
        group.add(mouse);

        // 5. Potted Green Desk Plant (Succulent in ceramic pot)
        const plant = this.createDeskPlant();
        plant.position.set(isLeft ? 0.75 : -0.75, deskHeight + 0.02, -0.35);
        group.add(plant);

        // 6. Framed Desktop Photo
        const photo = this.createFramedPhoto();
        photo.position.set(isLeft ? 0.95 : -0.95, deskHeight + 0.02, 0.35);
        photo.rotation.y = isLeft ? -0.4 : 0.4;
        group.add(photo);

        // 7. Desk Landline Phone with Handset
        const phone = this.createDeskPhone();
        phone.position.set(isLeft ? -0.85 : 0.85, deskHeight + 0.02, 0.25);
        phone.rotation.y = isLeft ? 0.35 : -0.35;
        group.add(phone);

        // 8. Water Bottle
        const bottle = this.createWaterBottle();
        bottle.position.set(isLeft ? -0.95 : 0.95, deskHeight + 0.02, -0.4);
        group.add(bottle);

        // 9. High-End Ergonomic Mesh Office Chair
        const chair = this.createErgonomicMeshChair();
        chair.position.set(0, 0, 0.85);
        chair.rotation.y = Math.PI + (Math.random() * 0.3 - 0.15);
        group.add(chair);

        // 10. Wastebasket under desk
        const trash = this.createTrashCan();
        trash.position.set(isLeft ? -0.8 : 0.8, 0, 0.6);
        group.add(trash);

        return group;
    }

    createSlimMonitor() {
        const group = new THREE.Group();
        const plasticMat = this.materials.get('monitorPlastic');
        const screenMat = this.materials.get('monitorScreen');

        // Circular Stand Base
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.015, 16), plasticMat);
        base.position.y = 0.008;
        group.add(base);

        // Articulated Arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.26, 0.035), plasticMat);
        arm.position.set(0, 0.14, -0.02);
        group.add(arm);

        // Ultra-thin Bezel Screen (16:9)
        const w = 0.58;
        const h = 0.36;
        const bezel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.02), plasticMat);
        bezel.position.set(0, 0.32, 0);
        bezel.castShadow = true;
        group.add(bezel);

        const screen = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.02, h - 0.02), screenMat);
        screen.position.set(0, 0.32, 0.012);
        group.add(screen);

        return group;
    }

    createDeskPlant() {
        const group = new THREE.Group();
        const potMat = this.materials.get('plantPot');
        const leafMat = this.materials.get('plantLeaves');

        // Ceramic Pot
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.10, 16), potMat);
        pot.position.y = 0.05;
        pot.castShadow = true;
        group.add(pot);

        // Soil
        const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 }));
        soil.position.y = 0.098;
        group.add(soil);

        // Succulent Leaves Cluster
        for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2;
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 8), leafMat);
            leaf.position.set(Math.cos(angle) * 0.03, 0.13, Math.sin(angle) * 0.03);
            leaf.rotation.set(Math.sin(angle) * 0.4, 0, -Math.cos(angle) * 0.4);
            group.add(leaf);
        }

        const centerLeaf = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.13, 8), leafMat);
        centerLeaf.position.y = 0.14;
        group.add(centerLeaf);

        return group;
    }

    createFramedPhoto() {
        const group = new THREE.Group();
        const frameMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.5 });
        const photoMat = new THREE.MeshStandardMaterial({ color: 0xf5eedc, roughness: 0.3 });

        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.015), frameMat);
        frame.position.y = 0.08;
        frame.rotation.x = -0.15;
        group.add(frame);

        // Photo Face
        const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.13), photoMat);
        photo.position.set(0, 0.08, 0.01);
        photo.rotation.x = -0.15;
        group.add(photo);

        return group;
    }

    createFilingPedestal() {
        const group = new THREE.Group();
        const mat = this.materials.get('filingCabinet');
        const handleMat = this.materials.get('cubicleTrim');

        // Pedestal Body (3-Drawer Mobile Cabinet)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.55), mat);
        body.position.y = 0.31;
        body.castShadow = true;
        group.add(body);

        // Drawer seams & handles
        [0.14, 0.34, 0.52].forEach(y => {
            const seam = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.005, 0.01), this.materials.get('deskLegs'));
            seam.position.set(0, y, 0.28);
            group.add(seam);

            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.02), handleMat);
            handle.position.set(0, y + 0.06, 0.285);
            group.add(handle);
        });

        return group;
    }

    createErgonomicMeshChair() {
        const group = new THREE.Group();
        const meshMat = this.materials.get('meshChair');
        const metalMat = this.materials.get('deskLegs');
        const chromeMat = this.materials.get('cubicleTrim');

        // 1. 5-Star Caster Base
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.30), metalMat);
            leg.rotation.z = Math.PI / 2;
            leg.rotation.y = angle;
            leg.position.set(Math.cos(angle) * 0.15, 0.06, Math.sin(angle) * 0.15);
            group.add(leg);

            // Caster wheel
            const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), metalMat);
            wheel.position.set(Math.cos(angle) * 0.30, 0.025, Math.sin(angle) * 0.30);
            group.add(wheel);
        }

        // 2. Gas Lift Cylinder
        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.32, 12), chromeMat);
        cylinder.position.y = 0.22;
        group.add(cylinder);

        // 3. Contoured Seat Cushion
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.48), meshMat);
        seat.position.y = 0.44;
        seat.castShadow = true;
        group.add(seat);

        // 4. Ergonomic Curved Mesh Backrest
        const backGeo = new THREE.BoxGeometry(0.44, 0.52, 0.04);
        const back = new THREE.Mesh(backGeo, meshMat);
        back.position.set(0, 0.72, -0.22);
        back.rotation.x = -0.06;
        back.castShadow = true;
        group.add(back);

        // Lumbar Support Spine (Vertical metal spine)
        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.03), metalMat);
        spine.position.set(0, 0.65, -0.25);
        group.add(spine);

        // 5. 3D Armrests
        [[-0.26, 1], [0.26, -1]].forEach(([ax, side]) => {
            const armPost = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.24), metalMat);
            armPost.position.set(ax, 0.54, -0.02);
            group.add(armPost);

            const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.24), meshMat);
            armPad.position.set(ax, 0.66, 0.02);
            group.add(armPad);
        });

        return group;
    }

    createDeskPhone() {
        const group = new THREE.Group();
        const mat = this.materials.get('monitorPlastic');

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.05, 0.22), mat);
        body.position.y = 0.025;
        body.rotation.x = 0.18;
        group.add(body);

        const handset = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.22), mat);
        handset.position.set(-0.06, 0.065, 0);
        handset.rotation.x = 0.18;
        group.add(handset);

        return group;
    }

    createWaterBottle() {
        const group = new THREE.Group();
        const bottle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.038, 0.038, 0.22, 16),
            new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75, roughness: 0.2 })
        );
        bottle.position.y = 0.11;
        group.add(bottle);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        cap.position.y = 0.23;
        group.add(cap);

        return group;
    }

    createRoundMeetingTable(radius = 1.0, chairCount = 4) {
        const group = new THREE.Group();
        const topGeo = new THREE.CylinderGeometry(radius, radius, 0.05, 24);
        const top = new THREE.Mesh(topGeo, this.materials.get('deskTop'));
        top.position.y = 0.74;
        top.castShadow = true;
        group.add(top);

        const legGeo = new THREE.CylinderGeometry(0.06, 0.22, 0.72, 16);
        const leg = new THREE.Mesh(legGeo, this.materials.get('cubicleTrim'));
        leg.position.y = 0.36;
        group.add(leg);

        for (let i = 0; i < chairCount; i++) {
            const angle = (i / chairCount) * Math.PI * 2;
            const chair = this.createErgonomicMeshChair();
            chair.position.set(Math.cos(angle) * (radius + 0.35), 0, Math.sin(angle) * (radius + 0.35));
            chair.rotation.y = -angle - Math.PI / 2;
            group.add(chair);
        }

        return group;
    }

    createTrashCan() {
        const group = new THREE.Group();
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.36, 16), this.materials.get('trashBin'));
        can.position.y = 0.18;
        group.add(can);
        return group;
    }

    /**
     * Builds the Executive Conference Room / Command Center with Server Wall (matching right side of reference)
     */
    createCommandCenter(width = 8.5, depth = 6.2, height = 3.2) {
        const group = new THREE.Group();
        const trimMat = this.materials.get('cubicleTrim');
        const glassMat = this.materials.get('glass');

        // 1. Large Oval Boardroom Table
        const tableGeo = new THREE.BoxGeometry(4.6, 0.08, 1.8);
        const table = new THREE.Mesh(tableGeo, this.materials.get('confTableWood'));
        table.position.set(0, 0.76, 0);
        table.castShadow = true;
        group.add(table);

        // 2 Heavy Pedestal Columns
        const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.72, 16), trimMat);
        col1.position.set(-1.4, 0.36, 0);
        group.add(col1);
        const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.72, 16), trimMat);
        col2.position.set(1.4, 0.36, 0);
        group.add(col2);

        // 8 Executive Mesh Chairs
        for (let i = 0; i < 3; i++) {
            const x = -1.3 + i * 1.3;
            const cN = this.createErgonomicMeshChair();
            cN.position.set(x, 0, -1.25);
            cN.rotation.y = 0;
            group.add(cN);

            const cS = this.createErgonomicMeshChair();
            cS.position.set(x, 0, 1.25);
            cS.rotation.y = Math.PI;
            group.add(cS);
        }
        const cW = this.createErgonomicMeshChair();
        cW.position.set(-2.6, 0, 0);
        cW.rotation.y = Math.PI / 2;
        group.add(cW);
        const cE = this.createErgonomicMeshChair();
        cE.position.set(2.6, 0, 0);
        cE.rotation.y = -Math.PI / 2;
        group.add(cE);

        // 2. High-Tech Multi-Screen Server Video Wall on Rear Wall
        const srvWallGeo = new THREE.BoxGeometry(4.8, 2.2, 0.08);
        const srvWall = new THREE.Mesh(srvWallGeo, this.materials.get('serverWall'));
        srvWall.position.set(0, 1.85, depth / 2 - 0.05);
        group.add(srvWall);

        return group;
    }

    /**
     * Builds the Red Carpeted Stairwell Alcove & Clock (matching center background of reference)
     */
    createBackgroundStaircase() {
        const group = new THREE.Group();
        const carpetMat = this.materials.get('stairCarpet');
        const railMat = this.materials.get('handrail');
        const wallMat = this.materials.get('wall');

        // Steps ascending into background
        for (let i = 0; i < 8; i++) {
            const stepGeo = new THREE.BoxGeometry(2.4, 0.18, 0.35);
            const step = new THREE.Mesh(stepGeo, carpetMat);
            step.position.set(0, i * 0.18 + 0.09, -i * 0.35);
            group.add(step);
        }

        // Silver Handrails
        [[-1.15, 1], [1.15, -1]].forEach(([rx, s]) => {
            const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.2, 12);
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.rotation.x = Math.PI / 4;
            rail.position.set(rx, 1.2, -1.2);
            group.add(rail);
        });

        // Round Office Clock above entrance
        const clockGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24);
        const clockMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.3 });
        const clock = new THREE.Mesh(clockGeo, clockMat);
        clock.rotation.x = Math.PI / 2;
        clock.position.set(0, 2.7, 0.1);
        group.add(clock);

        const face = new THREE.Mesh(new THREE.CircleGeometry(0.20, 24), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        face.position.set(0, 2.7, 0.125);
        group.add(face);

        return group;
    }

    createWhiteboard(width = 1.4, height = 0.9) {
        const group = new THREE.Group();
        const frameMat = this.materials.get('cubicleTrim');
        const boardMat = this.materials.get('whiteboard');

        const frame = new THREE.Mesh(new THREE.BoxGeometry(width + 0.06, height + 0.06, 0.02), frameMat);
        group.add(frame);

        const board = new THREE.Mesh(new THREE.PlaneGeometry(width, height), boardMat);
        board.position.z = 0.012;
        group.add(board);

        return group;
    }

    createCoffeeCup() {
        const group = new THREE.Group();
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.12, 16), new THREE.MeshStandardMaterial({ color: 0xffeedd, roughness: 0.3 }));
        cup.position.y = 0.06;
        group.add(cup);

        const coffee = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.01, 16), new THREE.MeshStandardMaterial({ color: 0x331a00, roughness: 0.1 }));
        coffee.position.y = 0.11;
        group.add(coffee);
        return group;
    }

    createHandSanitizer() {
        const group = new THREE.Group();
        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12), new THREE.MeshStandardMaterial({ color: 0x66ccff, transparent: true, opacity: 0.85 }));
        bottle.position.y = 0.075;
        group.add(bottle);

        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.08), new THREE.MeshStandardMaterial({ color: 0xffffff }));
        pump.position.set(0, 0.16, 0.02);
        group.add(pump);

        const ring = new THREE.Mesh(new THREE.RingGeometry(0.15, 0.2, 16), new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        group.add(ring);
        return group;
    }

    createMaskPickup() {
        const group = new THREE.Group();
        const mask = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0x3399ff, roughness: 0.7 }));
        mask.position.y = 0.1;
        group.add(mask);

        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshBasicMaterial({ color: 0x33bbff, wireframe: true, transparent: true, opacity: 0.4 }));
        glow.position.y = 0.1;
        group.add(glow);
        return group;
    }

    createStairwellExit(doorWidth = 1.2, doorHeight = 2.3) {
        const group = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(doorWidth + 0.1, doorHeight + 0.05, 0.15), this.materials.get('cubicleTrim'));
        frame.position.y = doorHeight / 2;
        group.add(frame);

        const door = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, doorHeight, 0.06), this.materials.get('stairCarpet'));
        door.position.set(0, doorHeight / 2, 0);
        group.add(door);

        const bar = new THREE.Mesh(new THREE.BoxGeometry(doorWidth * 0.7, 0.06, 0.06), this.materials.get('cubicleTrim'));
        bar.position.set(0, doorHeight * 0.45, 0.05);
        group.add(bar);

        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.08), new THREE.MeshStandardMaterial({ color: 0x00ff44, emissive: 0x00ee33, emissiveIntensity: 0.9 }));
        sign.position.set(0, doorHeight + 0.2, 0.06);
        group.add(sign);

        return group;
    }
}

export const officeProps = new OfficeProps();
