import * as THREE from 'three';
import { FernanNPC, AlejandroNPC, HectorNPC, HostileNPC } from '../entities/NPCs.js';
import { sounds } from '../audio/SoundEffects.js';

export class ActiveShooterLevel {
    constructor(scene, floorPlan, particles, player) {
        this.scene = scene;
        this.floorPlan = floorPlan;
        this.particles = particles;
        this.player = player;

        this.npcs = [];
        this.hostiles = [];
        this.arrows = [];
        this.rescuedColleagues = 0;
        this.totalColleagues = 3;
        this.hitsReceived = 0; // 4 arrows = 100% defeat (25% per arrow)
        this.headstartTimer = 8.0; // 8 seconds head start advantage for Guillo!
        this.isComplete = false;
        this.isFailed = false;
        this.evacRouteArrows = [];
    }

    start() {
        this.cleanup();
        this.isComplete = false;
        this.isFailed = false;
        this.hitsReceived = 0;
        this.headstartTimer = 8.0; // 8s head start!
        this.rescuedColleagues = 0;

        // 1. Set Emergency Red Lighting & Start Siren
        this.floorPlan.setEmergencyLighting(true);
        sounds.startSiren();

        // 2. Spawn Player at "Usted Está Aquí"
        this.player.spawn(this.floorPlan.spawnPoint);
        this.player.health = 100;
        this.player.stamina = 100;

        // 3. Spawn Hostile Archers pursuing Guillo
        const patrolWp = [
            new THREE.Vector3(0, 0, 2),
            new THREE.Vector3(0, 0, 10),
            new THREE.Vector3(-14, 0, 10),
            new THREE.Vector3(-14, 0, 2)
        ];
        const h1 = new HostileNPC(this.scene, new THREE.Vector3(0, 0, 4), patrolWp);
        this.hostiles.push(h1);

        const patrolWp2 = [
            new THREE.Vector3(18, 0, -6),
            new THREE.Vector3(18, 0, 6),
            new THREE.Vector3(26, 0, 6),
            new THREE.Vector3(26, 0, -6)
        ];
        const h2 = new HostileNPC(this.scene, new THREE.Vector3(18, 0, 0), patrolWp2);
        this.hostiles.push(h2);

        // 4. Spawn Colleagues to Rescue
        this.fernan = new FernanNPC(this.scene, new THREE.Vector3(-14, 0, 4), this.particles);
        this.fernan.rescued = false;
        this.npcs.push(this.fernan);

        this.alejandro = new AlejandroNPC(this.scene, new THREE.Vector3(-25, 0, -8), this.particles);
        this.alejandro.rescued = false;
        this.npcs.push(this.alejandro);

        this.hector = new HectorNPC(this.scene, new THREE.Vector3(13, 0, 2));
        this.hector.rescued = false;
        this.npcs.push(this.hector);

        // 5. Draw Evacuation Route Visual Aids & Glowing Exit Beacons
        this.createEvacuationArrows();
        this.createExitBeacons();
    }

    createExitBeacons() {
        this.exitBeacons = [];
        this.floorPlan.exits.forEach(exit => {
            const beaconGroup = new THREE.Group();

            const ringGeo = new THREE.RingGeometry(1.2, 1.8, 32);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00ff88,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = -Math.PI / 2;
            ring.position.y = 0.02;
            beaconGroup.add(ring);

            beaconGroup.position.copy(exit.pos);
            this.scene.add(beaconGroup);
            this.exitBeacons.push(beaconGroup);
        });
    }

    spawnArrow(origin, direction) {
        const arrowGroup = new THREE.Group();

        // Arrow Shaft
        const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8);
        const shaftMat = new THREE.MeshStandardMaterial({ color: 0x4a2e18, roughness: 0.7 });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.rotation.x = Math.PI / 2;
        arrowGroup.add(shaft);

        // Arrowhead (Red glowing tip)
        const headGeo = new THREE.ConeGeometry(0.04, 0.14, 8);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xff1122,
            emissive: 0xff0000,
            emissiveIntensity: 0.8
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 0, 0.4);
        head.rotation.x = Math.PI / 2;
        arrowGroup.add(head);

        // Fletching (Feathers on back)
        const featherGeo = new THREE.PlaneGeometry(0.06, 0.15);
        const featherMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const f1 = new THREE.Mesh(featherGeo, featherMat);
        f1.position.set(0, 0.03, -0.28);
        arrowGroup.add(f1);

        const f2 = new THREE.Mesh(featherGeo, featherMat);
        f2.position.set(0, -0.03, -0.28);
        f2.rotation.z = Math.PI / 2;
        arrowGroup.add(f2);

        arrowGroup.position.copy(origin);
        arrowGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

        this.scene.add(arrowGroup);

        this.arrows.push({
            mesh: arrowGroup,
            velocity: direction.clone().multiplyScalar(15.0), // 15 m/s arrow velocity
            life: 3.5
        });
    }

    createEvacuationArrows() {
        const arrowPath = [
            new THREE.Vector3(-2, 0.02, 2),
            new THREE.Vector3(-2, 0.02, 6),
            new THREE.Vector3(-2, 0.02, 10),
            new THREE.Vector3(-2, 0.02, 14),
            new THREE.Vector3(0, 0.02, 16),
            new THREE.Vector3(3, 0.02, 16),
            new THREE.Vector3(6, 0.02, 17)
        ];

        const arrowGeo = new THREE.PlaneGeometry(0.6, 0.8);
        const arrowMat = new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        arrowPath.forEach((pt, idx) => {
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            arrow.position.copy(pt);
            arrow.rotation.x = -Math.PI / 2;
            if (idx < 4) arrow.rotation.z = 0;
            else arrow.rotation.z = -Math.PI / 2;
            this.scene.add(arrow);
            this.evacRouteArrows.push(arrow);
        });
    }

    update(delta, camera) {
        if (this.isComplete || this.isFailed) return;

        // Manage 8-second head start advantage
        if (this.headstartTimer > 0) {
            this.headstartTimer -= delta;
            if (this.headstartTimer <= 0) {
                // Head start ended! Archers begin attack!
                sounds.playAlert();
            }
        }

        // 1. Update Hostile Archers (only pursue and shoot after 8s headstart)
        if (this.headstartTimer <= 0) {
            this.hostiles.forEach(h => {
                h.update(delta, camera, this.player, this);
            });
        }

        // 2. Update Flying Arrows & Check Collisions
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arr = this.arrows[i];
            arr.life -= delta;
            arr.mesh.position.addScaledVector(arr.velocity, delta);

            const arrowPos = arr.mesh.position;

            // Check collision with FloorPlan cubicle dividers / walls
            let hitWall = false;
            for (const collider of this.floorPlan.colliders) {
                if (collider.containsPoint(arrowPos)) {
                    hitWall = true;
                    break;
                }
            }

            if (hitWall) {
                // Arrow hits cubicle wall / obstacle and is blocked!
                this.scene.remove(arr.mesh);
                this.arrows.splice(i, 1);
                continue;
            }

            // Check collision with Player Guillo
            const playerTargetY = this.player.isCrouching ? 0.6 : 1.1;
            const playerCenter = this.player.position.clone().add(new THREE.Vector3(0, playerTargetY, 0));
            const distToGuillo = arrowPos.distanceTo(playerCenter);

            if (distToGuillo < 0.75) {
                // ARROW HIT GUILLO! Reduce 25% stamina and health (4 arrows kill Guillo)
                this.hitsReceived++;
                this.player.stamina = Math.max(0, this.player.stamina - 25);
                this.player.health = Math.max(0, this.player.health - 25);
                sounds.playArrowHit();

                if (this.particles) {
                    this.particles.createStumbleStars(this.player.position);
                }

                this.scene.remove(arr.mesh);
                this.arrows.splice(i, 1);

                // Check defeat condition (4 hits / 0 stamina / 0 health)
                if (this.player.stamina <= 0 || this.player.health <= 0 || this.hitsReceived >= 4) {
                    this.isFailed = true;
                    this.player.isDead = true;
                    sounds.stopSiren();
                    sounds.playGameOver();
                    return;
                }
                continue;
            }

            if (arr.life <= 0) {
                this.scene.remove(arr.mesh);
                this.arrows.splice(i, 1);
            }
        }

        // 3. Update Rescued Colleagues (Follow player convoy)
        this.npcs.forEach(npc => {
            if (!npc.rescued) {
                const dist = npc.position.distanceTo(this.player.position);
                if (dist < 2.2) {
                    npc.rescued = true;
                    this.rescuedColleagues++;
                    sounds.playPickup();
                }
            } else {
                npc.setDestination(this.player.position);
            }
            npc.update(delta, camera);
        });

        // 4. Check for Emergency Exit Stairwell Escapes (Reaching any exit stairwell wins the level!)
        for (const exit of this.floorPlan.exits) {
            const dist = exit.pos.distanceTo(this.player.position);
            if (dist < 3.2) {
                // ESCAPED TO SAFETY!
                this.isComplete = true;
                sounds.stopSiren();
                sounds.playVictory();
                if (this.particles) {
                    this.particles.createConfetti(this.player.position);
                }
                break;
            }
        }

        // Pulse evacuation floor arrows
        this.evacRouteArrows.forEach((arr, i) => {
            arr.material.opacity = 0.4 + Math.sin(Date.now() * 0.005 + i) * 0.4;
        });
    }

    cleanup() {
        sounds.stopSiren();
        this.floorPlan.setEmergencyLighting(false);
        this.npcs.forEach(npc => npc.destroy());
        this.npcs = [];
        this.hostiles.forEach(h => h.destroy());
        this.hostiles = [];
        this.arrows.forEach(arr => this.scene.remove(arr.mesh));
        this.arrows = [];
        this.evacRouteArrows.forEach(arr => this.scene.remove(arr));
        this.evacRouteArrows = [];
        if (this.exitBeacons) {
            this.exitBeacons.forEach(b => this.scene.remove(b));
            this.exitBeacons = [];
        }
    }
}
