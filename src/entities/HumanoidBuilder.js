import * as THREE from 'three';

/**
 * Next-Gen Humanoid & Cyber Android Model Builder
 * Faithfully matches the AAA game Unreal Engine reference models:
 * 1. Business Casual Human: Light blue dress shirt, dark slacks, dress shoes, styled hair.
 * 2. Cyber Android Cyborg: Polished titanium armor, sleek aerodynamic helmet, glowing cyan Arc Reactor.
 */
export class HumanoidBuilder {
    /**
     * Builds a realistic human character in business casual attire
     */
    static createRealisticHumanMesh(options = {}) {
        const {
            shirtColor = 0xa4c6eb,    // Light blue button-up dress shirt (as in reference image)
            pantsColor = 0x1e232a,    // Charcoal dark dress slacks
            shoesColor = 0x111317,    // Polished black dress shoes
            skinColor = 0xe8be9e,     // Realistic skin tone
            hairColor = 0xb0a89e,     // Styled grey/blonde hair (as in reference image)
            faceTexturePath = null,
            hasBadge = true
        } = options;

        const group = new THREE.Group();

        // Materials
        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.55,
            metalness: 0.05
        });

        const shirtMat = new THREE.MeshStandardMaterial({
            color: shirtColor,
            roughness: 0.75,
            metalness: 0.05
        });

        const collarMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(shirtColor).multiplyScalar(1.08),
            roughness: 0.7
        });

        const pantsMat = new THREE.MeshStandardMaterial({
            color: pantsColor,
            roughness: 0.85,
            metalness: 0.05
        });

        const beltMat = new THREE.MeshStandardMaterial({
            color: 0x221a15,
            roughness: 0.4
        });

        const buckleMat = new THREE.MeshStandardMaterial({
            color: 0xd0d5dd,
            metalness: 0.9,
            roughness: 0.2
        });

        const shoesMat = new THREE.MeshStandardMaterial({
            color: shoesColor,
            roughness: 0.35,
            metalness: 0.2
        });

        const hairMat = new THREE.MeshStandardMaterial({
            color: hairColor,
            roughness: 0.85,
            metalness: 0.05
        });

        // 1. Pelvis / Hips (Root of body)
        const pelvisGeo = new THREE.CylinderGeometry(0.20, 0.18, 0.22, 16);
        const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
        pelvis.position.y = 0.88;
        pelvis.castShadow = true;
        group.add(pelvis);

        // Belt & Buckle
        const beltGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.05, 16);
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.y = 0.98;
        group.add(belt);

        const buckleGeo = new THREE.BoxGeometry(0.06, 0.04, 0.03);
        const buckle = new THREE.Mesh(buckleGeo, buckleMat);
        buckle.position.set(0, 0.98, 0.21);
        group.add(buckle);

        // 2. Torso & Chest (Light Blue Dress Shirt)
        const torsoGroup = new THREE.Group();
        torsoGroup.position.set(0, 0.98, 0);

        // Midsection / Abdomen
        const midGeo = new THREE.CylinderGeometry(0.24, 0.20, 0.30, 16);
        const mid = new THREE.Mesh(midGeo, shirtMat);
        mid.position.y = 0.15;
        mid.castShadow = true;
        torsoGroup.add(mid);

        // Upper Chest / Pectorals (Tapered athletic V-shape)
        const chestGeo = new THREE.CylinderGeometry(0.27, 0.24, 0.32, 16);
        const chest = new THREE.Mesh(chestGeo, shirtMat);
        chest.position.y = 0.42;
        chest.castShadow = true;
        torsoGroup.add(chest);

        // Shirt Button Placket (Center strip with buttons)
        const placketGeo = new THREE.BoxGeometry(0.03, 0.58, 0.02);
        const placket = new THREE.Mesh(placketGeo, collarMat);
        placket.position.set(0, 0.30, 0.25);
        torsoGroup.add(placket);

        // Tiny Buttons
        const buttonMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        for (let y = 0.12; y <= 0.52; y += 0.10) {
            const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8), buttonMat);
            btn.rotation.x = Math.PI / 2;
            btn.position.set(0, y, 0.262);
            torsoGroup.add(btn);
        }

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.09, 0.10, 0.14, 12);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.y = 0.62;
        torsoGroup.add(neck);

        // Shirt Collar (Open business casual collar)
        const collarLeftGeo = new THREE.BoxGeometry(0.08, 0.06, 0.12);
        const collarLeft = new THREE.Mesh(collarLeftGeo, collarMat);
        collarLeft.position.set(-0.09, 0.58, 0.14);
        collarLeft.rotation.set(-0.2, 0.4, -0.3);
        torsoGroup.add(collarLeft);

        const collarRight = new THREE.Mesh(collarLeftGeo, collarMat);
        collarRight.position.set(0.09, 0.58, 0.14);
        collarRight.rotation.set(-0.2, -0.4, 0.3);
        torsoGroup.add(collarRight);

        // FirstBank ID Badge
        if (hasBadge) {
            const badgeLanyard = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.35), new THREE.MeshBasicMaterial({ color: 0x0077c8 }));
            badgeLanyard.position.set(0.08, 0.45, 0.25);
            torsoGroup.add(badgeLanyard);

            const badgeCard = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 0.01), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }));
            badgeCard.position.set(0.08, 0.26, 0.26);
            torsoGroup.add(badgeCard);
        }

        // 3. Head & Hair
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.76, 0);

        // Head Base
        const headGeo = new THREE.SphereGeometry(0.15, 20, 20);
        headGeo.scale(1.0, 1.25, 1.1);

        let headMat = skinMat;
        if (faceTexturePath) {
            const loader = new THREE.TextureLoader();
            const faceTex = loader.load(faceTexturePath);
            headMat = new THREE.MeshStandardMaterial({
                map: faceTex,
                roughness: 0.5,
                metalness: 0.05
            });
        }
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.castShadow = true;
        headGroup.add(headMesh);

        // Nose contour
        const nose = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 8), skinMat);
        nose.rotation.x = Math.PI / 2;
        nose.position.set(0, 0, 0.17);
        headGroup.add(nose);

        // Ears
        const earGeo = new THREE.SphereGeometry(0.035, 8, 8);
        earGeo.scale(0.5, 1.2, 1.0);
        const earL = new THREE.Mesh(earGeo, skinMat);
        earL.position.set(-0.15, 0, 0);
        headGroup.add(earL);
        const earR = new THREE.Mesh(earGeo, skinMat);
        earR.position.set(0.15, 0, 0);
        headGroup.add(earR);

        // Styled Hair Mesh (Matching reference image short styled hair)
        const hairGeo = new THREE.SphereGeometry(0.165, 16, 16);
        hairGeo.scale(1.02, 1.05, 1.08);
        const hairMesh = new THREE.Mesh(hairGeo, hairMat);
        hairMesh.position.set(0, 0.06, -0.02);
        hairMesh.rotation.x = -0.15;
        headGroup.add(hairMesh);

        // Hair Tuft / Bangs
        const tuftGeo = new THREE.DodecahedronGeometry(0.08, 1);
        const tuft = new THREE.Mesh(tuftGeo, hairMat);
        tuft.position.set(0, 0.16, 0.08);
        headGroup.add(tuft);

        torsoGroup.add(headGroup);
        group.add(torsoGroup);

        // 4. Arms (Deltoid -> Upper Arm -> Elbow -> Forearm -> Hand)
        // Left Arm
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.31, 0.50, 0);

        const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), shirtMat);
        leftArmGroup.add(shoulderL);

        const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.28, 12), shirtMat);
        upperArmL.position.y = -0.14;
        upperArmL.castShadow = true;
        leftArmGroup.add(upperArmL);

        const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12), shirtMat);
        forearmL.position.set(0, -0.38, 0.02);
        forearmL.rotation.x = 0.15;
        forearmL.castShadow = true;
        leftArmGroup.add(forearmL);

        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinMat);
        handL.position.set(0, -0.53, 0.05);
        leftArmGroup.add(handL);

        torsoGroup.add(leftArmGroup);

        // Right Arm
        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(0.31, 0.50, 0);

        const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), shirtMat);
        rightArmGroup.add(shoulderR);

        const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.28, 12), shirtMat);
        upperArmR.position.y = -0.14;
        upperArmR.castShadow = true;
        rightArmGroup.add(upperArmR);

        const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12), shirtMat);
        forearmR.position.set(0, -0.38, 0.02);
        forearmR.rotation.x = 0.15;
        forearmR.castShadow = true;
        rightArmGroup.add(forearmR);

        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), skinMat);
        handR.position.set(0, -0.53, 0.05);
        rightArmGroup.add(handR);

        torsoGroup.add(rightArmGroup);

        // 5. Legs & Feet (Thigh -> Knee -> Shin -> Dress Shoes)
        // Left Leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.13, 0.85, 0);

        const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), pantsMat);
        thighL.position.y = -0.21;
        thighL.castShadow = true;
        leftLegGroup.add(thighL);

        const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pantsMat);
        kneeL.position.y = -0.42;
        leftLegGroup.add(kneeL);

        const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), pantsMat);
        shinL.position.y = -0.62;
        shinL.castShadow = true;
        leftLegGroup.add(shinL);

        const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.24), shoesMat);
        shoeL.position.set(0, -0.84, 0.05);
        shoeL.castShadow = true;
        leftLegGroup.add(shoeL);

        group.add(leftLegGroup);

        // Right Leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.13, 0.85, 0);

        const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), pantsMat);
        thighR.position.y = -0.21;
        thighR.castShadow = true;
        rightLegGroup.add(thighR);

        const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pantsMat);
        kneeR.position.y = -0.42;
        rightLegGroup.add(kneeR);

        const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), pantsMat);
        shinR.position.y = -0.62;
        shinR.castShadow = true;
        rightLegGroup.add(shinR);

        const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.24), shoesMat);
        shoeR.position.set(0, -0.84, 0.05);
        shoeR.castShadow = true;
        rightLegGroup.add(shoeR);

        group.add(rightLegGroup);

        return {
            group,
            torsoGroup,
            headGroup,
            headMesh,
            leftArm: leftArmGroup,
            rightArm: rightArmGroup,
            leftLeg: leftLegGroup,
            rightLeg: rightLegGroup
        };
    }

    /**
     * Builds the Cyber Android Cyborg model with glowing Arc Reactor (matching the reference image)
     */
    static createCyberAndroidMesh(options = {}) {
        const {
            armorColor = 0x8a929b,     // Metallic silver/titanium armor
            glowColor = 0x00f0ff,      // Glowing cyan arc reactor
            accentColor = 0x3a424e     // Dark cyber joints
        } = options;

        const group = new THREE.Group();

        // High-end Cyber Materials
        const armorMat = new THREE.MeshStandardMaterial({
            color: armorColor,
            metalness: 0.88,
            roughness: 0.26
        });

        const jointMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            metalness: 0.95,
            roughness: 0.35
        });

        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 2.5,
            roughness: 0.1,
            metalness: 0.1
        });

        const coreRingMat = new THREE.MeshStandardMaterial({
            color: 0x11161d,
            metalness: 0.9,
            roughness: 0.2
        });

        // 1. Pelvis / Cyber Hips
        const pelvisGeo = new THREE.CylinderGeometry(0.20, 0.17, 0.22, 16);
        const pelvis = new THREE.Mesh(pelvisGeo, armorMat);
        pelvis.position.y = 0.88;
        pelvis.castShadow = true;
        group.add(pelvis);

        // 2. Torso & Chest with Glowing Arc Reactor Core
        const torsoGroup = new THREE.Group();
        torsoGroup.position.set(0, 0.98, 0);

        // Abdominal Armor Plates
        const midGeo = new THREE.CylinderGeometry(0.23, 0.19, 0.30, 16);
        const mid = new THREE.Mesh(midGeo, armorMat);
        mid.position.y = 0.15;
        mid.castShadow = true;
        torsoGroup.add(mid);

        // Muscular Chest Plate
        const chestGeo = new THREE.CylinderGeometry(0.28, 0.23, 0.32, 16);
        const chest = new THREE.Mesh(chestGeo, armorMat);
        chest.position.y = 0.42;
        chest.castShadow = true;
        torsoGroup.add(chest);

        // === GLOWING ARC REACTOR CHEST CORE ===
        const reactorGroup = new THREE.Group();
        reactorGroup.position.set(0, 0.44, 0.24);

        // Outer Titanium Bezel Ring
        const ringGeo = new THREE.TorusGeometry(0.065, 0.015, 12, 24);
        const ringMesh = new THREE.Mesh(ringGeo, coreRingMat);
        reactorGroup.add(ringMesh);

        // Inner Glowing Cyan Core Disc
        const coreGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.02, 24);
        const coreMesh = new THREE.Mesh(coreGeo, glowMat);
        coreMesh.rotation.x = Math.PI / 2;
        reactorGroup.add(coreMesh);

        // Center High-Intensity Energy Point
        const pointGeo = new THREE.SphereGeometry(0.025, 12, 12);
        const pointMesh = new THREE.Mesh(pointGeo, glowMat);
        pointMesh.position.z = 0.01;
        reactorGroup.add(pointMesh);

        torsoGroup.add(reactorGroup);

        // Neck Joint
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.14, 12), jointMat);
        neck.position.y = 0.62;
        torsoGroup.add(neck);

        // 3. Sleek Aerodynamic Helmet (Faceless Cyber Mannequin)
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.76, 0);

        const helmetGeo = new THREE.SphereGeometry(0.145, 24, 24);
        helmetGeo.scale(0.95, 1.30, 1.15);
        const helmetMesh = new THREE.Mesh(helmetGeo, armorMat);
        helmetMesh.castShadow = true;
        headGroup.add(helmetMesh);

        // Aerodynamic Chin Contour
        const chinGeo = new THREE.ConeGeometry(0.08, 0.12, 12);
        const chin = new THREE.Mesh(chinGeo, armorMat);
        chin.rotation.x = Math.PI;
        chin.position.set(0, -0.12, 0.06);
        headGroup.add(chin);

        // Subtle Visor Seam
        const visorSeam = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.008, 8, 16, Math.PI), jointMat);
        visorSeam.rotation.y = Math.PI / 2;
        visorSeam.position.set(0, 0.02, 0.06);
        headGroup.add(visorSeam);

        torsoGroup.add(headGroup);
        group.add(torsoGroup);

        // 4. Cyber Arms
        // Left Arm
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.32, 0.50, 0);

        const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), armorMat);
        leftArmGroup.add(shoulderL);

        const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.28, 14), armorMat);
        upperArmL.position.y = -0.14;
        upperArmL.castShadow = true;
        leftArmGroup.add(upperArmL);

        const elbowL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), jointMat);
        elbowL.position.y = -0.28;
        leftArmGroup.add(elbowL);

        const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.048, 0.26, 14), armorMat);
        forearmL.position.set(0, -0.40, 0.02);
        forearmL.rotation.x = 0.15;
        forearmL.castShadow = true;
        leftArmGroup.add(forearmL);

        const handL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), jointMat);
        handL.position.set(0, -0.55, 0.05);
        leftArmGroup.add(handL);

        torsoGroup.add(leftArmGroup);

        // Right Arm
        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(0.32, 0.50, 0);

        const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.095, 16, 16), armorMat);
        rightArmGroup.add(shoulderR);

        const upperArmR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.28, 14), armorMat);
        upperArmR.position.y = -0.14;
        upperArmR.castShadow = true;
        rightArmGroup.add(upperArmR);

        const elbowR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), jointMat);
        elbowR.position.y = -0.28;
        rightArmGroup.add(elbowR);

        const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.048, 0.26, 14), armorMat);
        forearmR.position.set(0, -0.40, 0.02);
        forearmR.rotation.x = 0.15;
        forearmR.castShadow = true;
        rightArmGroup.add(forearmR);

        const handR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), jointMat);
        handR.position.set(0, -0.55, 0.05);
        rightArmGroup.add(handR);

        torsoGroup.add(rightArmGroup);

        // 5. Cyber Legs
        // Left Leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.13, 0.85, 0);

        const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), armorMat);
        thighL.position.y = -0.21;
        thighL.castShadow = true;
        leftLegGroup.add(thighL);

        const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
        kneeL.position.y = -0.42;
        leftLegGroup.add(kneeL);

        const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), armorMat);
        shinL.position.y = -0.62;
        shinL.castShadow = true;
        leftLegGroup.add(shinL);

        const footL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.22), armorMat);
        footL.position.set(0, -0.84, 0.04);
        footL.castShadow = true;
        leftLegGroup.add(footL);

        group.add(leftLegGroup);

        // Right Leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.13, 0.85, 0);

        const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), armorMat);
        thighR.position.y = -0.21;
        thighR.castShadow = true;
        rightLegGroup.add(thighR);

        const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
        kneeR.position.y = -0.42;
        rightLegGroup.add(kneeR);

        const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), armorMat);
        shinR.position.y = -0.62;
        shinR.castShadow = true;
        rightLegGroup.add(shinR);

        const footR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.22), armorMat);
        footR.position.set(0, -0.84, 0.04);
        footR.castShadow = true;
        rightLegGroup.add(footR);

        group.add(rightLegGroup);

        return {
            group,
            torsoGroup,
            headGroup,
            leftArm: leftArmGroup,
            rightArm: rightArmGroup,
            leftLeg: leftLegGroup,
            rightLeg: rightLegGroup,
            reactorMesh: coreMesh
        };
    }
}
