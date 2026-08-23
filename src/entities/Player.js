import * as THREE from 'three';
import { sounds } from '../audio/SoundEffects.js';
import { HumanoidBuilder } from './HumanoidBuilder.js';

export class Player {
    constructor(scene, camera, domElement) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;

        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.facingAngle = 0;

        // Stats
        this.health = 100;
        this.infection = 0;       // Level 1: 0 to 100%
        this.stamina = 100;        // Level 2: 0 to 100%
        this.maxStamina = 100;
        this.isSprinting = false;
        this.isCrouching = false;
        this.isMasked = false;
        this.maskTimer = 0;
        this.boostTimer = 0;
        this.carryingCount = 0;
        this.maxCarrying = 8;
        this.isDead = false;

        // Free 3D Orbit Camera (Mouse Drag / WASD)
        this.cameraMode = 'isometric'; // 'isometric', 'third', 'first'
        this.isoDistance = 14.5;
        this.isoPitch = Math.PI / 3.4; // ~53 degrees tilt
        this.isoYaw = 0; // Rotates 360 deg via Mouse Drag or Q/E
        this.zoomLevel = 1.0;
        this.isDraggingMouse = false;
        this.previousMouseX = 0;
        this.previousMouseY = 0;

        // Physics bounds
        this.radius = 0.35;
        this.height = 1.75;
        this.crouchHeight = 1.05;

        // Controls input
        this.keys = {};
        this.touchMovement = { x: 0, y: 0 };
        this.touchSprint = false;
        this.touchCrouch = false;
        this.footstepTimer = 0;

        this.initMesh();
        this.initControls();
        this.initMobileTouchControls();
    }

    initMesh() {
        // Build Realistic Human Model matching reference image (Light blue dress shirt & dark slacks)
        const human = HumanoidBuilder.createRealisticHumanMesh({
            shirtColor: 0xa4c6eb, // Light blue dress shirt as in reference
            pantsColor: 0x1e232a, // Charcoal dark slacks
            shoesColor: 0x111317, // Black dress shoes
            hairColor: 0xb5ada5,  // Styled hair as in reference
            faceTexturePath: '/assets/guillo_face.png',
            hasBadge: true
        });

        this.mesh = human.group;
        this.torsoGroup = human.torsoGroup;
        this.headGroup = human.headGroup;
        this.headMesh = human.headMesh;
        this.leftArm = human.leftArm;
        this.rightArm = human.rightArm;
        this.leftLeg = human.leftLeg;
        this.rightLeg = human.rightLeg;

        // Glasses rim
        const glassGeo = new THREE.BoxGeometry(0.24, 0.06, 0.03);
        const glassMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const glasses = new THREE.Mesh(glassGeo, glassMat);
        glasses.position.set(0, 0, 0.16);
        this.headGroup.add(glasses);

        // N95 Mask (Toggled on when collected)
        const maskGeo = new THREE.ConeGeometry(0.12, 0.14, 16);
        const maskMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
        this.maskMesh = new THREE.Mesh(maskGeo, maskMat);
        this.maskMesh.rotation.x = Math.PI / 2;
        this.maskMesh.position.set(0, -0.04, 0.15);
        this.maskMesh.visible = false;
        this.headGroup.add(this.maskMesh);

        // Carrying Item Holder in front of character (e.g. coffee, masks, sanitizer stack)
        this.itemHolder = new THREE.Group();
        this.itemHolder.position.set(0, 1.0, 0.3);
        this.mesh.add(this.itemHolder);

        this.scene.add(this.mesh);
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyV') {
                this.toggleCameraMode();
            }
            if (e.code === 'KeyQ') {
                this.isoYaw += Math.PI / 4;
            }
            if (e.code === 'KeyE') {
                this.isoYaw -= Math.PI / 4;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // 3D Mouse Drag Orbit (Left Mouse Button Drag)
        window.addEventListener('pointerdown', (e) => {
            // Only drag on canvas / game area (button 0 = left click)
            if (e.button === 0 && e.target && (e.target.tagName === 'CANVAS' || e.target.id === 'game-container')) {
                this.isDraggingMouse = true;
                this.previousMouseX = e.clientX;
                this.previousMouseY = e.clientY;
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!this.isDraggingMouse) return;

            const deltaX = e.clientX - this.previousMouseX;
            const deltaY = e.clientY - this.previousMouseY;

            // Horizontal Orbit (Yaw 360 degrees)
            this.isoYaw -= deltaX * 0.007;

            // Vertical Tilt (Pitch between 10 degrees and 85 degrees)
            this.isoPitch = Math.max(0.18, Math.min(Math.PI / 2.1, this.isoPitch - deltaY * 0.005));

            this.previousMouseX = e.clientX;
            this.previousMouseY = e.clientY;
        });

        window.addEventListener('pointerup', () => {
            this.isDraggingMouse = false;
        });

        window.addEventListener('pointercancel', () => {
            this.isDraggingMouse = false;
        });

        // Mouse Wheel Zoom
        window.addEventListener('wheel', (e) => {
            this.zoomLevel = Math.max(0.45, Math.min(2.2, this.zoomLevel + e.deltaY * 0.001));
        }, { passive: true });
    }

    initMobileTouchControls() {
        // Virtual Joystick Container
        const joyZone = document.getElementById('touch-joystick-zone');
        const joyThumb = document.getElementById('touch-joystick-thumb');
        const btnSprint = document.getElementById('touch-btn-sprint');
        const btnCrouch = document.getElementById('touch-btn-crouch');
        const btnCam = document.getElementById('touch-btn-cam');

        if (joyZone && joyThumb) {
            let joyActive = false;
            let startX = 0;
            let startY = 0;
            const maxRadius = 45;

            const handleJoyStart = (e) => {
                const touch = e.touches ? e.touches[0] : e;
                const rect = joyZone.getBoundingClientRect();
                startX = rect.left + rect.width / 2;
                startY = rect.top + rect.height / 2;
                joyActive = true;
            };

            const handleJoyMove = (e) => {
                if (!joyActive) return;
                const touch = e.touches ? e.touches[0] : e;
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const clampedDist = Math.min(dist, maxRadius);
                const angle = Math.atan2(dy, dx);

                const thumbX = Math.cos(angle) * clampedDist;
                const thumbY = Math.sin(angle) * clampedDist;
                joyThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;

                this.touchMovement.x = thumbX / maxRadius;
                this.touchMovement.y = thumbY / maxRadius;
            };

            const handleJoyEnd = () => {
                joyActive = false;
                joyThumb.style.transform = `translate(0px, 0px)`;
                this.touchMovement.x = 0;
                this.touchMovement.y = 0;
            };

            joyZone.addEventListener('touchstart', handleJoyStart, { passive: true });
            window.addEventListener('touchmove', handleJoyMove, { passive: true });
            window.addEventListener('touchend', handleJoyEnd);
            window.addEventListener('touchcancel', handleJoyEnd);
        }

        btnSprint?.addEventListener('touchstart', () => { this.touchSprint = true; }, { passive: true });
        btnSprint?.addEventListener('touchend', () => { this.touchSprint = false; });

        btnCrouch?.addEventListener('touchstart', () => { this.touchCrouch = !this.touchCrouch; }, { passive: true });
        btnCam?.addEventListener('touchstart', () => { this.toggleCameraMode(); }, { passive: true });
    }

    pollGamepad(delta) {
        if (!navigator.getGamepads) return { x: 0, z: 0, sprint: false, crouch: false };
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp && gp.connected) {
                // Left stick movement
                const lx = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
                const lz = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;

                // Right stick camera orbit
                if (Math.abs(gp.axes[2]) > 0.2) {
                    this.isoYaw -= gp.axes[2] * delta * 3.0;
                }
                if (Math.abs(gp.axes[3]) > 0.2) {
                    this.isoPitch = Math.max(0.18, Math.min(Math.PI / 2.1, this.isoPitch - gp.axes[3] * delta * 2.0));
                }

                // Buttons: A (0) = Sprint, B (1) = Crouch, Y (3) = Cam
                const btnSprint = gp.buttons[0]?.pressed || gp.buttons[7]?.pressed; // A or RT
                const btnCrouch = gp.buttons[1]?.pressed || gp.buttons[6]?.pressed; // B or LT

                return { x: lx, z: lz, sprint: btnSprint, crouch: btnCrouch };
            }
        }
        return { x: 0, z: 0, sprint: false, crouch: false };
    }

    toggleCameraMode() {
        if (this.cameraMode === 'isometric') this.cameraMode = 'third';
        else if (this.cameraMode === 'third') this.cameraMode = 'first';
        else this.cameraMode = 'isometric';

        this.headMesh.visible = (this.cameraMode !== 'first');
    }

    spawn(spawnVec) {
        this.position.copy(spawnVec);
        this.mesh.position.copy(this.position);
        this.velocity.set(0, 0, 0);
        this.health = 100;
        this.infection = 0;
        this.stamina = 100;
        this.isDead = false;
        this.isMasked = false;
        this.maskTimer = 0;
        this.boostTimer = 0;
        this.carryingCount = 0;
    }

    update(delta, colliders = []) {
        if (this.isDead) return;

        // Timers
        if (this.maskTimer > 0) {
            this.maskTimer -= delta;
            if (this.maskTimer <= 0) this.isMasked = false;
        }

        if (this.boostTimer > 0) {
            this.boostTimer -= delta;
        }

        // Gamepad polling
        const gp = this.pollGamepad(delta);

        // Crouch & Sprint (from Keyboard, Touch, or Gamepad)
        this.isCrouching = !!(this.keys['KeyC'] || this.keys['ControlLeft'] || this.touchCrouch || gp.crouch);
        const canSprint = !this.isCrouching && (this.stamina > 5) && (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchSprint || gp.sprint);
        this.isSprinting = canSprint;

        let speed = 4.4;
        if (this.isCrouching) {
            speed = 2.2;
        } else if (this.stamina <= 0) {
            speed = 1.9; // Exhausted from virus exposure / lack of stamina!
        } else if (this.isSprinting) {
            speed = 7.8;
            this.stamina = Math.max(0, this.stamina - delta * 18);
        } else {
            this.stamina = Math.min(this.maxStamina, this.stamina + delta * 14);
        }

        if (this.boostTimer > 0) {
            speed *= 1.35;
        }

        // Combined Input (Keyboard + Virtual Joystick + Gamepad)
        let inputX = 0;
        let inputZ = 0;

        if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;

        if (Math.abs(this.touchMovement.x) > 0.05 || Math.abs(this.touchMovement.y) > 0.05) {
            inputX += this.touchMovement.x;
            inputZ += this.touchMovement.y;
        }

        if (Math.abs(gp.x) > 0.1 || Math.abs(gp.z) > 0.1) {
            inputX += gp.x;
            inputZ += gp.z;
        }

        if (inputX !== 0 || inputZ !== 0) {
            const moveVec = new THREE.Vector3(inputX, 0, inputZ);
            if (moveVec.length() > 1.0) moveVec.normalize();

            // Rotate input relative to camera view
            if (this.cameraMode === 'isometric') {
                moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.isoYaw);
            }

            this.velocity.x = moveVec.x * speed;
            this.velocity.z = moveVec.z * speed;

            // Turn character smoothly toward movement direction
            const targetAngle = Math.atan2(moveVec.x, moveVec.z);
            let angleDiff = targetAngle - this.facingAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.facingAngle += angleDiff * Math.min(1.0, delta * 14);

            // Limb Swing animation
            const swing = Math.sin(Date.now() * 0.011 * (speed / 4)) * 0.5;
            this.leftLeg.rotation.x = swing;
            this.rightLeg.rotation.x = -swing;
            this.leftArm.rotation.x = -swing;
            this.rightArm.rotation.x = swing;

            // Footsteps sound
            this.footstepTimer += delta * (speed / 4);
            if (this.footstepTimer > 0.32) {
                this.footstepTimer = 0;
                sounds.playFootstep();
            }
        } else {
            this.velocity.x = 0;
            this.velocity.z = 0;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
        }

        // Apply Collision against FloorPlan obstacles
        this.applyCollision(delta, colliders);

        // Crouch height scaling
        const targetH = this.isCrouching ? 0.65 : 1.0;
        this.torsoMesh.scale.y = THREE.MathUtils.lerp(this.torsoMesh.scale.y, targetH, delta * 12);
        this.torsoMesh.position.y = this.isCrouching ? 0.78 : 1.06;
        this.headMesh.position.y = this.isCrouching ? 1.2 : 1.55;

        // Position and orient mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.facingAngle;

        // Camera follow
        this.updateCamera(delta);
    }

    applyCollision(delta, colliders) {
        const nextPos = this.position.clone().addScaledVector(this.velocity, delta);
        const playerBox = new THREE.Box3();
        const currentH = this.isCrouching ? this.crouchHeight : this.height;

        // X collision
        playerBox.setFromCenterAndSize(
            new THREE.Vector3(nextPos.x, currentH / 2, this.position.z),
            new THREE.Vector3(this.radius * 2, currentH, this.radius * 2)
        );

        let hitX = false;
        for (const box of colliders) {
            if (box.intersectsBox(playerBox)) {
                hitX = true;
                break;
            }
        }
        if (!hitX) {
            this.position.x = nextPos.x;
        }

        // Z collision
        playerBox.setFromCenterAndSize(
            new THREE.Vector3(this.position.x, currentH / 2, nextPos.z),
            new THREE.Vector3(this.radius * 2, currentH, this.radius * 2)
        );

        let hitZ = false;
        for (const box of colliders) {
            if (box.intersectsBox(playerBox)) {
                hitZ = true;
                break;
            }
        }
        if (!hitZ) {
            this.position.z = nextPos.z;
        }
    }

    updateCamera(delta) {
        if (this.cameraMode === 'isometric') {
            // Free 3D Spherical Orbit Camera (Drag with Left Mouse Button / WASD)
            const dist = this.isoDistance * this.zoomLevel;
            const horizDist = dist * Math.cos(this.isoPitch);
            const vertHeight = dist * Math.sin(this.isoPitch);

            const camOffset = new THREE.Vector3(
                horizDist * Math.sin(this.isoYaw),
                vertHeight,
                horizDist * Math.cos(this.isoYaw)
            );

            const targetCamPos = this.position.clone().add(camOffset);
            this.camera.position.lerp(targetCamPos, delta * 12);
            this.camera.lookAt(this.position.x, this.position.y + 0.7, this.position.z);
        } else if (this.cameraMode === 'third') {
            // Third Person Over-Shoulder
            const offset = new THREE.Vector3(0, 2.0, 3.8);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.facingAngle);
            const targetCamPos = this.position.clone().add(offset);
            this.camera.position.lerp(targetCamPos, delta * 10);
            this.camera.lookAt(this.position.x, this.position.y + 1.2, this.position.z);
        } else {
            // First Person
            this.camera.position.set(this.position.x, this.isCrouching ? 1.2 : 1.6, this.position.z);
            this.camera.rotation.set(0, this.facingAngle, 0, 'YXZ');
        }
    }
}
