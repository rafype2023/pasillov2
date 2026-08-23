import * as THREE from 'three';
import { sounds } from '../audio/SoundEffects.js';

// Base NPC class with stylized arms and animated limbs
export class BaseNPC {
    constructor(scene, name, shirtColor, startPos, faceTexturePath = null) {
        this.scene = scene;
        this.name = name;
        this.position = startPos.clone();
        this.targetPos = null;
        this.speed = 3.6;
        this.facingAngle = 0;
        this.isFalling = false;
        this.fallTimer = 0;
        this.mesh = new THREE.Group();

        this.initMesh(shirtColor, faceTexturePath);
        this.scene.add(this.mesh);
    }

    initMesh(shirtColor, faceTexturePath) {
        // Head
        const headGeo = new THREE.BoxGeometry(0.34, 0.36, 0.32);
        const skinMat = new THREE.MeshStandardMaterial({ color: 0xedc2a4, roughness: 0.6 });
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.9 });
        
        let faceMat = skinMat;
        if (faceTexturePath) {
            const loader = new THREE.TextureLoader();
            const faceTex = loader.load(faceTexturePath);
            faceMat = new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 });
        }

        // Box faces: [Right, Left, Top, Bottom, Front (+Z), Back]
        const headMaterials = [skinMat, skinMat, hairMat, skinMat, faceMat, hairMat];

        this.head = new THREE.Mesh(headGeo, headMaterials);
        this.head.position.y = 1.55;
        this.head.castShadow = true;
        this.mesh.add(this.head);

        // Name Tag above head
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 40;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.roundRect ? ctx.roundRect(0, 0, 160, 40, 8) : ctx.fillRect(0, 0, 160, 40);
        ctx.fill();
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, 80, 26);

        const nameTex = new THREE.CanvasTexture(canvas);
        const nameMat = new THREE.MeshBasicMaterial({ map: nameTex, side: THREE.DoubleSide, transparent: true });
        this.nameTag = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), nameMat);
        this.nameTag.position.y = 2.0;
        this.mesh.add(this.nameTag);

        // Torso
        const torsoGeo = new THREE.BoxGeometry(0.48, 0.58, 0.28);
        const torsoMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
        this.torso = new THREE.Mesh(torsoGeo, torsoMat);
        this.torso.position.y = 1.06;
        this.torso.castShadow = true;
        this.mesh.add(this.torso);

        // Arms
        const armGeo = new THREE.BoxGeometry(0.12, 0.52, 0.14);
        this.leftArm = new THREE.Mesh(armGeo, torsoMat);
        this.leftArm.position.set(-0.31, 1.05, 0);
        this.leftArm.castShadow = true;
        this.mesh.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, torsoMat);
        this.rightArm.position.set(0.31, 1.05, 0);
        this.rightArm.castShadow = true;
        this.mesh.add(this.rightArm);

        // Legs
        const legGeo = new THREE.BoxGeometry(0.17, 0.7, 0.2);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1f242d, roughness: 0.85 });

        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.13, 0.35, 0);
        this.leftLeg.castShadow = true;
        this.mesh.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.13, 0.35, 0);
        this.rightLeg.castShadow = true;
        this.mesh.add(this.rightLeg);

        this.mesh.position.copy(this.position);
    }

    setDestination(target) {
        this.targetPos = target.clone();
    }

    update(delta, camera) {
        if (this.nameTag && camera) {
            this.nameTag.lookAt(camera.position);
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

// 1. Fernan: Always Falling! (El que siempre se cae)
export class FernanNPC extends BaseNPC {
    constructor(scene, startPos, particles) {
        super(scene, 'Fernan 😵', 0x22252a, startPos, '/v2_assets/fernan_v2_face.png'); // Black polo & V2 face
        this.particles = particles;
        this.fallCooldown = 2.0; // Trips after 2 seconds in Level 2!
        this.isDown = false;
        this.isStumbling = false;
        this.stumbleTimer = 0;
        this.fallTimer = 0;
        this.facingAngle = 0;
    }

    update(delta, camera) {
        super.update(delta, camera);

        // 1. If currently lying on the floor
        if (this.isDown) {
            this.fallTimer -= delta;

            // Comedic leg kicks while trying to get up from the floor
            const kick = Math.sin(Date.now() * 0.025) * 0.6;
            this.leftLeg.rotation.x = kick;
            this.rightLeg.rotation.x = -kick;
            this.leftArm.rotation.z = Math.PI / 2.5;
            this.rightArm.rotation.z = -Math.PI / 2.5;

            // Keep body flat on floor surface (y = 0.22m)
            this.mesh.position.set(this.position.x, 0.22, this.position.z);
            this.mesh.rotation.x = -Math.PI / 2;

            if (this.fallTimer <= 0) {
                // Recover and stand back up!
                this.isDown = false;
                this.mesh.rotation.x = 0;
                this.mesh.position.y = 0;
                this.leftArm.rotation.z = 0;
                this.rightArm.rotation.z = 0;
                this.leftLeg.rotation.x = 0;
                this.rightLeg.rotation.x = 0;
                this.fallCooldown = 3.2 + Math.random() * 2.5; // Falls again soon!
            }
            return;
        }

        // 2. If currently in stumbling / losing balance phase
        if (this.isStumbling) {
            this.stumbleTimer -= delta;

            // Wild wobble and arm flailing
            this.mesh.rotation.z = Math.sin(Date.now() * 0.035) * 0.45;
            this.leftArm.rotation.x = Math.sin(Date.now() * 0.04) * 1.5;
            this.rightArm.rotation.x = -Math.sin(Date.now() * 0.04) * 1.5;

            if (this.stumbleTimer <= 0) {
                this.isStumbling = false;
                this.mesh.rotation.z = 0;
                this.tripAndFall();
            }
            return;
        }

        // 3. Fall Cooldown countdown
        this.fallCooldown -= delta;
        if (this.fallCooldown <= 0) {
            this.isStumbling = true;
            this.stumbleTimer = 0.55; // 0.55s stumble animation before crash
            return;
        }

        // 4. Regular Running Movement towards finish
        if (this.targetPos) {
            const dir = this.targetPos.clone().sub(this.position);
            dir.y = 0;
            const dist = dir.length();
            if (dist > 0.5) {
                dir.normalize();
                this.position.addScaledVector(dir, this.speed * delta);
                this.mesh.position.copy(this.position);
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

                // Run cycle
                const swing = Math.sin(Date.now() * 0.01) * 0.55;
                this.leftLeg.rotation.x = swing;
                this.rightLeg.rotation.x = -swing;
                this.leftArm.rotation.x = -swing;
                this.rightArm.rotation.x = swing;
            }
        }
    }

    tripAndFall() {
        this.isDown = true;
        this.fallTimer = 2.0;
        sounds.playFernanFall();

        // Lie flat forward on top of the floor
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.set(this.position.x, 0.22, this.position.z);

        if (this.particles) {
            this.particles.createStumbleStars(this.position);
        }
    }
}

// 2. Alejandro: Always Laughing!
export class AlejandroNPC extends BaseNPC {
    constructor(scene, startPos, particles) {
        super(scene, 'Alejandro 😂', 0x3a3d44, startPos, '/v2_assets/alejandro_v2_face.png'); // Patterned shirt & V2 face
        this.particles = particles;
        this.laughCooldown = 2.5 + Math.random() * 3.0;
        this.laughingTimer = 0;
    }

    update(delta, camera) {
        super.update(delta, camera);

        this.laughCooldown -= delta;
        if (this.laughCooldown <= 0) {
            this.laughCooldown = 4.0 + Math.random() * 4.0;
            this.laughingTimer = 1.2;
            sounds.playLaugh();
            if (this.particles) {
                this.particles.createLaughEmoji(this.position);
            }
        }

        if (this.laughingTimer > 0) {
            this.laughingTimer -= delta;
            this.torso.rotation.x = Math.sin(Date.now() * 0.025) * 0.35;
            this.head.rotation.x = Math.sin(Date.now() * 0.025) * 0.35;
            this.leftArm.rotation.x = Math.sin(Date.now() * 0.025) * 0.5;
            this.rightArm.rotation.x = Math.sin(Date.now() * 0.025) * 0.5;
        } else {
            this.torso.rotation.x = 0;
            this.head.rotation.x = 0;
        }

        if (this.targetPos) {
            const dir = this.targetPos.clone().sub(this.position);
            dir.y = 0;
            const dist = dir.length();
            if (dist > 0.5) {
                dir.normalize();
                this.position.addScaledVector(dir, this.speed * delta);
                this.mesh.position.copy(this.position);
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

                const swing = Math.sin(Date.now() * 0.01) * 0.5;
                this.leftLeg.rotation.x = swing;
                this.rightLeg.rotation.x = -swing;
                if (this.laughingTimer <= 0) {
                    this.leftArm.rotation.x = -swing;
                    this.rightArm.rotation.x = swing;
                }
            }
        }
    }
}

// 3. Hector: Tactical Coworker
export class HectorNPC extends BaseNPC {
    constructor(scene, startPos) {
        super(scene, 'Hector ⚡', 0x228844, startPos, '/assets/hector_face.png');
        this.speed = 4.6;
    }

    update(delta, camera) {
        super.update(delta, camera);

        if (this.targetPos) {
            const dir = this.targetPos.clone().sub(this.position);
            dir.y = 0;
            const dist = dir.length();
            if (dist > 0.5) {
                dir.normalize();
                this.position.addScaledVector(dir, this.speed * delta);
                this.mesh.position.copy(this.position);
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

                const swing = Math.sin(Date.now() * 0.012) * 0.5;
                this.leftLeg.rotation.x = swing;
                this.rightLeg.rotation.x = -swing;
                this.leftArm.rotation.x = -swing;
                this.rightArm.rotation.x = swing;
            }
        }
    }
}

// 4. Sneezer NPC (COVID Hazard - Stalks and pursues our hero Guillo!)
export class SneezerNPC extends BaseNPC {
    constructor(scene, startPos, waypoints, particles) {
        super(scene, 'Sick Worker 🤧', 0x3d352e, startPos, '/v2_assets/sneezer_v2_face.png');
        this.waypoints = waypoints;
        this.currentWpIndex = 0;
        this.particles = particles;
        this.sneezeTimer = 2.0 + Math.random() * 2.0;
        this.speed = 2.8; // Active pursuit speed
        this.detectionRange = 25.0; // Notices player across the office
    }

    update(delta, camera, player) {
        super.update(delta, camera);

        let target = null;

        // Actively seek and move towards Guillo if nearby
        if (player && !player.isDead) {
            const distToPlayer = this.position.distanceTo(player.position);
            if (distToPlayer < this.detectionRange) {
                target = player.position.clone();
            }
        }

        if (!target && this.waypoints.length > 0) {
            target = this.waypoints[this.currentWpIndex];
        }

        if (target) {
            const dir = target.clone().sub(this.position);
            dir.y = 0;
            const dist = dir.length();

            // Aim sneeze when close to Guillo
            if (player && dist < 4.0) {
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);
            }

            if (dist > 1.2) {
                dir.normalize();
                this.position.addScaledVector(dir, this.speed * delta);
                this.mesh.position.copy(this.position);
                this.mesh.rotation.y = Math.atan2(dir.x, dir.z);

                const swing = Math.sin(Date.now() * 0.012) * 0.45;
                this.leftLeg.rotation.x = swing;
                this.rightLeg.rotation.x = -swing;
                this.leftArm.rotation.x = -swing;
                this.rightArm.rotation.x = swing;
            } else if (!player || this.position.distanceTo(player.position) > this.detectionRange) {
                this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
            }
        }

        // Sneeze attack timer
        this.sneezeTimer -= delta;
        if (this.sneezeTimer <= 0) {
            this.sneezeTimer = 2.5 + Math.random() * 2.5;
            this.triggerSneeze(player);
        }
    }

    triggerSneeze(player) {
        sounds.playSneeze();

        // Calculate sneeze emission direction
        const fwd = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        const sneezePos = this.position.clone().add(fwd.clone().multiplyScalar(0.6)).add(new THREE.Vector3(0, 1.45, 0));

        if (this.particles) {
            this.particles.createSneezeCloud(sneezePos, fwd);
        }

        // Viral exposure check on player
        if (player && !player.isDead) {
            const dist = this.position.distanceTo(player.position);
            if (dist < 4.8) {
                const exposure = player.isMasked ? 6 : 28;
                player.infect(exposure);
                sounds.playCough();
            }
        }
    }
}

// 5. Hostile Archer NPC (Active Shooter with Recurve Bow in Corporate Attire)
export class HostileNPC extends BaseNPC {
    constructor(scene, startPos, waypoints) {
        super(scene, 'Tactical Archer 🏹', 0x16181c, startPos, '/v2_assets/archer_v2_face.png');
        this.waypoints = waypoints;
        this.currentWpIndex = 0;
        this.speed = 3.4;
        this.shootTimer = 1.6 + Math.random();
        this.shootCooldown = 2.4; // Shoots every 2.4 seconds
        this.arrowSpeed = 16.0;
        this.detectionRange = 26.0;

        // Equip Recurve Bow in right hand
        const bowGroup = new THREE.Group();
        const bowCurveGeo = new THREE.TorusGeometry(0.28, 0.02, 8, 16, Math.PI);
        const bowMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.5 });
        const bowMesh = new THREE.Mesh(bowCurveGeo, bowMat);
        bowMesh.rotation.z = Math.PI / 2;
        bowGroup.add(bowMesh);

        // Bowstring
        const stringGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.56);
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const stringMesh = new THREE.Mesh(stringGeo, stringMat);
        stringMesh.position.x = 0;
        bowGroup.add(stringMesh);

        bowGroup.position.set(0.12, -0.15, 0.25);
        bowGroup.rotation.y = -Math.PI / 4;
        this.rightArm.add(bowGroup);

        // Flashlight / Aim Warning Beam
        const beamGeo = new THREE.ConeGeometry(0.8, 14.0, 16);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xff1122,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide
        });
        this.aimBeam = new THREE.Mesh(beamGeo, beamMat);
        this.aimBeam.position.set(0, 1.2, 7.0);
        this.aimBeam.rotation.x = -Math.PI / 2;
        this.mesh.add(this.aimBeam);
    }

    update(delta, camera, player, level) {
        super.update(delta, camera);

        if (!player || player.isDead) return;

        const dirToPlayer = player.position.clone().sub(this.position);
        dirToPlayer.y = 0;
        const dist = dirToPlayer.length();

        // 1. Stalk / Pursue Guillo across the office
        if (dist < this.detectionRange) {
            this.mesh.rotation.y = Math.atan2(dirToPlayer.x, dirToPlayer.z);

            // Move closer if not in optimal shooting distance
            if (dist > 4.5) {
                dirToPlayer.normalize();
                this.position.addScaledVector(dirToPlayer, this.speed * delta);
                this.mesh.position.copy(this.position);

                const swing = Math.sin(Date.now() * 0.012) * 0.45;
                this.leftLeg.rotation.x = swing;
                this.rightLeg.rotation.x = -swing;
                this.leftArm.rotation.x = -swing;
            }

            // 2. Aim and Shoot Arrow at Guillo
            this.shootTimer -= delta;
            if (this.shootTimer <= 0 && dist < 18.0) {
                this.shootTimer = this.shootCooldown;
                this.fireArrowAtPlayer(player, level);
            }
        } else if (this.waypoints && this.waypoints.length > 0) {
            // Patrol waypoints if player is far
            const wp = this.waypoints[this.currentWpIndex];
            const wpDir = wp.clone().sub(this.position);
            wpDir.y = 0;
            if (wpDir.length() < 0.8) {
                this.currentWpIndex = (this.currentWpIndex + 1) % this.waypoints.length;
            } else {
                wpDir.normalize();
                this.position.addScaledVector(wpDir, this.speed * delta);
                this.mesh.position.copy(this.position);
                this.mesh.rotation.y = Math.atan2(wpDir.x, wpDir.z);
            }
        }
    }

    fireArrowAtPlayer(player, level) {
        if (!level || !level.spawnArrow) return;
        sounds.playArrowShot();

        const spawnPos = this.position.clone().add(new THREE.Vector3(0, 1.2, 0));
        const targetPos = player.position.clone().add(new THREE.Vector3(0, player.isCrouching ? 0.6 : 1.1, 0));
        
        const shootDir = targetPos.clone().sub(spawnPos).normalize();
        level.spawnArrow(spawnPos, shootDir);
    }
}
