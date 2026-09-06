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
        this.verticalVelocity = 0;
        this.gravity = -24.0;
        this.jumpForce = 8.5;
        this.isGrounded = true;
        this.facingAngle = 0;

        // Current Skin: 'human' (Business Casual) or 'cyber' (Titanium Cyber Android)
        this.currentSkin = 'human';

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

        // Free 3D Orbit Camera (Interior tactical CCTV & Third Person)
        this.cameraMode = 'third'; // 'isometric', 'third', 'first'
        this.isoDistance = 16; // Interior distance beneath ceiling
        this.isoPitch = 0.78; // ~18.5 degrees tilt (matching reference interior perspective)
        this.isoYaw = -0.35; // Aligned directly down the central Spine channel
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
        this.touchJump = false;
        this.footstepTimer = 0;
        this.animTime = 0;

        this.initMesh();
        this.initControls();
        this.initMobileTouchControls();
    }

    initMesh() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
        }

        if (this.currentSkin === 'cyber') {
            // Build Sleek Titanium Cyber Android Cyborg with Glowing Cyan Arc Reactor
            this.modelParts = HumanoidBuilder.createCyberAndroidMesh({
                armorColor: 0x8a929b,
                glowColor: 0x00f0ff,
                accentColor: 0x323a46
            });
        } else {
            // Build Realistic Human Model matching reference image (Light blue dress shirt & dark slacks)
            this.modelParts = HumanoidBuilder.createRealisticHumanMesh({
                shirtColor: 0xa4c6eb, // Light blue dress shirt
                pantsColor: 0x1e232a, // Charcoal dark slacks
                shoesColor: 0x111317, // Black dress shoes
                hairColor: 0xb5ada5,  // Styled wavy grey/blonde hair
                faceTexturePath: '/models/guillo-face.png',
                hasBadge: true
            });
        }

        this.mesh = this.modelParts.group;
        this.torsoGroup = this.modelParts.torsoGroup;
        this.headGroup = this.modelParts.headGroup;
        this.headMesh = this.modelParts.headMesh;

        // Glasses rim (if human)
        if (this.currentSkin === 'human' && !this.modelParts.detailed) {
            const glassGeo = new THREE.BoxGeometry(0.24, 0.06, 0.03);
            const glassMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
            const glasses = new THREE.Mesh(glassGeo, glassMat);
            glasses.position.set(0, 0, 0.16);
            this.headGroup.add(glasses);
        }

        // N95 Mask (Toggled on when collected in Level 1)
        const maskGeo = new THREE.ConeGeometry(0.12, 0.14, 16);
        const maskMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
        this.maskMesh = new THREE.Mesh(maskGeo, maskMat);
        this.maskMesh.rotation.x = Math.PI / 2;
        this.maskMesh.position.set(0, -0.04, 0.15);
        this.maskMesh.visible = this.isMasked;
        (this.modelParts.faceAnchor || this.headGroup).add(this.maskMesh);

        // Carrying Item Holder in front of character
        this.itemHolder = new THREE.Group();
        this.itemHolder.position.set(0, 1.0, 0.3);
        this.mesh.add(this.itemHolder);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    setSkin(skinType) {
        if (skinType !== 'human' && skinType !== 'cyber') return;
        this.currentSkin = skinType;
        this.initMesh();
    }

    toggleSkin() {
        this.setSkin(this.currentSkin === 'human' ? 'cyber' : 'human');
    }

    initControls() {
        window.addEventListener('keydown', (e) => {
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
            this.keys[e.code] = true;
            if (e.repeat) return;
            if (e.code === 'KeyV') {
                this.toggleCameraMode();
            }
            if (e.code === 'KeyT' || e.code === 'KeyK') {
                this.toggleSkin();
            }
            if (e.code === 'KeyQ') {
                this.isoYaw += Math.PI / 4;
            }
            if (e.code === 'KeyE') {
                this.isoYaw -= Math.PI / 4;
            }
            if (e.code === 'Space') {
                this.jump();
            }
        });

        window.addEventListener('blur', () => { this.keys = {}; this.touchSprint = false; this.isDraggingMouse = false; });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // 3D Mouse Drag Orbit (Left Mouse Button Drag)
        window.addEventListener('pointerdown', (e) => {
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
        const joyZone = document.getElementById('touch-joystick-zone');
        const joyThumb = document.getElementById('touch-joystick-thumb');
        const btnSprint = document.getElementById('touch-btn-sprint');
        const btnCrouch = document.getElementById('touch-btn-crouch');
        const btnCam = document.getElementById('touch-btn-cam');
        const btnJump = document.getElementById('touch-btn-jump');
        const btnSkin = document.getElementById('touch-btn-skin');

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
        btnJump?.addEventListener('touchstart', () => { this.jump(); }, { passive: true });
        btnSkin?.addEventListener('touchstart', () => { this.toggleSkin(); }, { passive: true });
        btnCam?.addEventListener('touchstart', () => { this.toggleCameraMode(); }, { passive: true });
    }

    pollGamepad(delta) {
        if (!navigator.getGamepads) return { x: 0, z: 0, sprint: false, crouch: false, jump: false, skin: false };
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
            if (gp && gp.connected) {
                const lx = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
                const lz = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;

                if (Math.abs(gp.axes[2]) > 0.2) {
                    this.isoYaw -= gp.axes[2] * delta * 3.0;
                }
                if (Math.abs(gp.axes[3]) > 0.2) {
                    this.isoPitch = Math.max(0.18, Math.min(Math.PI / 2.1, this.isoPitch - gp.axes[3] * delta * 2.0));
                }

                // Buttons: A (0) = Sprint/Jump, B (1) = Crouch, X (2) = Jump, Y (3) = Cam, LB (4) = Skin
                const btnSprint = gp.buttons[0]?.pressed || gp.buttons[7]?.pressed; // A or RT
                const btnCrouch = gp.buttons[1]?.pressed || gp.buttons[6]?.pressed; // B or LT
                const btnJump = gp.buttons[2]?.pressed; // X
                const btnSkin = gp.buttons[4]?.pressed; // LB

                if (btnJump && this.isGrounded) this.jump();
                if (btnSkin && !this.gamepadSkinDown) this.toggleSkin();
                this.gamepadSkinDown = btnSkin;

                return { x: lx, z: lz, sprint: btnSprint, crouch: btnCrouch };
            }
        }
        return { x: 0, z: 0, sprint: false, crouch: false };
    }

    jump() {
        if (!this.isGrounded || this.isDead) return;
        this.isGrounded = false;
        this.verticalVelocity = this.jumpForce;
        if (sounds.playJump) sounds.playJump();
    }

    toggleCameraMode() {
        if (this.cameraMode === 'isometric') this.cameraMode = 'third';
        else if (this.cameraMode === 'third') this.cameraMode = 'first';
        else this.cameraMode = 'isometric';

        if (this.headMesh) {
            this.headMesh.visible = (this.cameraMode !== 'first');
        }
    }

    spawn(spawnVec) {
        this.mesh.rotation.set(0, 0, 0);
        this.keys = {};
        this.maskMesh.visible = false;
        this.position.copy(spawnVec);
        this.position.y = 0;
        this.mesh.position.copy(this.position);
        this.velocity.set(0, 0, 0);
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.health = 100;
        this.infection = 0;
        this.stamina = 100;
        this.isDead = false;
        this.isMasked = false;
        this.maskTimer = 0;
        this.boostTimer = 0;
        this.carryingCount = 0;
    }

    infect(amount) {
        if (this.isDead) return;
        this.infection = Math.min(100, this.infection + amount);
        if (this.infection >= 100) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.velocity.set(0, 0, 0);
        this.mesh.rotation.x = -Math.PI / 2;
        this.position.y = 0.2;
        this.mesh.position.copy(this.position);
    }

    update(delta, colliders = []) {
        if (this.isDead) return;

        this.animTime += delta;

        // Timers
        if (this.maskTimer > 0) {
            this.maskTimer -= delta;
            if (this.maskTimer <= 0) {
                this.isMasked = false;
                if (this.maskMesh) this.maskMesh.visible = false;
            }
        }

        if (this.boostTimer > 0) {
            this.boostTimer -= delta;
        }

        // Gamepad polling
        const gp = this.pollGamepad(delta);

        // Jump physics & gravity
        if (!this.isGrounded) {
            this.verticalVelocity += this.gravity * delta;
            this.position.y += this.verticalVelocity * delta;

            if (this.position.y <= 0) {
                sounds.playLanding();
                this.position.y = 0;
                this.verticalVelocity = 0;
                this.isGrounded = true;
            }
        }

        // Crouch & Sprint
        this.isCrouching = this.isGrounded && !!(this.keys['KeyC'] || this.keys['ControlLeft'] || this.touchCrouch || gp.crouch);
        const wantsMove = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].some(k => this.keys[k]) || Math.hypot(this.touchMovement.x, this.touchMovement.y, gp.x, gp.z) > 0.1;
        const canSprint = wantsMove && !this.isCrouching && (this.stamina > 5) && (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.touchSprint || gp.sprint);
        this.isSprinting = canSprint;

        let speed = 4.4;
        if (this.isCrouching) {
            speed = 2.2;
        } else if (this.stamina <= 0) {
            speed = 2.0;
        } else if (this.isSprinting) {
            speed = 8.0;
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

        const isMoving = (inputX !== 0 || inputZ !== 0);

        if (isMoving) {
            const moveVec = new THREE.Vector3(inputX, 0, inputZ);
            if (moveVec.length() > 1.0) moveVec.normalize();

            // Rotate input relative to camera view
            if (this.cameraMode !== 'first') {
                moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.isoYaw);
            } else {
                moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.isoYaw);
            }

            const acceleration = 1 - Math.exp(-18 * delta);
            this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, moveVec.x * speed, acceleration);
            this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, moveVec.z * speed, acceleration);

            // Turn character smoothly toward movement direction
            const targetAngle = Math.atan2(moveVec.x, moveVec.z);
            let angleDiff = targetAngle - this.facingAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.facingAngle += angleDiff * Math.min(1.0, delta * 14);

        } else {
            this.velocity.x = THREE.MathUtils.damp(this.velocity.x, 0, 22, delta);
            this.velocity.z = THREE.MathUtils.damp(this.velocity.z, 0, 22, delta);
            if (this.velocity.lengthSq() < 0.0025) this.velocity.set(0, 0, 0);
        }

        const beforeMove = this.position.clone();
        this.cameraColliders = colliders;
        this.applyCollision(delta, colliders);
        const distance = Math.hypot(this.position.x - beforeMove.x, this.position.z - beforeMove.z);
        const actualSpeed = distance / Math.max(delta, 0.001);
        if (this.isGrounded && distance > 0.001) {
            this.footstepTimer += distance;
            if (this.footstepTimer > (this.isSprinting ? 1.6 : 1.05)) {
                this.footstepTimer = 0;
                sounds.playFootstep(this.isSprinting ? 1 : this.isCrouching ? 0.3 : 0.65);
            }
        }
        let poseState = !this.isGrounded ? 'jump' : this.isCrouching ? 'crouch' : actualSpeed > 0.1 ? 'run' : 'idle';
        HumanoidBuilder.applyPose(this.modelParts, poseState, this.animTime, actualSpeed);

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
        this.mesh.visible = this.cameraMode !== 'first';
        if (this.cameraMode === 'isometric') {
            const dist = this.isoDistance * this.zoomLevel;
            const horizDist = dist * Math.cos(this.isoPitch);
            const vertHeight = dist * Math.sin(this.isoPitch);

            const camOffset = new THREE.Vector3(
                horizDist * Math.sin(this.isoYaw),
                vertHeight,
                horizDist * Math.cos(this.isoYaw)
            );

            const targetCamPos = this.position.clone().add(camOffset);
            this.camera.position.lerp(targetCamPos, 1 - Math.exp(-10 * delta));
            this.camera.lookAt(this.position.x, this.position.y + 0.7, this.position.z);
        } else if (this.cameraMode === 'third') {
            const offset = new THREE.Vector3(0.42, 1.75 + (this.isoPitch - 0.78) * 1.2, 2.9 * this.zoomLevel);
            offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.isoYaw);
            const targetCamPos = this.position.clone().add(offset);
            const focus = this.position.clone().add(new THREE.Vector3(0, 1.25, 0));
            const direction = targetCamPos.clone().sub(focus).normalize();
            const ray = new THREE.Ray(focus, direction);
            let distance = focus.distanceTo(targetCamPos);
            for (const box of this.cameraColliders || []) {
                if (box.max.y < 2.5) continue;
                const hit = ray.intersectBox(box, new THREE.Vector3());
                if (hit) distance = Math.min(distance, Math.max(0.25, focus.distanceTo(hit) - 0.25));
            }
            targetCamPos.copy(focus).addScaledVector(direction, distance);
            this.camera.position.lerp(targetCamPos, 1 - Math.exp(-10 * delta));
            this.camera.lookAt(this.position.x, this.position.y + 1.25, this.position.z);
        } else {
            this.camera.position.set(this.position.x, this.position.y + (this.isCrouching ? 1.1 : 1.6), this.position.z);
            this.camera.rotation.set(0, this.isoYaw, 0, 'YXZ');
        }
    }
}
