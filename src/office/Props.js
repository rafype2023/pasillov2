import * as THREE from 'three';
import { officeMaterials } from './Materials.js';

export class OfficeProps {
    constructor() {
        this.materials = officeMaterials;
    }

    /**
     * Builds the high-fidelity Central Spine Cubicle Pod (matching cub2/cub3 & reference render)
     * Pale laminate L desk with open knee/chair recess, dual monitors, potted plant, photo frame,
     * Avaya phone, water bottle, ergonomic mesh chair, and 3-drawer pedestal.
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
        const deskGeometry = new THREE.ExtrudeGeometry(outline, { depth: .04, bevelEnabled: false, curveSegments: 12 });
        deskGeometry.rotateX(Math.PI / 2);
        if (isLeft) deskGeometry.scale(-1, 1, 1);
        const mainDesk = new THREE.Mesh(deskGeometry, this.materials.get('deskTop'));
        mainDesk.position.y = deskHeight + .04;
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
        const pad = new THREE.Mesh(padGeo, this.materials.get('monitorPlastic'));
        pad.position.set(0, deskHeight + 0.022, 0.15);
        group.add(pad);

        const kbGeo = new THREE.BoxGeometry(0.44, 0.012, 0.14);
        const kb = new THREE.Mesh(kbGeo, this.materials.get('deskLegs'));
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

    /**
     * Rafael Perez's Lime-Green FirstBank Bottle + Blue Mainline Tumbler + Newton's Cradle (IMG_2245.png)
     */
    createRafaelDeskAccessories() {
        const group = new THREE.Group();
        const greenMat = this.materials.get('fbGreen');
        const darkMat = this.materials.get('deskLegs');
        const chromeMat = this.materials.get('handrail');

        const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.038, 0.24, 14), greenMat);
        bottle.position.y = 0.12;
        group.add(bottle);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.035, 14), darkMat);
        cap.position.y = 0.255;
        group.add(cap);

        // Newton's Cradle desk toy (IMG_2245.png)
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.015, 0.10), darkMat);
        base.position.set(-0.14, 0.008, 0.12);
        group.add(base);

        [-0.035, 0.035].forEach(z => {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.10, 0.008), chromeMat);
            bar.position.set(-0.14, 0.06, 0.12 + z);
            group.add(bar);
        });
        for (let i = -2; i <= 2; i++) {
            const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), chromeMat);
            sphere.position.set(-0.14 + i * 0.022, 0.045, 0.12);
            group.add(sphere);
        }

        return group;
    }

    /**
     * Authentic Birthday Snack Buffet Peninsula from IMG_2843.png, IMG_4361.png & conf.png!
     */
    createSnacksTable() {
        const group = new THREE.Group();
        const deskH = 0.76;
        const woodMat = this.materials.get('deskTop');
        const trimMat = this.materials.get('cubicleTrim');
        const spineMat = this.materials.get('spineCap');
        const darkMat = this.materials.get('monitorPlastic');
        const greenMat = this.materials.get('fbGreen');
        const redMat = this.materials.get('stairCarpet');

        // Curved Bullet Peninsula Countertop (IMG_2843.png)
        const counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.045, 1.1), woodMat);
        counter.position.set(0, deskH, 0);
        counter.castShadow = true;
        counter.receiveShadow = true;
        group.add(counter);

        const roundedEnd = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.045, 16), woodMat);
        roundedEnd.position.set(-1.3, deskH, 0);
        group.add(roundedEnd);

        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, deskH, 12), trimMat);
        leg.position.set(-1.25, deskH / 2, 0);
        group.add(leg);

        const ped = this.createFilingPedestal();
        ped.position.set(1.0, 0, -0.2);
        group.add(ped);

        // Overhead Gray Storage Cabinet with Birthday Balloons (IMG_2843.png)
        const bin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.38, 0.36), spineMat);
        bin.position.set(0.1, 1.48, -0.36);
        group.add(bin);

        // Round Black "Happy Birthday" Foil Balloon + Silver Foil Balloons on top of bin
        const blackBalloon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), darkMat);
        blackBalloon.scale.set(1.0, 0.9, 0.55);
        blackBalloon.position.set(0.25, 1.84, -0.32);
        group.add(blackBalloon);

        [-0.42, -0.12].forEach(bx => {
            const sb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), this.materials.get('handrail'));
            sb.scale.set(1.1, 0.85, 0.6);
            sb.position.set(bx, 1.82, -0.35);
            group.add(sb);
        });

        // Bowls & Snack Bags (Doritos, Tostitos, Ritz, Pita Chips, Nacho Platter)
        const nachoTray = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.04, 16), this.materials.get('woodDoor'));
        nachoTray.position.set(-0.88, deskH + 0.04, 0.16);
        group.add(nachoTray);

        const blackBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.08, 14), darkMat);
        blackBowl.position.set(-0.38, deskH + 0.06, 0.20);
        group.add(blackBowl);

        [
            [-0.75, -0.22, 0.18, 0.24, 0.09, redMat],
            [-0.45, -0.22, 0.16, 0.22, 0.08, redMat],
            [0.25, -0.18, 0.16, 0.22, 0.08, greenMat],
            [0.55, -0.15, 0.18, 0.24, 0.09, redMat],
            [0.82, -0.12, 0.16, 0.22, 0.08, darkMat]
        ].forEach(([sx, sz, sw, sh, sd, smat]) => {
            const bag = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sd), smat);
            bag.position.set(sx, deskH + sh / 2 + 0.02, sz);
            group.add(bag);
        });

        return group;
    }

    /**
     * Builds a row of FirstBank 1130 Data Center Server Racks (matching ply_cam_north.png & IMG_2245.png)
     */
    createDataCenterRackRow(rackCount = 4) {
        const group = new THREE.Group();
        const rackW = 0.72;
        const rackH = 2.15;
        const rackD = 1.02;
        const frontMat = this.materials.get('serverRackFront');
        const bodyMat = this.materials.get('monitorPlastic');
        const frameMat = this.materials.get('handrail');

        for (let i = 0; i < rackCount; i++) {
            const rx = (i - (rackCount - 1) / 2) * (rackW + 0.03);
            const rack = new THREE.Group();

            const body = new THREE.Mesh(new THREE.BoxGeometry(rackW, rackH, rackD), bodyMat);
            body.position.y = rackH / 2;
            body.castShadow = true;
            body.receiveShadow = true;
            rack.add(body);

            // White/silver vertical side rails (signature look in ply_cam_north.png)
            [-rackW / 2 + 0.04, rackW / 2 - 0.04].forEach(px => {
                const pillarF = new THREE.Mesh(new THREE.BoxGeometry(0.08, rackH, 0.04), frameMat);
                pillarF.position.set(px, rackH / 2, rackD / 2 + 0.01);
                rack.add(pillarF);

                const pillarB = new THREE.Mesh(new THREE.BoxGeometry(0.08, rackH, 0.04), frameMat);
                pillarB.position.set(px, rackH / 2, -rackD / 2 - 0.01);
                rack.add(pillarB);
            });

            // Front & Rear Perforated Server Doors with LED telemetry
            const doorF = new THREE.Mesh(new THREE.PlaneGeometry(rackW - 0.12, rackH - 0.08), frontMat);
            doorF.position.set(0, rackH / 2, rackD / 2 + 0.015);
            rack.add(doorF);

            const doorB = new THREE.Mesh(new THREE.PlaneGeometry(rackW - 0.12, rackH - 0.08), frontMat);
            doorB.position.set(0, rackH / 2, -rackD / 2 - 0.015);
            doorB.rotation.y = Math.PI;
            rack.add(doorB);

            rack.position.x = rx;
            group.add(rack);
        }

        // Overhead Cable Runner Tray above rack row
        const totalW = rackCount * (rackW + 0.03);
        const tray = new THREE.Mesh(new THREE.BoxGeometry(totalW, 0.08, 0.35), this.materials.get('cubicleTrim'));
        tray.position.set(0, rackH + 0.22, 0);
        group.add(tray);

        return group;
    }

    /**
     * Industrial Liebert CRAC Air Conditioning Unit (from ply_cam_south.png & ply_cam_east.png)
     */
    createCRACUnit(w = 2.6, h = 2.15, d = 0.90) {
        const group = new THREE.Group();
        const cracMat = this.materials.get('cracUnit');
        const darkMat = this.materials.get('deskLegs');

        const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cracMat);
        body.position.y = h / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const grille = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.55, 0.04), darkMat);
        grille.position.set(0, 0.35, d / 2 + 0.01);
        group.add(grille);

        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.03), this.materials.get('monitorScreen'));
        panel.position.set(-w * 0.22, 1.55, d / 2 + 0.015);
        group.add(panel);

        [-0.12, 0.12].forEach(px => {
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.5, 10), darkMat);
            pipe.position.set(w / 2 + 0.15 + px, 1.75, -0.15);
            group.add(pipe);
        });

        return group;
    }

    /**
     * Gray High-Voltage PDU / UPS Cabinet with Cardboard Box on Floor (ply_cam_east.png!)
     */
    createPDUCabinetWithBox() {
        const group = new THREE.Group();
        const pdu = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.15, 0.85), this.materials.get('filingCabinet'));
        pdu.position.y = 1.075;
        pdu.castShadow = true;
        group.add(pdu);

        const box = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.28, 0.36), this.materials.get('woodDoor'));
        box.position.set(-0.78, 0.14, 0.05);
        box.rotation.y = 0.15;
        group.add(box);

        return group;
    }

    /**
     * 1130 Data Center Double Oak Doors with Glass, Holiday Wreath, Fire Suppression Panel & Rolling Step Stool (ply_cam_west.png!)
     */
    createDataCenterEntranceAssembly() {
        const group = new THREE.Group();
        const woodMat = this.materials.get('woodDoor');
        const glassMat = this.materials.get('glass');
        const trimMat = this.materials.get('cubicleTrim');
        const redMat = this.materials.get('stairCarpet');
        const greenMat = this.materials.get('plantLeaves');

        const header = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 2.3), woodMat);
        header.position.set(0, 2.26, 0);
        group.add(header);

        [-1.05, 1.05].forEach((dz, idx) => {
            const doorPivot = new THREE.Group();
            doorPivot.position.set(0, 0, dz);

            const doorW = 1.02;
            const doorH = 2.20;
            const zDir = idx === 0 ? 1 : -1;

            const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.06, doorH, doorW), woodMat);
            leaf.position.set(0, doorH / 2, zDir * (doorW / 2));
            doorPivot.add(leaf);

            const win = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.35, 0.56), glassMat);
            win.position.set(0, 1.32, zDir * (doorW / 2));
            doorPivot.add(win);

            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.14), trimMat);
            handle.position.set(0, 1.02, zDir * (doorW - 0.12));
            doorPivot.add(handle);

            if (idx === 1) {
                const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 8, 16), greenMat);
                wreath.rotation.y = Math.PI / 2;
                wreath.position.set(0.05, 1.38, zDir * (doorW / 2));
                doorPivot.add(wreath);

                const bow = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), redMat);
                bow.position.set(0.07, 1.54, zDir * (doorW / 2));
                doorPivot.add(bow);
            }

            doorPivot.rotation.y = idx === 0 ? -1.25 : 1.25;
            group.add(doorPivot);
        });

        // Wall-Mounted Fire Alarm Bell, Pull Station & Extinguisher (ply_cam_west.png)
        const bell = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), redMat);
        bell.position.set(0.08, 2.28, 1.55);
        group.add(bell);

        const pullBox = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.14), redMat);
        pullBox.position.set(0.08, 1.38, 1.55);
        group.add(pullBox);

        const ext = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.38, 12), redMat);
        ext.position.set(0.10, 0.85, 1.55);
        group.add(ext);

        // Gray 2-Step Round Rolling Stool ("Kik-Step" on floor next to door in ply_cam_west.png!)
        const stool = new THREE.Group();
        const stoolMat = this.materials.get('spineCap');
        const baseTier = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.22, 0.18, 14), stoolMat);
        baseTier.position.y = 0.09;
        stool.add(baseTier);
        const topTier = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.18, 14), stoolMat);
        topTier.position.y = 0.26;
        stool.add(topTier);
        stool.position.set(0.32, 0, 1.55);
        group.add(stool);

        return group;
    }

    createSlimMonitor() {
        const group = new THREE.Group();
        const plasticMat = this.materials.get('monitorPlastic');
        const screenMat = this.materials.get('monitorScreen');

        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.015, 16), plasticMat);
        base.position.y = 0.008;
        group.add(base);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.26, 0.035), plasticMat);
        arm.position.set(0, 0.14, -0.02);
        group.add(arm);

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

        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.045, 0.10, 16), potMat);
        pot.position.y = 0.05;
        pot.castShadow = true;
        group.add(pot);

        const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), this.materials.get('deskLegs'));
        soil.position.y = 0.098;
        group.add(soil);

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
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.015), this.materials.get('woodDoor'));
        frame.position.y = 0.08;
        frame.rotation.x = -0.15;
        group.add(frame);

        const photo = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.13), this.materials.get('plantPot'));
        photo.position.set(0, 0.08, 0.01);
        photo.rotation.x = -0.15;
        group.add(photo);

        return group;
    }

    createFilingPedestal() {
        const group = new THREE.Group();
        const mat = this.materials.get('filingCabinet');
        const handleMat = this.materials.get('cubicleTrim');

        const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.62, 0.55), mat);
        body.position.y = 0.31;
        body.castShadow = true;
        group.add(body);

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

        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.30), metalMat);
            leg.rotation.z = Math.PI / 2;
            leg.rotation.y = angle;
            leg.position.set(Math.cos(angle) * 0.15, 0.06, Math.sin(angle) * 0.15);
            group.add(leg);

            const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), metalMat);
            wheel.position.set(Math.cos(angle) * 0.30, 0.025, Math.sin(angle) * 0.30);
            group.add(wheel);
        }

        const cylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.32, 12), chromeMat);
        cylinder.position.y = 0.22;
        group.add(cylinder);

        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.48), meshMat);
        seat.position.y = 0.44;
        seat.castShadow = true;
        group.add(seat);

        const backGeo = new THREE.BoxGeometry(0.44, 0.52, 0.04);
        const back = new THREE.Mesh(backGeo, meshMat);
        back.position.set(0, 0.72, -0.22);
        back.rotation.x = -0.06;
        back.castShadow = true;
        group.add(back);

        const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.03), metalMat);
        spine.position.set(0, 0.65, -0.25);
        group.add(spine);

        [[-0.26, 1], [0.26, -1]].forEach(([ax]) => {
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
            this.materials.get('fbGreen')
        );
        bottle.position.y = 0.11;
        group.add(bottle);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.035, 16), this.materials.get('plantPot'));
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

    createCommandCenter(width = 8.5, depth = 6.2) {
        const group = new THREE.Group();
        const trimMat = this.materials.get('cubicleTrim');

        const tableGeo = new THREE.BoxGeometry(4.6, 0.08, 1.8);
        const table = new THREE.Mesh(tableGeo, this.materials.get('confTableWood'));
        table.position.set(0, 0.76, 0);
        table.castShadow = true;
        group.add(table);

        const col1 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.72, 16), trimMat);
        col1.position.set(-1.4, 0.36, 0);
        group.add(col1);
        const col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.72, 16), trimMat);
        col2.position.set(1.4, 0.36, 0);
        group.add(col2);

        const srvWallGeo = new THREE.BoxGeometry(4.8, 2.2, 0.08);
        const srvWall = new THREE.Mesh(srvWallGeo, this.materials.get('serverWall'));
        srvWall.position.set(0, 1.85, depth / 2 - 0.05);
        group.add(srvWall);

        return group;
    }

    createBackgroundStaircase() {
        const group = new THREE.Group();
        const carpetMat = this.materials.get('stairCarpet');
        const railMat = this.materials.get('handrail');

        for (let i = 0; i < 8; i++) {
            const stepGeo = new THREE.BoxGeometry(2.4, 0.18, 0.35);
            const step = new THREE.Mesh(stepGeo, carpetMat);
            step.position.set(0, i * 0.18 + 0.09, -i * 0.35);
            group.add(step);
        }

        [[-1.15, 1], [1.15, -1]].forEach(([rx]) => {
            const railGeo = new THREE.CylinderGeometry(0.025, 0.025, 3.2, 12);
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.rotation.x = Math.PI / 4;
            rail.position.set(rx, 1.2, -1.2);
            group.add(rail);
        });

        const clockGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 24);
        const clock = new THREE.Mesh(clockGeo, this.materials.get('monitorPlastic'));
        clock.rotation.x = Math.PI / 2;
        clock.position.set(0, 2.7, 0.1);
        group.add(clock);

        const face = new THREE.Mesh(new THREE.CircleGeometry(0.20, 24), this.materials.get('plantPot'));
        face.position.set(0, 2.7, 0.125);
        group.add(face);

        return group;
    }

    createWhiteboard(width = 1.4, height = 0.9, variant = 'whiteboard') {
        const group = new THREE.Group();
        const frameMat = this.materials.get('cubicleTrim');
        const boardMat = this.materials.get(variant) || this.materials.get('whiteboard');

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

        const sign = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.08), this.materials.get('exitSignRed'));
        sign.position.set(0, doorHeight + 0.2, 0.06);
        group.add(sign);

        return group;
    }

    /**
     * Long Green-Tablecloth Buffet Table along the East Window Gallery (splat_aligned_full.png & splat_cam_lounge_south.png)
     */
    createGreenBuffetTable(length = 4.2, width = 0.95) {
        const group = new THREE.Group();
        const clothMat = this.materials.get('greenTablecloth');
        const chromeMat = this.materials.get('handrail');
        const whiteMat = this.materials.get('plantPot');
        const redMat = this.materials.get('stairCarpet');
        const woodMat = this.materials.get('woodDoor');
        const h = 0.78;

        // Draped green tablecloth table body
        const top = new THREE.Mesh(new THREE.BoxGeometry(width, h, length), clothMat);
        top.position.y = h / 2;
        top.castShadow = true;
        top.receiveShadow = true;
        group.add(top);

        // Chafing dishes, trays, bowls, and snack platters along the table
        [-1.35, -0.45, 0.45].forEach(zPos => {
            const tray = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.12, 0.62), chromeMat);
            tray.position.set(0, h + 0.06, zPos);
            group.add(tray);
        });

        const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.05, 16), woodMat);
        platter.position.set(0.05, h + 0.03, 1.25);
        group.add(platter);

        [-1.75, 1.65].forEach(zPos => {
            const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 14), whiteMat);
            stack.position.set(-0.15, h + 0.06, zPos);
            group.add(stack);

            const soda = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.28, 12), redMat);
            soda.position.set(0.18, h + 0.14, zPos);
            group.add(soda);
        });

        return group;
    }

    /**
     * Cluster of Red Heart & Party Foil Balloons inside Guillo's North-West Cubicle (splat_aligned_full.png & splat_cam_west_corridor_south.png)
     */
    createCubicleRedBalloons() {
        const group = new THREE.Group();
        const redMat = this.materials.get('redBalloon');
        const stringMat = this.materials.get('cubicleTrim');

        const offsets = [
            [0, 1.95, 0, 0.22],
            [-0.22, 2.12, 0.14, 0.20],
            [0.20, 2.05, -0.12, 0.19],
            [-0.08, 1.78, -0.18, 0.17],
            [0.14, 2.24, 0.10, 0.21]
        ];

        offsets.forEach(([bx, by, bz, r]) => {
            const balloon = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 12), redMat);
            balloon.scale.set(1.1, 1.05, 0.65);
            balloon.position.set(bx, by, bz);
            group.add(balloon);

            const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, by - 0.85, 6), stringMat);
            cord.position.set(bx * 0.5, 0.85 + (by - 0.85) / 2, bz * 0.5);
            group.add(cord);
        });

        return group;
    }

    /**
     * Circular Red "FELIZ CUMPLEAÑOS" & Blue "NUESTROS VALORES" Badges on the Lounge End-Wall (splat_cam_lounge_north.png)
     */
    createLoungeEndWallBadges() {
        const group = new THREE.Group();
        const cumpDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 24), this.materials.get('cumpleanosBadge'));
        cumpDisk.rotation.z = Math.PI / 2;
        cumpDisk.position.set(0, 1.85, 0);
        group.add(cumpDisk);

        const valDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 24), this.materials.get('valoresBadge'));
        valDisk.rotation.z = Math.PI / 2;
        valDisk.position.set(0, 0.82, 0.15);
        group.add(valDisk);

        return group;
    }
}

export const officeProps = new OfficeProps();
