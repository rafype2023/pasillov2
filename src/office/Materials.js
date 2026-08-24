import * as THREE from 'three';

/**
 * Photorealistic Office PBR Materials Engine
 * Uses the authentic high-resolution photographic textures from the office assets:
 * - /assets/carpet_texture.jpg (Authentic loop-pile heather charcoal carpet)
 * - /assets/cubicle_fabric.jpg (Authentic woven acoustic beige/grey partition fabric)
 * - /assets/plano_map.png (Evacuation floorplan blueprint)
 * - Procedural maple woodgrain, server video wall, whiteboard milestones, and drop ceiling
 */
class OfficeMaterials {
    constructor() {
        this.loader = new THREE.TextureLoader();
        this.materials = {};
        this.textures = {};
        this.initProceduralTextures();
        this.initMaterials();
    }

    initProceduralTextures() {
        // 1. Maple / Birch Light Woodgrain Desktop Texture
        const woodCanvas = document.createElement('canvas');
        woodCanvas.width = 512;
        woodCanvas.height = 256;
        const wCtx = woodCanvas.getContext('2d');
        wCtx.fillStyle = '#e6d3b8';
        wCtx.fillRect(0, 0, 512, 256);
        for (let i = 0; i < 60; i++) {
            const y = Math.random() * 256;
            wCtx.fillStyle = 'rgba(180, 150, 120, 0.18)';
            wCtx.fillRect(0, y, 512, Math.random() * 5 + 1);
        }
        this.textures.deskWood = new THREE.CanvasTexture(woodCanvas);

        // 2. Whiteboard Texture ("MILESTONES Q3", "SERVER STATUS: UP")
        const wbCanvas = document.createElement('canvas');
        wbCanvas.width = 512;
        wbCanvas.height = 320;
        const wbCtx = wbCanvas.getContext('2d');
        wbCtx.fillStyle = '#ffffff';
        wbCtx.fillRect(0, 0, 512, 320);

        wbCtx.strokeStyle = '#9ca3af';
        wbCtx.lineWidth = 6;
        wbCtx.strokeRect(3, 3, 506, 314);

        wbCtx.font = 'bold 26px "Inter", "Outfit", sans-serif';
        wbCtx.fillStyle = '#1e293b';
        wbCtx.fillText('MILESTONES Q3', 28, 50);

        wbCtx.beginPath();
        wbCtx.moveTo(28, 62);
        wbCtx.lineTo(484, 62);
        wbCtx.strokeStyle = '#3b82f6';
        wbCtx.lineWidth = 3;
        wbCtx.stroke();

        wbCtx.font = 'bold 20px monospace';
        wbCtx.fillStyle = '#16a34a';
        wbCtx.fillText('SERVER STATUS: UP 🟢', 28, 105);

        wbCtx.font = '500 18px "Inter", sans-serif';
        wbCtx.fillStyle = '#334155';
        wbCtx.fillText('• Phase 1: Core Database API ... [DONE]', 28, 150);
        wbCtx.fillText('• Phase 2: Floor 3 Security Grid ... [OK]', 28, 185);
        wbCtx.fillText('• Phase 3: Active Shooter Evacuation ... [LIVE]', 28, 220);

        wbCtx.font = 'italic 16px "Inter", sans-serif';
        wbCtx.fillStyle = '#dc2626';
        wbCtx.fillText('! Reminder: Team sync today at 3:00 PM', 28, 275);

        this.textures.whiteboard = new THREE.CanvasTexture(wbCanvas);

        // 3. High-Tech Multi-Screen Server Video Wall
        const srvCanvas = document.createElement('canvas');
        srvCanvas.width = 1024;
        srvCanvas.height = 512;
        const sCtx = srvCanvas.getContext('2d');
        sCtx.fillStyle = '#060d17';
        sCtx.fillRect(0, 0, 1024, 512);

        const cols = 3;
        const rows = 2;
        const sw = 1024 / cols;
        const sh = 512 / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * sw;
                const y = r * sh;

                sCtx.fillStyle = '#0b1626';
                sCtx.fillRect(x + 4, y + 4, sw - 8, sh - 8);

                sCtx.strokeStyle = '#1e3a5f';
                sCtx.lineWidth = 3;
                sCtx.strokeRect(x + 4, y + 4, sw - 8, sh - 8);

                sCtx.fillStyle = '#38bdf8';
                sCtx.font = 'bold 16px monospace';
                sCtx.fillText(`[NODE 0${r * 3 + c + 1}] FIRSTBANK NETWORK`, x + 16, y + 30);

                sCtx.strokeStyle = (r === 0) ? '#22c55e' : '#06b6d4';
                sCtx.lineWidth = 2;
                sCtx.beginPath();
                sCtx.moveTo(x + 16, y + 100);
                for (let px = x + 16; px < x + sw - 20; px += 20) {
                    const py = y + 80 + Math.sin(px * 0.1 + r + c) * 35;
                    sCtx.lineTo(px, py);
                }
                sCtx.stroke();

                sCtx.fillStyle = '#22c55e';
                sCtx.font = '14px monospace';
                sCtx.fillText('STATUS: ONLINE (99.99%)', x + 16, y + 160);
                sCtx.fillStyle = '#94a3b8';
                sCtx.fillText(`TRAFFIC: ${(c * 142 + 250)} MB/s`, x + 16, y + 190);
                sCtx.fillText(`LATENCY: ${12 + (c * 2)}ms`, x + 16, y + 215);
            }
        }

        this.textures.serverWall = new THREE.CanvasTexture(srvCanvas);

        // 4. Suspended Acoustic Ceiling Tile Grid
        const ceilCanvas = document.createElement('canvas');
        ceilCanvas.width = 512;
        ceilCanvas.height = 512;
        const ceCtx = ceilCanvas.getContext('2d');
        ceCtx.fillStyle = '#f8fafc';
        ceCtx.fillRect(0, 0, 512, 512);
        ceCtx.strokeStyle = '#cbd5e1';
        ceCtx.lineWidth = 3;
        ceCtx.strokeRect(0, 0, 512, 512);
        ceCtx.strokeRect(0, 256, 512, 256);
        this.textures.ceiling = new THREE.CanvasTexture(ceilCanvas);
        this.textures.ceiling.wrapS = THREE.RepeatWrapping;
        this.textures.ceiling.wrapT = THREE.RepeatWrapping;
        this.textures.ceiling.repeat.set(20, 15);
    }

    initMaterials() {
        // 1. Photographic Heather Charcoal Carpet Floor Texture (/assets/carpet_texture_seamless.png)
        const carpetTex = this.loader.load('/assets/carpet_texture_seamless.png');
        carpetTex.wrapS = THREE.RepeatWrapping;
        carpetTex.wrapT = THREE.RepeatWrapping;
        carpetTex.repeat.set(28, 19);
        carpetTex.colorSpace = THREE.SRGBColorSpace;
        carpetTex.anisotropy = 16;

        this.materials.carpet = new THREE.MeshStandardMaterial({
            map: carpetTex,
            roughness: 0.82,
            metalness: 0.08,
            color: 0x9ca3af // Rich heather-grey tone from real office photos
        });

        // 2. Photographic Acoustic Cubicle Fabric (/assets/cubicle_fabric.jpg)
        const fabricTex = this.loader.load('/assets/cubicle_fabric.jpg');
        fabricTex.wrapS = THREE.RepeatWrapping;
        fabricTex.wrapT = THREE.RepeatWrapping;
        fabricTex.repeat.set(3, 2);
        fabricTex.colorSpace = THREE.SRGBColorSpace;
        fabricTex.anisotropy = 16;

        this.materials.cubicleFabric = new THREE.MeshStandardMaterial({
            map: fabricTex,
            roughness: 0.90,
            metalness: 0.02,
            color: 0xcdc8bd // Warm beige matching office photos
        });

        // Brushed Aluminum Cubicle Trim & Framing
        this.materials.cubicleTrim = new THREE.MeshStandardMaterial({
            color: 0xa8b0b8,
            roughness: 0.35,
            metalness: 0.75
        });

        // Central Cable Spine Cap
        this.materials.spineCap = new THREE.MeshStandardMaterial({
            color: 0x8a929b,
            roughness: 0.45,
            metalness: 0.45
        });

        // Light Maple Woodgrain Desktops
        this.materials.deskTop = new THREE.MeshStandardMaterial({
            map: this.textures.deskWood,
            roughness: 0.45,
            metalness: 0.08
        });

        // Black Metal Desk Base & Legs
        this.materials.deskLegs = new THREE.MeshStandardMaterial({
            color: 0x22262b,
            roughness: 0.4,
            metalness: 0.8
        });

        // Suspended Acoustic Drop Ceiling
        this.materials.ceiling = new THREE.MeshStandardMaterial({
            map: this.textures.ceiling,
            roughness: 0.95,
            metalness: 0.0
        });

        // Warm-Neutral Fluorescent Light Panels (Troffers)
        this.materials.fluorescentLight = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xfffaed,
            emissiveIntensity: 1.25,
            roughness: 0.15
        });

        // Perimeter Walls (Crisp corporate warm off-white)
        this.materials.wall = new THREE.MeshStandardMaterial({
            color: 0xe8e8e4,
            roughness: 0.85,
            metalness: 0.04
        });

        // Floor-to-Ceiling Conference Glass
        this.materials.glass = new THREE.MeshPhysicalMaterial({
            color: 0xe6f3ff,
            transparent: true,
            opacity: 0.30,
            roughness: 0.08,
            metalness: 0.15,
            transmission: 0.85,
            ior: 1.52
        });

        // Whiteboards
        this.materials.whiteboard = new THREE.MeshStandardMaterial({
            map: this.textures.whiteboard,
            roughness: 0.25,
            metalness: 0.05
        });

        // Command Center Server Video Wall
        this.materials.serverWall = new THREE.MeshStandardMaterial({
            map: this.textures.serverWall,
            emissiveMap: this.textures.serverWall,
            emissive: 0xffffff,
            emissiveIntensity: 0.85,
            roughness: 0.25,
            metalness: 0.4
        });

        // Monitors
        this.materials.monitorScreen = new THREE.MeshStandardMaterial({
            color: 0x0a1420,
            emissive: 0x0066aa,
            emissiveIntensity: 0.7,
            roughness: 0.2
        });

        this.materials.monitorPlastic = new THREE.MeshStandardMaterial({
            color: 0x181a1d,
            roughness: 0.5,
            metalness: 0.3
        });

        // Ergonomic Mesh Chair
        this.materials.meshChair = new THREE.MeshStandardMaterial({
            color: 0x1c2127,
            roughness: 0.85,
            metalness: 0.15
        });

        // Red Staircase Carpet
        this.materials.stairCarpet = new THREE.MeshStandardMaterial({
            color: 0x991b1b,
            roughness: 0.85,
            metalness: 0.05
        });

        // Silver Handrail
        this.materials.handrail = new THREE.MeshStandardMaterial({
            color: 0xd1d5db,
            roughness: 0.25,
            metalness: 0.9
        });

        // FirstBank Green Brand
        this.materials.fbGreen = new THREE.MeshStandardMaterial({
            color: 0x008850,
            roughness: 0.4,
            metalness: 0.2
        });

        // Filing Cabinet / Metal Pedestal
        this.materials.filingCabinet = new THREE.MeshStandardMaterial({
            color: 0x8e97a3,
            roughness: 0.38,
            metalness: 0.55
        });

        // Potted Plant Ceramic & Leaves
        this.materials.plantPot = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.3
        });
        this.materials.plantLeaves = new THREE.MeshStandardMaterial({
            color: 0x2e7d32,
            roughness: 0.6
        });
    }

    get(name) {
        return this.materials[name] || new THREE.MeshStandardMaterial({ color: 0x888888 });
    }
}

export const officeMaterials = new OfficeMaterials();
