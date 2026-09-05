import * as THREE from 'three';
import { FernanNPC, AlejandroNPC, HectorNPC } from '../entities/NPCs.js';
import { sounds } from '../audio/SoundEffects.js';

export class LoungeRaceLevel {
    constructor(scene, floorPlan, particles, player) {
        this.scene = scene;
        this.floorPlan = floorPlan;
        this.particles = particles;
        this.player = player;

        this.npcs = [];
        this.racers = [];
        this.coffeePickups = [];
        this.finishTarget = this.floorPlan.loungePoint; // (18, 0, -4)
        this.isComplete = false;
        this.isFailed = false;
        this.rank = 1;
        this.raceTime = 0;
        this.countdown = 3.0;
        this.raceStarted = false;
        this.finishedOrder = 0;
        this.leaderboard = [];
    }

    start() {
        this.cleanup();
        this.isComplete = false;
        this.isFailed = false;
        this.raceStarted = false;
        this.countdown = 3.0;
        this.raceTime = 0;
        this.finishedOrder = 0;
        this.rank = 1;
        this.leaderboard = [];

        // 1. Spawn player at Start line in West wing
        const startLine = new THREE.Vector3(-18, 0, 10);
        this.finishTarget = new THREE.Vector3(16, 0, -2);
        this.player.spawn(startLine);
        this.player.stamina = 100;

        // 2. Spawn Racer NPCs side-by-side with balanced competitive speeds
        this.fernan = new FernanNPC(this.scene, new THREE.Vector3(-20, 0, 10), this.particles);
        this.fernan.speed = 3.8;
        this.npcs.push(this.fernan);

        this.alejandro = new AlejandroNPC(this.scene, new THREE.Vector3(-16, 0, 10), this.particles);
        this.alejandro.speed = 4.2;
        this.npcs.push(this.alejandro);

        this.hector = new HectorNPC(this.scene, new THREE.Vector3(-18, 0, 12));
        this.hector.speed = 4.6;
        this.npcs.push(this.hector);

        this.racers = [
            { name: 'Guillo (Tú)', entity: this.player, isPlayer: true, finished: false, finishPlace: 0, finishTime: 0 },
            { name: 'Hector ⚡', entity: this.hector, isPlayer: false, finished: false, finishPlace: 0, finishTime: 0 },
            { name: 'Alejandro 😂', entity: this.alejandro, isPlayer: false, finished: false, finishPlace: 0, finishTime: 0 },
            { name: 'Fernan 😵', entity: this.fernan, isPlayer: false, finished: false, finishPlace: 0, finishTime: 0 }
        ];

        // 3. Spawn Turbo Coffee Cups along the hallway
        this.spawnCoffee();

        // 4. Create Finish Banner at Lounge Buffet Table
        this.createFinishBanner();
    }

    spawnCoffee() {
        const coffeePositions = [
            new THREE.Vector3(-10, 0, 6),
            new THREE.Vector3(-2, 0, 6),
            new THREE.Vector3(6, 0, 4),
            new THREE.Vector3(12, 0, 0)
        ];

        coffeePositions.forEach(pos => {
            const cup = this.floorPlan.props.createCoffeeCup();
            cup.position.copy(pos);
            this.scene.add(cup);
            this.coffeePickups.push({ mesh: cup, pos });
        });
    }

    createFinishBanner() {
        const group = new THREE.Group();

        // Glowing finish ring
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(1.5, 2.2, 32),
            new THREE.MeshBasicMaterial({ color: 0xffbb00, side: THREE.DoubleSide })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.02;
        group.add(ring);

        // Sign
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(0, 0, 256, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 LOUNGE BUFFET!', 128, 40);

        const tex = new THREE.CanvasTexture(canvas);
        const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }));
        banner.position.y = 2.4;
        group.add(banner);

        group.position.copy(this.finishTarget);
        this.scene.add(group);
        this.finishBanner = group;
    }

    update(delta, camera) {
        // Countdown handling before start
        if (!this.raceStarted) {
            this.countdown -= delta;
            if (this.countdown <= 0) {
                this.raceStarted = true;
                sounds.playBoost();
                // Direct NPCs toward the lounge buffet
                this.fernan.setRoute(this.floorPlan.navigation.route(this.fernan.position, this.finishTarget));
                this.fernan.fallCooldown = 2.0; // Trips 2 seconds into the sprint!
                this.alejandro.setRoute(this.floorPlan.navigation.route(this.alejandro.position, this.finishTarget));
                this.hector.setRoute(this.floorPlan.navigation.route(this.hector.position, this.finishTarget));
            }
            return;
        }

        if (!this.isComplete && !this.isFailed) {
            this.raceTime += delta;
        }

        // Update NPCs
        this.npcs.forEach(npc => npc.update(delta, camera));

        // Update Coffee pickups
        for (let i = this.coffeePickups.length - 1; i >= 0; i--) {
            const c = this.coffeePickups[i];
            c.mesh.rotation.y += delta * 3.0;

            const dist = c.pos.distanceTo(this.player.position);
            if (dist < 1.2) {
                // Turbo Coffee Boost!
                this.player.boostTimer = 4.5;
                this.player.stamina = Math.min(100, this.player.stamina + 40);
                sounds.playBoost();
                this.scene.remove(c.mesh);
                this.coffeePickups.splice(i, 1);
            }
        }

        // Check each racer crossing finish line
        this.racers.forEach(r => {
            if (!r.finished) {
                const dist = r.entity.position.distanceTo(this.finishTarget);
                if (dist < 2.4) {
                    this.finishedOrder++;
                    r.finished = true;
                    r.finishPlace = this.finishedOrder;
                    r.finishTime = this.raceTime;
                }
            }
        });

        // Calculate real-time live ranking for all 4 racers
        const sorted = this.racers.slice().sort((a, b) => {
            if (a.finished && b.finished) {
                return a.finishPlace - b.finishPlace;
            }
            if (a.finished) return -1;
            if (b.finished) return 1;

            const distA = a.entity.position.distanceTo(this.finishTarget);
            const distB = b.entity.position.distanceTo(this.finishTarget);
            return distA - distB;
        });

        const playerRankIndex = sorted.findIndex(r => r.isPlayer);
        this.rank = playerRankIndex + 1;
        this.leaderboard = sorted;

        // Check if player crossed finish line
        const playerRacer = this.racers.find(r => r.isPlayer);
        if (playerRacer && playerRacer.finished && !this.isComplete && !this.isFailed) {
            this.rank = playerRacer.finishPlace;
            this.isComplete = true;
            sounds.playVictory();
            this.particles.createConfetti(this.player.position);
        }
    }

    getRankMedal(r) {
        if (r === 1) return '🥇';
        if (r === 2) return '🥈';
        if (r === 3) return '🥉';
        return '🏃';
    }

    cleanup() {
        this.npcs.forEach(npc => npc.destroy());
        this.npcs = [];
        this.coffeePickups.forEach(c => this.scene.remove(c.mesh));
        this.coffeePickups = [];
        if (this.finishBanner) {
            this.scene.remove(this.finishBanner);
            this.finishBanner = null;
        }
    }
}
