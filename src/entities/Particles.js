import * as THREE from 'three';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.emitters = [];
        this.activeParticles = [];
        this.initTextures();
    }

    initTextures() {
        // Create canvas textures for particles
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Soft round particle
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);

        this.glowTex = new THREE.CanvasTexture(canvas);
    }

    createSneezeBurst(position, direction) {
        const count = 45;
        const group = new THREE.Group();
        const pMat = new THREE.MeshBasicMaterial({
            color: 0x44ee33,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            map: this.glowTex
        });

        const particles = [];
        for (let i = 0; i < count; i++) {
            const size = 0.08 + Math.random() * 0.16;
            const p = new THREE.Mesh(new THREE.PlaneGeometry(size, size), pMat.clone());
            p.position.copy(position).add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ));

            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.6,
                (Math.random() - 0.2) * 0.4,
                (Math.random() - 0.5) * 0.6
            );
            const vel = direction.clone().multiplyScalar(4.5 + Math.random() * 3.0).add(spread);

            group.add(p);
            particles.push({
                mesh: p,
                velocity: vel,
                life: 1.0,
                decay: 0.35 + Math.random() * 0.25,
                scale: size
            });
        }

        pMat.dispose();
        this.scene.add(group);
        this.emitters.push({
            group,
            particles,
            type: 'sneeze',
            center: position.clone(),
            radius: 2.2, // Hazard radius
            age: 0,
            maxAge: 4.5
        });
    }

    createLaughEmoji(position) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.font = '32px sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('😂 Jajaja!', 8, 44);

        const tex = new THREE.CanvasTexture(canvas);
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), mat);
        mesh.position.copy(position).add(new THREE.Vector3(0, 0.4, 0));

        this.scene.add(mesh);
        this.activeParticles.push({
            mesh,
            velocity: new THREE.Vector3(0, 0.6 + Math.random() * 0.3, 0),
            life: 1.0,
            decay: 0.6,
            isBillboard: true
        });
    }

    createStumbleStars(position) {
        // Speech Bubble: ¡ME CAÍ! 😵
        const textCanvas = document.createElement('canvas');
        textCanvas.width = 192;
        textCanvas.height = 64;
        const tCtx = textCanvas.getContext('2d');
        tCtx.fillStyle = '#ff4444';
        tCtx.fillRect(0, 0, 192, 64);
        tCtx.fillStyle = '#ffffff';
        tCtx.font = 'bold 24px sans-serif';
        tCtx.textAlign = 'center';
        tCtx.fillText('¡ME CAÍ! 😵', 96, 42);

        const textTex = new THREE.CanvasTexture(textCanvas);
        const textMat = new THREE.MeshBasicMaterial({ map: textTex, transparent: true, side: THREE.DoubleSide });
        const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), textMat);
        textMesh.position.copy(position).add(new THREE.Vector3(0, 1.2, 0));
        this.scene.add(textMesh);

        this.activeParticles.push({
            mesh: textMesh,
            velocity: new THREE.Vector3(0, 0.7, 0),
            life: 1.0,
            decay: 0.45,
            isBillboard: true
        });

        // Dizzy Stars around head
        const starIcons = ['💫', '⭐', '✨', '💥'];
        for (let i = 0; i < 6; i++) {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.font = '36px sans-serif';
            ctx.fillText(starIcons[i % starIcons.length], 10, 48);

            const tex = new THREE.CanvasTexture(canvas);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), mat);

            const angle = (i / 6) * Math.PI * 2;
            mesh.position.copy(position).add(new THREE.Vector3(
                Math.cos(angle) * 0.6,
                0.6 + Math.random() * 0.5,
                Math.sin(angle) * 0.6
            ));

            this.scene.add(mesh);
            this.activeParticles.push({
                mesh,
                velocity: new THREE.Vector3(
                    Math.cos(angle) * 0.4,
                    0.5 + Math.random() * 0.4,
                    Math.sin(angle) * 0.4
                ),
                life: 1.0,
                decay: 0.4,
                isBillboard: true
            });
        }
    }

    createConfetti(position) {
        const colors = [0xff2222, 0x22ff22, 0x2266ff, 0xffdd22, 0xff22dd];

        for (let i = 0; i < 60; i++) {
            const col = colors[Math.floor(Math.random() * colors.length)];
            const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
            const p = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.08), mat);
            p.position.copy(position).add(new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ));

            this.scene.add(p);
            this.activeParticles.push({
                mesh: p,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 1.5,
                    2.0 + Math.random() * 2.0,
                    (Math.random() - 0.5) * 1.5
                ),
                gravity: -3.0,
                life: 1.0,
                decay: 0.3
            });
        }
    }

    update(delta, camera) {
        // Update emitters (e.g. Sneeze aerosol clouds)
        for (let i = this.emitters.length - 1; i >= 0; i--) {
            const em = this.emitters[i];
            em.age += delta;

            em.particles.forEach(p => {
                p.mesh.position.addScaledVector(p.velocity, delta);
                p.velocity.multiplyScalar(Math.exp(-5 * delta)); // Drag
                p.life -= delta * p.decay;
                p.mesh.material.opacity = Math.max(0, p.life * 0.8);
                p.mesh.scale.setScalar(1.0 + (1.0 - p.life) * 1.8); // Cloud expands
                if (camera) p.mesh.lookAt(camera.position);
            });

            if (em.age > em.maxAge) {
                em.particles.forEach(p => this.disposeParticle(p.mesh));
                this.scene.remove(em.group);
                this.emitters.splice(i, 1);
            }
        }

        // Update single particles
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const p = this.activeParticles[i];
            p.mesh.position.addScaledVector(p.velocity, delta);
            if (p.gravity) {
                p.velocity.y += p.gravity * delta;
            }
            p.life -= delta * p.decay;
            if (p.mesh.material) {
                p.mesh.material.opacity = Math.max(0, p.life);
            }
            if (p.isBillboard && camera) {
                p.mesh.lookAt(camera.position);
            }

            if (p.life <= 0) {
                this.disposeParticle(p.mesh);
                this.activeParticles.splice(i, 1);
            }
        }
    }

    disposeParticle(mesh) {
        mesh.removeFromParent();
        mesh.geometry.dispose();
        if (mesh.material.map && mesh.material.map !== this.glowTex) mesh.material.map.dispose();
        mesh.material.dispose();
    }

    clear() {
        this.emitters.forEach(em => { em.particles.forEach(p => this.disposeParticle(p.mesh)); this.scene.remove(em.group); });
        this.emitters = [];
        this.activeParticles.forEach(p => this.disposeParticle(p.mesh));
        this.activeParticles = [];
    }
}
