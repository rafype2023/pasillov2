import * as THREE from 'three';
import { createDetailedHuman } from './RealisticHuman.js';

/**
 * Next-Gen High-Fidelity Humanoid & Cyber Android Model Builder
 * Faithfully matches the Unreal Engine reference models & poses:
 * 1. Business Casual Human: Light blue button-up dress shirt, dark charcoal slacks, dress shoes, wavy styled grey/blonde hair.
 * 2. Cyber Android Cyborg: Polished titanium armor, sleek aerodynamic helmet, glowing cyan Arc Reactor.
 * 
 * Supports full 3D animation poses:
 * - RUN: High-knee athletic sprint with 90° arm drives
 * - JUMP: Airborne leap with tucked knees and balanced wide arms
 * - IDLE: Confident standing A-pose with subtle breathing cycle
 * - CROUCH: Low-profile stealth stance
 */
export class HumanoidBuilder {
    /**
     * Builds a realistic human character in business casual attire
     */
    static createRealisticHumanMesh(options = {}) {
        const detailed = createDetailedHuman(options);
        if (detailed) return detailed;
        const {
            shirtColor = 0xa4c6eb,    // Light blue button-up dress shirt (as in reference image)
            pantsColor = 0x1e232a,    // Charcoal dark dress slacks
            shoesColor = 0x111317,    // Polished black dress shoes
            skinColor = 0xe8be9e,     // Realistic skin tone
            hairColor = 0xb5ada5,     // Styled grey/blonde hair (as in reference image)
            faceTexturePath = null,
            hasBadge = true
        } = options;

        const group = new THREE.Group();

        // High-end PBR Materials
        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.55,
            metalness: 0.05
        });

        const shirtMat = new THREE.MeshStandardMaterial({
            color: shirtColor,
            roughness: 0.72,
            metalness: 0.04
        });

        const collarMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(shirtColor).multiplyScalar(1.08),
            roughness: 0.68
        });

        const pantsMat = new THREE.MeshStandardMaterial({
            color: pantsColor,
            roughness: 0.85,
            metalness: 0.05
        });

        const beltMat = new THREE.MeshStandardMaterial({
            color: 0x241c18,
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
            metalness: 0.25
        });

        const hairMat = new THREE.MeshStandardMaterial({
            color: hairColor,
            roughness: 0.88,
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
        const placketGeo = new THREE.BoxGeometry(0.035, 0.58, 0.02);
        const placket = new THREE.Mesh(placketGeo, collarMat);
        placket.position.set(0, 0.30, 0.25);
        torsoGroup.add(placket);

        // Tiny Pearl Buttons
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

        // Shirt Collar (Open business casual collar matching reference)
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

        // 3. Head & Layered Hair
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

        // Multi-Layer Styled Wavy Hair Mesh (Matching reference image)
        const hairBaseGeo = new THREE.SphereGeometry(0.165, 16, 16);
        hairBaseGeo.scale(1.03, 1.08, 1.10);
        const hairBase = new THREE.Mesh(hairBaseGeo, hairMat);
        hairBase.position.set(0, 0.06, -0.02);
        hairBase.rotation.x = -0.15;
        headGroup.add(hairBase);

        // Hair Crown Tuft & Waves
        const tuftGeo1 = new THREE.DodecahedronGeometry(0.085, 1);
        const tuft1 = new THREE.Mesh(tuftGeo1, hairMat);
        tuft1.position.set(0, 0.17, 0.06);
        headGroup.add(tuft1);

        const tuftGeo2 = new THREE.DodecahedronGeometry(0.065, 1);
        const tuft2 = new THREE.Mesh(tuftGeo2, hairMat);
        tuft2.position.set(-0.06, 0.15, 0.04);
        headGroup.add(tuft2);

        const tuft3 = new THREE.Mesh(tuftGeo2, hairMat);
        tuft3.position.set(0.06, 0.15, 0.04);
        headGroup.add(tuft3);

        torsoGroup.add(headGroup);
        group.add(torsoGroup);

        // 4. Arms (Deltoid -> Upper Arm -> Forearm -> Hand)
        // Left Arm
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.31, 0.50, 0);

        const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), shirtMat);
        leftArmGroup.add(shoulderL);

        const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.28, 12), shirtMat);
        upperArmL.position.y = -0.14;
        upperArmL.castShadow = true;
        leftArmGroup.add(upperArmL);

        const forearmLGroup = new THREE.Group();
        forearmLGroup.position.set(0, -0.28, 0);

        const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.26, 12), shirtMat);
        forearmL.position.set(0, -0.12, 0.02);
        forearmL.castShadow = true;
        forearmLGroup.add(forearmL);

        const handL = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), skinMat);
        handL.position.set(0, -0.26, 0.04);
        forearmLGroup.add(handL);

        leftArmGroup.add(forearmLGroup);
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

        const forearmRGroup = new THREE.Group();
        forearmRGroup.position.set(0, -0.28, 0);

        const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.26, 12), shirtMat);
        forearmR.position.set(0, -0.12, 0.02);
        forearmR.castShadow = true;
        forearmRGroup.add(forearmR);

        const handR = new THREE.Mesh(new THREE.SphereGeometry(0.048, 10, 10), skinMat);
        handR.position.set(0, -0.26, 0.04);
        forearmRGroup.add(handR);

        rightArmGroup.add(forearmRGroup);
        torsoGroup.add(rightArmGroup);

        // 5. Legs & Feet (Thigh -> Knee -> Shin -> Shoes)
        // Left Leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.13, 0.85, 0);

        const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), pantsMat);
        thighL.position.y = -0.21;
        thighL.castShadow = true;
        leftLegGroup.add(thighL);

        const calfLGroup = new THREE.Group();
        calfLGroup.position.set(0, -0.42, 0);

        const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pantsMat);
        calfLGroup.add(kneeL);

        const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), pantsMat);
        shinL.position.y = -0.20;
        shinL.castShadow = true;
        calfLGroup.add(shinL);

        const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.24), shoesMat);
        shoeL.position.set(0, -0.42, 0.05);
        shoeL.castShadow = true;
        calfLGroup.add(shoeL);

        leftLegGroup.add(calfLGroup);
        group.add(leftLegGroup);

        // Right Leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.13, 0.85, 0);

        const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), pantsMat);
        thighR.position.y = -0.21;
        thighR.castShadow = true;
        rightLegGroup.add(thighR);

        const calfRGroup = new THREE.Group();
        calfRGroup.position.set(0, -0.42, 0);

        const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), pantsMat);
        calfRGroup.add(kneeR);

        const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), pantsMat);
        shinR.position.y = -0.20;
        shinR.castShadow = true;
        calfRGroup.add(shinR);

        const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.24), shoesMat);
        shoeR.position.set(0, -0.42, 0.05);
        shoeR.castShadow = true;
        calfRGroup.add(shoeR);

        rightLegGroup.add(calfRGroup);
        group.add(rightLegGroup);

        return {
            group,
            torsoGroup,
            headGroup,
            headMesh,
            leftArm: leftArmGroup,
            rightArm: rightArmGroup,
            leftForearm: forearmLGroup,
            rightForearm: forearmRGroup,
            leftLeg: leftLegGroup,
            rightLeg: rightLegGroup,
            leftCalf: calfLGroup,
            rightCalf: calfRGroup,
            type: 'human'
        };
    }

    /**
     * Builds the Cyber Android Cyborg model with glowing Arc Reactor (matching the reference image)
     */
    static createCyberAndroidMesh(options = {}) {
        const {
            armorColor = 0x8a929b,     // Metallic silver/titanium armor
            glowColor = 0x00f0ff,      // Glowing cyan arc reactor
            accentColor = 0x323a46     // Dark cyber joints
        } = options;

        const group = new THREE.Group();

        // High-end Cyber PBR Materials
        const armorMat = new THREE.MeshStandardMaterial({
            color: armorColor,
            metalness: 0.90,
            roughness: 0.22
        });

        const jointMat = new THREE.MeshStandardMaterial({
            color: accentColor,
            metalness: 0.95,
            roughness: 0.35
        });

        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 3.0,
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

        // Visor Seam Contour
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

        const forearmLGroup = new THREE.Group();
        forearmLGroup.position.set(0, -0.28, 0);

        const elbowL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), jointMat);
        forearmLGroup.add(elbowL);

        const forearmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.048, 0.26, 14), armorMat);
        forearmL.position.set(0, -0.12, 0.02);
        forearmL.castShadow = true;
        forearmLGroup.add(forearmL);

        const handL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), jointMat);
        handL.position.set(0, -0.27, 0.04);
        forearmLGroup.add(handL);

        leftArmGroup.add(forearmLGroup);
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

        const forearmRGroup = new THREE.Group();
        forearmRGroup.position.set(0, -0.28, 0);

        const elbowR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), jointMat);
        forearmRGroup.add(elbowR);

        const forearmR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.048, 0.26, 14), armorMat);
        forearmR.position.set(0, -0.12, 0.02);
        forearmR.castShadow = true;
        forearmRGroup.add(forearmR);

        const handR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.09, 0.04), jointMat);
        handR.position.set(0, -0.27, 0.04);
        forearmRGroup.add(handR);

        rightArmGroup.add(forearmRGroup);
        torsoGroup.add(rightArmGroup);

        // 5. Cyber Legs
        // Left Leg
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.13, 0.85, 0);

        const thighL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), armorMat);
        thighL.position.y = -0.21;
        thighL.castShadow = true;
        leftLegGroup.add(thighL);

        const calfLGroup = new THREE.Group();
        calfLGroup.position.set(0, -0.42, 0);

        const kneeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
        calfLGroup.add(kneeL);

        const shinL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), armorMat);
        shinL.position.y = -0.20;
        shinL.castShadow = true;
        calfLGroup.add(shinL);

        const footL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.22), armorMat);
        footL.position.set(0, -0.42, 0.04);
        footL.castShadow = true;
        calfLGroup.add(footL);

        leftLegGroup.add(calfLGroup);
        group.add(leftLegGroup);

        // Right Leg
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.13, 0.85, 0);

        const thighR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.08, 0.42, 14), armorMat);
        thighR.position.y = -0.21;
        thighR.castShadow = true;
        rightLegGroup.add(thighR);

        const calfRGroup = new THREE.Group();
        calfRGroup.position.set(0, -0.42, 0);

        const kneeR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), jointMat);
        calfRGroup.add(kneeR);

        const shinR = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.40, 14), armorMat);
        shinR.position.y = -0.20;
        shinR.castShadow = true;
        calfRGroup.add(shinR);

        const footR = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.08, 0.22), armorMat);
        footR.position.set(0, -0.42, 0.04);
        footR.castShadow = true;
        calfRGroup.add(footR);

        rightLegGroup.add(calfRGroup);
        group.add(rightLegGroup);

        return {
            group,
            torsoGroup,
            headGroup,
            leftArm: leftArmGroup,
            rightArm: rightArmGroup,
            leftForearm: forearmLGroup,
            rightForearm: forearmRGroup,
            leftLeg: leftLegGroup,
            rightLeg: rightLegGroup,
            leftCalf: calfLGroup,
            rightCalf: calfRGroup,
            reactorMesh: coreMesh,
            type: 'cyber'
        };
    }

    /**
     * Applies full-body kinematic animation poses matching the reference image
     * @param {Object} model - The humanoid parts object
     * @param {string} state - 'idle', 'run', 'jump', 'crouch'
     * @param {number} time - Animation time in seconds
     * @param {number} speed - Current velocity speed
     */
    static applyPose(model, state, time, speed = 4.0) {
        if (!model) return;
        if (model.detailed) {
            model.update(state, time, speed);
            return;
        }
        const parts = ['torsoGroup', 'headGroup', 'leftArm', 'rightArm', 'leftForearm', 'rightForearm', 'leftLeg', 'rightLeg', 'leftCalf', 'rightCalf'];
        const previous = parts.map(key => model[key]?.quaternion.clone());
        const oldHeight = model.torsoGroup?.position.y ?? 0.98;
        const dt = model.poseTime === undefined ? 1 / 60 : Math.max(0, Math.min(0.1, time - model.poseTime));
        model.poseTime = time;
        model.gaitPhase = (model.gaitPhase || 0) + dt * (state === 'run' ? 7 + speed * 0.9 : 2);
        this.setPose(model, state, time, speed);
        const blend = 1 - Math.exp(-14 * dt);
        parts.forEach((key, i) => {
            if (model[key] && previous[i]) model[key].quaternion.slerpQuaternions(previous[i], model[key].quaternion.clone(), blend);
        });
        if (model.torsoGroup) {
            const height = state === 'crouch' ? 0.73 : 0.98 + (state === 'run' ? Math.abs(Math.sin(model.gaitPhase)) * 0.035 : Math.sin(time * 2.2) * 0.005);
            model.torsoGroup.position.y = THREE.MathUtils.lerp(oldHeight, height, blend);
        }
    }

    static setPose(model, state, time, speed = 4.0) {
        if (!model) return;

        const {
            torsoGroup,
            headGroup,
            leftArm,
            rightArm,
            leftForearm,
            rightForearm,
            leftLeg,
            rightLeg,
            leftCalf,
            rightCalf,
            reactorMesh
        } = model;

        // Arc reactor pulsing glow (for cyber android)
        if (reactorMesh && reactorMesh.material) {
            const pulse = 2.4 + Math.sin(time * 6.0) * 0.8;
            reactorMesh.material.emissiveIntensity = pulse;
        }

        if (state === 'jump') {
            // === JUMPING POSE (Matches reference image jump position) ===
            // Torso arched upright / slightly tilted back
            if (torsoGroup) {
                torsoGroup.rotation.x = -0.08;
                torsoGroup.rotation.z = 0;
            }
            if (headGroup) {
                headGroup.rotation.x = -0.1;
            }

            // Arms: Raised outwards & forward at 45 degrees, forearms bent forward
            if (leftArm) {
                leftArm.rotation.set(-0.55, 0, 0.85);
            }
            if (rightArm) {
                rightArm.rotation.set(-0.55, 0, -0.85);
            }
            if (leftForearm) {
                leftForearm.rotation.x = -0.75;
            }
            if (rightForearm) {
                rightForearm.rotation.x = -0.75;
            }

            // Legs: Knees tucked and flared outwards, calves bent backwards
            if (leftLeg) {
                leftLeg.rotation.set(0.65, 0, -0.32);
            }
            if (rightLeg) {
                rightLeg.rotation.set(0.65, 0, 0.32);
            }
            if (leftCalf) {
                leftCalf.rotation.x = 1.15;
            }
            if (rightCalf) {
                rightCalf.rotation.x = 1.15;
            }

        } else if (state === 'run') {
            // === RUNNING SPRINT POSE (Matches reference image sprint position) ===
            const sprintFactor = Math.min(1.25, Math.max(0.55, speed / 6.0));
            const cycle = model.gaitPhase || 0;
            const legSwing = Math.sin(cycle) * 0.85 * sprintFactor;
            const armSwing = -legSwing;

            // Torso forward lean
            if (torsoGroup) {
                torsoGroup.rotation.x = 0.22 * sprintFactor;
                torsoGroup.rotation.y = Math.sin(cycle) * 0.12;
                torsoGroup.rotation.z = Math.cos(cycle) * 0.05;
            }
            if (headGroup) {
                headGroup.rotation.x = -0.12 * sprintFactor;
            }

            // Arms: Alternating forward/backward swing with 90° bent elbows
            if (leftArm) {
                leftArm.rotation.set(armSwing * 0.95, 0, 0.15);
            }
            if (rightArm) {
                rightArm.rotation.set(-armSwing * 0.95, 0, -0.15);
            }
            if (leftForearm) {
                leftForearm.rotation.x = -0.85 + Math.sin(cycle) * 0.3;
            }
            if (rightForearm) {
                rightForearm.rotation.x = -0.85 - Math.sin(cycle) * 0.3;
            }

            // Legs: High knee drive on forward leg, trailing calf flexion
            if (leftLeg) {
                leftLeg.rotation.set(legSwing, 0, 0.05);
            }
            if (rightLeg) {
                rightLeg.rotation.set(-legSwing, 0, -0.05);
            }
            if (leftCalf) {
                // Calves bend more on backward swing (trailing leg)
                leftCalf.rotation.x = Math.max(0, -legSwing * 1.3);
            }
            if (rightCalf) {
                rightCalf.rotation.x = Math.max(0, legSwing * 1.3);
            }

        } else if (state === 'crouch') {
            // === CROUCH STEALTH POSE ===
            if (torsoGroup) {
                torsoGroup.rotation.set(0.45, 0, 0);
            }
            if (headGroup) {
                headGroup.rotation.set(-0.35, 0, 0);
            }
            if (leftArm) {
                leftArm.rotation.set(-0.3, 0, 0.3);
            }
            if (rightArm) {
                rightArm.rotation.set(-0.3, 0, -0.3);
            }
            if (leftForearm) leftForearm.rotation.x = -0.6;
            if (rightForearm) rightForearm.rotation.x = -0.6;

            if (leftLeg) leftLeg.rotation.set(0.9, 0, -0.1);
            if (rightLeg) rightLeg.rotation.set(0.9, 0, 0.1);
            if (leftCalf) leftCalf.rotation.x = 1.3;
            if (rightCalf) rightCalf.rotation.x = 1.3;

        } else {
            // === IDLE / STANDING A-POSE (Matches reference image standing stance) ===
            const breathe = Math.sin(time * 2.2) * 0.02;

            if (torsoGroup) {
                torsoGroup.rotation.set(breathe * 0.5, 0, 0);
                torsoGroup.position.y = 0.98 + breathe * 0.2;
            }
            if (headGroup) {
                headGroup.rotation.set(-breathe * 0.3, 0, 0);
            }

            // Natural relaxed arms resting at 18-22° angle
            if (leftArm) {
                leftArm.rotation.set(0.04, 0, 0.28 + breathe);
            }
            if (rightArm) {
                rightArm.rotation.set(0.04, 0, -0.28 - breathe);
            }
            if (leftForearm) {
                leftForearm.rotation.x = -0.12;
            }
            if (rightForearm) {
                rightForearm.rotation.x = -0.12;
            }

            // Straight natural legs with slight stance width
            if (leftLeg) {
                leftLeg.rotation.set(0, 0, 0.04);
            }
            if (rightLeg) {
                rightLeg.rotation.set(0, 0, -0.04);
            }
            if (leftCalf) {
                leftCalf.rotation.x = 0;
            }
            if (rightCalf) {
                rightCalf.rotation.x = 0;
            }
        }
    }
}
