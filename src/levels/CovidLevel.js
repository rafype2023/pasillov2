import * as THREE from 'three';
import { SneezerNPC, FernanNPC, AlejandroNPC, HectorNPC } from '../entities/NPCs.js';
import { sounds } from '../audio/SoundEffects.js';

export class CovidLevel {
    constructor(scene, floorPlan, particles, player) {
        this.scene = scene;
        this.floorPlan = floorPlan;
        this.particles = particles;
        this.player = player;

        this.npcs = [];
        this.pickups = [];
        this.safeStation = null;
        this.isComplete = false;
        this.isFailed = false;

        // Potential Safe Zone locations across Floor 3
        this.safeLocations = [
            { name: 'Lounge / Breakroom', pos: this.floorPlan.loungePoint.clone() },
            { name: 'Oficina Ejecutiva Norte', pos: new THREE.Vector3(-24, 0, -16) },
            { name: 'Pasillo Ala Oeste', pos: new THREE.Vector3(-22, 0, 12) },
            { name: 'Hub Sur de Cubículos', pos: new THREE.Vector3(18, 0, 14) },
            { name: 'Sala de Conferencias', pos: new THREE.Vector3(-6, 0, -14) },
            { name: 'Vestíbulo Sur', pos: new THREE.Vector3(6, 0, 16) },
            { name: 'Corredor Central', pos: new THREE.Vector3(-10, 0, 6) }
        ];

        this.currentLocationIndex = 0;
        this.safeStationPos = this.floorPlan.loungePoint.clone();
        this.safeRelocateTimer = 45.0; // Changes every 45 seconds!
        this.maxRelocateTime = 45.0;
    }

    start() {
        this.cleanup();
        this.isComplete = false;
        this.isFailed = false;
        this.safeRelocateTimer = this.maxRelocateTime;

        // Spawn player at "Usted Está Aquí"
        this.player.spawn(this.floorPlan.spawnPoint);
        this.player.infection = 0;

        // 1. Spawn Sneezer NPCs patrolling cubicles & stalking player
        const wp1 = [new THREE.Vector3(-4, 0, 4), new THREE.Vector3(-4, 0, 16), new THREE.Vector3(-14, 0, 16), new THREE.Vector3(-14, 0, 4)];
        const s1 = new SneezerNPC(this.scene, new THREE.Vector3(-4, 0, 4), wp1, this.particles);
        this.npcs.push(s1);

        const wp2 = [new THREE.Vector3(-20, 0, -12), new THREE.Vector3(-20, 0, 10), new THREE.Vector3(-26, 0, 10), new THREE.Vector3(-26, 0, -12)];
        const s2 = new SneezerNPC(this.scene, new THREE.Vector3(-20, 0, -12), wp2, this.particles);
        this.npcs.push(s2);

        const wp3 = [new THREE.Vector3(10, 0, 8), new THREE.Vector3(22, 0, 8), new THREE.Vector3(22, 0, 16), new THREE.Vector3(10, 0, 16)];
        const s3 = new SneezerNPC(this.scene, new THREE.Vector3(10, 0, 8), wp3, this.particles);
        this.npcs.push(s3);

        // 2. Spawn Fernan, Alejandro, and Hector
        const fernan = new FernanNPC(this.scene, new THREE.Vector3(-6, 0, 6), this.particles);
        this.npcs.push(fernan);

        const alejandro = new AlejandroNPC(this.scene, new THREE.Vector3(-10, 0, 2), this.particles);
        this.npcs.push(alejandro);

        const hector = new HectorNPC(this.scene, new THREE.Vector3(4, 0, 4));
        this.npcs.push(hector);

        // 3. Spawn Pickups
        this.spawnPickups();

        // 4. Pick initial random safe location and create Safe Station beacon
        this.pickRandomSafeLocation(true);
    }

    pickRandomSafeLocation(isInitial = false) {
        let nextIndex;
        do {
            nextIndex = Math.floor(Math.random() * this.safeLocations.length);
        } while (nextIndex === this.currentLocationIndex && this.safeLocations.length > 1);

        this.currentLocationIndex = nextIndex;
        const target = this.safeLocations[nextIndex];
        this.safeStationPos.copy(target.pos);
        this.currentLocationName = target.name;
        this.safeRelocateTimer = this.maxRelocateTime;

        if (this.safeStation) {
            this.safeStation.position.copy(this.safeStationPos);
            sounds.playBoost();
            this.particles.createConfetti(this.safeStationPos);
        } else {
            this.createSafeStation();
        }
    }

    spawnPickups() {
        const sanitizerPositions = [
            new THREE.Vector3(-8, 0, 10),
            new THREE.Vector3(-18, 0, -4),
            new THREE.Vector3(0, 0, 8),
            new THREE.Vector3(14, 0, 12),
            new THREE.Vector3(-14, 0, 14),
            new THREE.Vector3(20, 0, -2)
        ];

        sanitizerPositions.forEach(pos => {
            const item = this.floorPlan.props.createHandSanitizer();
            item.position.copy(pos);
            this.scene.add(item);
            this.pickups.push({ mesh: item, type: 'sanitizer', pos });
        });

        const maskPositions = [
            new THREE.Vector3(-12, 0, 0),
            new THREE.Vector3(6, 0, 6),
            new THREE.Vector3(-24, 0, 4)
        ];

        maskPositions.forEach(pos => {
            const item = this.floorPlan.props.createMaskPickup();
            item.position.copy(pos);
            this.scene.add(item);
            this.pickups.push({ mesh: item, type: 'mask', pos });
        });
    }

    createSafeStation() {
        if (this.safeStation) {
            this.scene.remove(this.safeStation);
        }

        const group = new THREE.Group();
        
        // Floor glowing beacon
        const ringGeo = new THREE.RingGeometry(1.2, 1.7, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        group.add(ring);

        // Light beam
        const cylGeo = new THREE.CylinderGeometry(1.4, 1.4, 3.2, 16, 1, true);
        const cylMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
        });
        const cyl = new THREE.Mesh(cylGeo, cylMat);
        cyl.position.y = 1.6;
        group.add(cyl);

        // Sign banner
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00aa55';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ ESTACIÓN SEGURA', 128, 40);

        const tex = new THREE.CanvasTexture(canvas);
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.55), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
        sign.position.y = 2.5;
        group.add(sign);

        group.position.copy(this.safeStationPos);
        this.scene.add(group);
        this.safeStation = group;
    }

    update(delta, camera) {
        if (this.isComplete || this.isFailed) return;

        // 1. Update 45-second relocation countdown timer!
        this.safeRelocateTimer -= delta;
        if (this.safeRelocateTimer <= 0) {
            this.pickRandomSafeLocation(false);
        }

        // Pulse beacon animation
        if (this.safeStation) {
            this.safeStation.rotation.y += delta * 0.8;
        }

        // 2. Update NPCs (Sneezers track and pursue Guillo)
        this.npcs.forEach(npc => npc.update(delta, camera, this.player));

        // 3. Check Sneeze Clouds & Viral Exposure
        let isInViralCloud = false;
        if (!this.player.isMasked) {
            this.particles.emitters.forEach(em => {
                if (em.type === 'sneeze') {
                    const dist = em.center.distanceTo(this.player.position);
                    if (dist < em.radius) {
                        isInViralCloud = true;
                    }
                }
            });

            this.npcs.forEach(npc => {
                if (npc instanceof SneezerNPC) {
                    const dist = npc.position.distanceTo(this.player.position);
                    if (dist < 1.8) {
                        isInViralCloud = true;
                    }
                }
            });
        }

        if (isInViralCloud && !this.player.isMasked) {
            // Sneeze / Virus hits our hero: Stamina drains rapidly!
            this.player.stamina = Math.max(0, this.player.stamina - delta * 42);
            
            if (this.player.stamina <= 0) {
                this.player.infection = Math.min(100, this.player.infection + delta * 32);
            } else {
                this.player.infection = Math.min(100, this.player.infection + delta * 12);
            }
            sounds.playAlert();
        }

        // Check Game Over by Infection
        if (this.player.infection >= 100) {
            this.isFailed = true;
            this.player.isDead = true;
            sounds.playGameOver();
            return;
        }

        // 4. Check Pickup Collisions
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.mesh.rotation.y += delta * 2.0;

            const dist = p.pos.distanceTo(this.player.position);
            if (dist < 1.2) {
                if (p.type === 'sanitizer') {
                    this.player.infection = Math.max(0, this.player.infection - 35);
                    this.player.stamina = Math.min(100, this.player.stamina + 45);
                    this.player.carryingCount = Math.min(this.player.maxCarrying, (this.player.carryingCount || 0) + 1);
                    sounds.playPickup();
                } else if (p.type === 'mask') {
                    this.player.isMasked = true;
                    this.player.maskTimer = 12.0;
                    this.player.stamina = Math.min(100, this.player.stamina + 25);
                    this.player.carryingCount = Math.min(this.player.maxCarrying, (this.player.carryingCount || 0) + 1);
                    sounds.playBoost();
                }

                this.scene.remove(p.mesh);
                this.pickups.splice(i, 1);
            }
        }

        // 5. Check Safe Zone Reach
        const safeDist = this.safeStationPos.distanceTo(this.player.position);
        if (safeDist < 1.8) {
            this.isComplete = true;
            sounds.playVictory();
            this.particles.createConfetti(this.player.position);
        }
    }

    cleanup() {
        this.npcs.forEach(npc => npc.destroy());
        this.npcs = [];
        this.pickups.forEach(p => this.scene.remove(p.mesh));
        this.pickups = [];
        if (this.safeStation) {
            this.scene.remove(this.safeStation);
            this.safeStation = null;
        }
    }
}
