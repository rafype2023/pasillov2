import * as THREE from 'three';

/**
 * Photorealistic Office & FirstBank 1130 Data Center PBR Materials Engine
 * Combines authentic photographic textures (/assets/carpet_texture_seamless.png, /assets/plano_map.png)
 * with procedural textures extracted from the real office photos (cub1..5, IMG_2245, IMG_2843, IMG_4361, IMG_9457, conf)
 * and the 3D Gaussian Splatting scan (version 2/3DGS.ply - FirstBank 1130 Data Center).
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

        // 2. Authentic Whiteboard 1: "1- Payment Collection | 2- PROD-Claims | 3- Casos de Angel | 11-16-2025" (cub1, cub4, cub5)
        this.textures.whiteboard = this.createWhiteboardPaymentTexture();

        // 3. Authentic Whiteboard 2: Team List "1. H. Lopez, 2. J. Beauchamp, 3. K. Cruz..." (IMG_9457)
        this.textures.whiteboardTeam = this.createWhiteboardTeamTexture();

        // 4. Authentic Whiteboard 3: "BDB 74000..74004" Network Architecture Diagram (cub2)
        this.textures.whiteboardBDB = this.createWhiteboardBDBTexture();

        // 5. Authentic Whiteboard 4: "Hasta cuando dura el CardReader del Parking?" (conf.png)
        this.textures.whiteboardParking = this.createWhiteboardParkingTexture();

        // 6. High-Tech Multi-Screen Server Video Wall & Column Telemetry Monitors (cub1, cub3, IMG_9457)
        this.textures.serverWall = this.createServerTelemetryTexture();

        // 7. Suspended Acoustic Ceiling Tile Grid
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

        // 8. 1130 Data Center 60cm x 60cm Raised Access Floor Tile Texture (from 3DGS.ply)
        this.textures.dcRaisedFloor = this.createDataCenterFloorTexture();

        // 9. 1130 Data Center Server Rack Front Mesh & Telemetry LEDs (from 3DGS.ply & IMG_2245)
        this.textures.serverRackFront = this.createServerRackFrontTexture();

        // 10. 1130 Data Center 3D Poster taped inside Rafael Perez's cubicle (IMG_2245 & cub1)
        this.textures.dcPoster = this.createDataCenterPosterTexture();

        // 11. 1130 Data Center East Wall Stenciled Grid Letters ("AS  AR  AQ  AP  AO  AN" from ply_cam_east.png)
        this.textures.dcWallGrid = this.createDataCenterWallGridTexture();
    }

    createWhiteboardPaymentTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 384;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 384);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 376);

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 21px "Inter", sans-serif';
        ctx.fillText('1- Payment Collection', 24, 48);
        ctx.fillText('2- PROD-Claims', 24, 84);
        ctx.fillText('3- Casos de Angel', 24, 120);
        ctx.fillText('4- Diagrama E-Loan', 24, 156);
        ctx.fillText('5- BDB', 24, 192);
        ctx.fillText('6- Tipo de Cambio', 24, 228);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('11-16-2025', 325, 48);
        ctx.fillText('11:59:59', 340, 78);

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        ctx.strokeRect(330, 105, 145, 55);
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('Viernes 8am', 342, 138);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('02135', 345, 250);
        ctx.fillText('03105', 345, 285);

        return new THREE.CanvasTexture(c);
    }

    createWhiteboardTeamTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 384;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 384);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 376);

        const names = [
            '1. H. Lopez',
            '2. J. Beauchamp',
            '3. K. Cruz',
            '4. M. Mercado',
            '5. S. Quiñones',
            '6. L. Reyes',
            '7. J. Espinoza',
            '8. K. RAMIREZ',
            '9. G. Pantojas'
        ];
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px sans-serif';
        names.forEach((n, idx) => {
            ctx.fillText(n, 26, 44 + idx * 36);
        });

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('11-16-2025', 320, 52);
        ctx.fillText('11:59:59', 335, 84);
        ctx.fillStyle = '#dc2626';
        ctx.fillText('Viernes 8am', 325, 140);

        return new THREE.CanvasTexture(c);
    }

    createWhiteboardBDBTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 320;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 320);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 314);

        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 26px sans-serif';
        ctx.fillText('BDB', 22, 38);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(110, 45, 95, 65);
        ctx.strokeRect(245, 45, 95, 65);
        ctx.strokeRect(175, 150, 110, 70);
        ctx.beginPath();
        ctx.moveTo(205, 80); ctx.lineTo(245, 80);
        ctx.moveTo(160, 110); ctx.lineTo(210, 150);
        ctx.moveTo(290, 110); ctx.lineTo(250, 150);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.font = '16px monospace';
        ['74000 - Core', '74001 - Auth', '74002 - API', '74003 - Sync', '74004 - Bus'].forEach((line, i) => {
            ctx.fillText(line, 365, 50 + i * 28);
        });

        return new THREE.CanvasTexture(c);
    }

    createWhiteboardParkingTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 384;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 384);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 376);

        ctx.fillStyle = '#1e3a8a';
        ctx.font = 'italic bold 20px sans-serif';
        ctx.fillText('¿Hasta cuándo dura el CardReader del Parking?', 20, 42);

        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 20px monospace';
        ctx.fillText('GH - Opening + 5', 28, 90);
        ctx.fillText('FR - O + 15', 28, 130);
        ctx.fillText('Open + 1 A', 28, 170);
        ctx.fillText('NL Ofic + 3', 28, 210);
        ctx.fillText('Opening + 7 -> K', 28, 250);
        ctx.fillText('AA + 30', 28, 290);

        return new THREE.CanvasTexture(c);
    }

    createServerTelemetryTexture() {
        const srvCanvas = document.createElement('canvas');
        srvCanvas.width = 1024;
        srvCanvas.height = 512;
        const sCtx = srvCanvas.getContext('2d');
        sCtx.fillStyle = '#050b14';
        sCtx.fillRect(0, 0, 1024, 512);

        const cols = 2;
        const sw = 1024 / cols;
        const sh = 512;

        for (let c = 0; c < cols; c++) {
            const x = c * sw;
            sCtx.fillStyle = '#091322';
            sCtx.fillRect(x + 8, 8, sw - 16, sh - 16);
            sCtx.strokeStyle = '#1e3a5f';
            sCtx.lineWidth = 4;
            sCtx.strokeRect(x + 8, 8, sw - 16, sh - 16);

            sCtx.fillStyle = '#008850';
            sCtx.fillRect(x + 16, 16, sw - 32, 38);
            sCtx.fillStyle = '#ffffff';
            sCtx.font = 'bold 20px monospace';
            sCtx.fillText(c === 0 ? 'FIRSTBANK 1130 DATA CENTER - GRID A' : 'ENTERPRISE ARCHITECTURE TELEMETRY', x + 28, 42);

            const cellCols = 6;
            const cellRows = 7;
            const cw = (sw - 48) / cellCols;
            const ch = (sh - 90) / cellRows;
            for (let r = 0; r < cellRows; r++) {
                for (let k = 0; k < cellCols; k++) {
                    const cx = x + 24 + k * cw;
                    const cy = 68 + r * ch;
                    const isWarn = (r === 2 && k === 4) || (r === 5 && k === 1);
                    sCtx.fillStyle = isWarn ? '#eab308' : ((r + k) % 3 === 0 ? '#16a34a' : '#15803d');
                    sCtx.fillRect(cx + 3, cy + 3, cw - 6, ch - 6);
                    sCtx.fillStyle = '#052e16';
                    sCtx.fillRect(cx + 6, cy + 20, cw - 12, ch - 26);
                    sCtx.fillStyle = '#86efac';
                    sCtx.font = 'bold 11px monospace';
                    sCtx.fillText(`BJ-${(r * 6 + k + 1).toString().padStart(2, '0')}`, cx + 10, cy + 16);
                }
            }
        }
        return new THREE.CanvasTexture(srvCanvas);
    }

    createDataCenterFloorTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = 'rgba(156, 163, 175, 0.25)';
        for (let i = 0; i < 600; i++) {
            ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
        }

        const step = 128;
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 3;
        for (let i = 0; i <= 512; i += step) {
            ctx.beginPath();
            ctx.moveTo(i, 0); ctx.lineTo(i, 512);
            ctx.moveTo(0, i); ctx.lineTo(512, i);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(5, 7);
        return tex;
    }

    createServerRackFrontTexture() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 512;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#d1d5db';
        ctx.fillRect(0, 0, 256, 512);

        ctx.fillStyle = '#18181b';
        ctx.fillRect(22, 12, 212, 488);

        for (let y = 28; y < 480; y += 22) {
            ctx.fillStyle = '#27272a';
            ctx.fillRect(30, y, 196, 16);
            ctx.strokeStyle = '#09090b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(30, y, 196, 16);

            ctx.fillStyle = (y % 66 === 0) ? '#38bdf8' : '#22c55e';
            ctx.fillRect(38, y + 5, 6, 6);
            ctx.fillRect(50, y + 5, 6, 6);
            if (y % 44 === 0) {
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(190, y + 5, 24, 5);
            }
        }

        return new THREE.CanvasTexture(c);
    }

    createDataCenterPosterTexture() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 384;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 512, 384);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.strokeRect(18, 16, 140, 36);
        ctx.fillStyle = '#008850';
        ctx.fillRect(22, 20, 72, 28);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('1 First', 28, 39);
        ctx.fillStyle = '#0f172a';
        ctx.fillText('Bank', 102, 39);

        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#1e293b';
        ctx.fillText('1130 DATA CENTER', 20, 68);

        ctx.fillStyle = '#d9f99d';
        ctx.fillRect(18, 80, 476, 22);
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 13px monospace';
        ['BL', 'BJ', 'BI', 'BH', 'BG', 'BF', 'BE', 'BD'].forEach((col, i) => {
            ctx.fillText(col, 30 + i * 56, 96);
        });

        ctx.fillStyle = '#64748b';
        ctx.fillRect(24, 108, 464, 248);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(160, 118, 318, 228);

        for (let r = 0; r < 4; r++) {
            for (let k = 0; k < 5; k++) {
                const rx = 60 + r * 95;
                const ry = 132 + k * 40;
                ctx.fillStyle = r === 0 ? '#e2e8f0' : '#1e293b';
                ctx.fillRect(rx, ry, 52, 30);
                ctx.strokeStyle = '#0f172a';
                ctx.strokeRect(rx, ry, 52, 30);
            }
        }

        ctx.fillStyle = '#86efac';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('BJ-07', 58, 175);
        ctx.fillText('BJ-15', 58, 275);

        return new THREE.CanvasTexture(c);
    }

    createDataCenterWallGridTexture() {
        const c = document.createElement('canvas');
        c.width = 1024;
        c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#e8e8e4';
        ctx.fillRect(0, 0, 1024, 128);

        ctx.fillStyle = '#18181b';
        ctx.font = 'bold 54px monospace';
        const cols = ['AS', 'AR', 'AQ', 'AP', 'AO', 'AN', 'AM'];
        cols.forEach((label, idx) => {
            ctx.fillText(label, 45 + idx * 140, 82);
        });

        return new THREE.CanvasTexture(c);
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
            metalness: 0.0,
            color: 0xc2c0ba
        });

        // 2. Acoustic Cubicle Fabric Weave
        const fabricCanvas = document.createElement('canvas');
        fabricCanvas.width = fabricCanvas.height = 128;
        const fabricContext = fabricCanvas.getContext('2d');
        fabricContext.fillStyle = '#c4beb0'; fabricContext.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 128; i += 2) {
            fabricContext.fillStyle = i % 4 ? '#bdb7aa' : '#cbc5b8';
            fabricContext.fillRect(i, 0, 1, 128);
            fabricContext.fillStyle = 'rgba(90,85,75,.10)';
            fabricContext.fillRect(0, i, 128, 1);
        }
        const fabricTex = new THREE.CanvasTexture(fabricCanvas);
        fabricTex.wrapS = THREE.RepeatWrapping;
        fabricTex.wrapT = THREE.RepeatWrapping;
        fabricTex.repeat.set(3, 2);
        fabricTex.colorSpace = THREE.SRGBColorSpace;
        fabricTex.anisotropy = 16;

        this.materials.cubicleFabric = new THREE.MeshStandardMaterial({
            map: fabricTex,
            roughness: 0.90,
            metalness: 0.02,
            color: 0xcdc8bd
        });

        // Brushed Aluminum Cubicle Trim & Framing
        this.materials.cubicleTrim = new THREE.MeshStandardMaterial({
            color: 0xa8b0b8,
            roughness: 0.35,
            metalness: 0.75
        });

        // Central Cable Spine Cap
        this.materials.spineCap = new THREE.MeshStandardMaterial({
            color: 0xa6a39b,
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

        // Terracotta / Rose-Red Central Stairwell Core Walls (Plano2.png & scene_level3.png)
        this.materials.stairWall = new THREE.MeshStandardMaterial({
            color: 0xb86b64,
            roughness: 0.75,
            metalness: 0.05
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

        // Whiteboards (4 authentic variants from office photos)
        this.materials.whiteboard = new THREE.MeshStandardMaterial({
            map: this.textures.whiteboard,
            roughness: 0.25,
            metalness: 0.05
        });
        this.materials.whiteboardTeam = new THREE.MeshStandardMaterial({
            map: this.textures.whiteboardTeam,
            roughness: 0.25,
            metalness: 0.05
        });
        this.materials.whiteboardBDB = new THREE.MeshStandardMaterial({
            map: this.textures.whiteboardBDB,
            roughness: 0.25,
            metalness: 0.05
        });
        this.materials.whiteboardParking = new THREE.MeshStandardMaterial({
            map: this.textures.whiteboardParking,
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

        // 1130 Data Center Raised Access Floor Material
        this.materials.dcRaisedFloor = new THREE.MeshStandardMaterial({
            map: this.textures.dcRaisedFloor,
            roughness: 0.55,
            metalness: 0.12
        });

        // 1130 Data Center Server Rack Front Material
        this.materials.serverRackFront = new THREE.MeshStandardMaterial({
            map: this.textures.serverRackFront,
            emissiveMap: this.textures.serverRackFront,
            emissive: 0xffffff,
            emissiveIntensity: 0.35,
            roughness: 0.4,
            metalness: 0.5
        });

        // 1130 Data Center Poster Material
        this.materials.dcPoster = new THREE.MeshStandardMaterial({
            map: this.textures.dcPoster,
            roughness: 0.35,
            metalness: 0.05
        });

        // 1130 Data Center East Wall Stenciled Grid Material
        this.materials.dcWallGrid = new THREE.MeshStandardMaterial({
            map: this.textures.dcWallGrid,
            roughness: 0.8,
            metalness: 0.05
        });

        // Warm Oak Wood Door Material (1130 Data Center Double Doors in ply_cam_west.png)
        this.materials.woodDoor = new THREE.MeshStandardMaterial({
            color: 0xb57c4a,
            roughness: 0.48,
            metalness: 0.08
        });

        // Industrial CRAC / Liebert HVAC Unit Brown/Grey Cabinet (ply_cam_south.png)
        this.materials.cracUnit = new THREE.MeshStandardMaterial({
            color: 0x6e6259,
            roughness: 0.55,
            metalness: 0.45
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
            color: 0xa6a39b,
            roughness: 0.38,
            metalness: 0.55
        });

        this.materials.loungeFabric = new THREE.MeshStandardMaterial({ color: 0x596345, roughness: 0.96 });
        this.materials.oliveChair = this.materials.loungeFabric;
        this.materials.trashBin = new THREE.MeshStandardMaterial({ color: 0x171917, roughness: 0.85 });

        this.materials.confTableWood = new THREE.MeshStandardMaterial({
            map: this.textures.deskWood,
            color: 0xd8b892,
            roughness: 0.32,
            metalness: 0.1
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

        // Splat.ply Office Details: Green Buffet Tablecloth, Red Heart Balloons, Cumpleaños & Valores Wall Badges, and Red EXIT Sign
        this.materials.greenTablecloth = new THREE.MeshStandardMaterial({
            color: 0x165b33,
            roughness: 0.78,
            metalness: 0.05
        });

        this.materials.redBalloon = new THREE.MeshStandardMaterial({
            color: 0xdc2626,
            roughness: 0.18,
            metalness: 0.35
        });

        this.materials.exitSignRed = new THREE.MeshStandardMaterial({
            color: 0xff2222,
            emissive: 0xff1111,
            emissiveIntensity: 1.2,
            roughness: 0.3
        });

        // Round Red "CUMPLEAÑOS" Wall Badge (splat_cam_lounge_north.png)
        const cumpCanvas = document.createElement('canvas');
        cumpCanvas.width = 256; cumpCanvas.height = 256;
        const cCtx = cumpCanvas.getContext('2d');
        cCtx.fillStyle = '#991b1b';
        cCtx.beginPath(); cCtx.arc(128, 128, 122, 0, Math.PI * 2); cCtx.fill();
        cCtx.strokeStyle = '#fca5a5'; cCtx.lineWidth = 10;
        cCtx.beginPath(); cCtx.arc(128, 128, 110, 0, Math.PI * 2); cCtx.stroke();
        cCtx.fillStyle = '#ffffff'; cCtx.font = 'bold 28px sans-serif'; cCtx.textAlign = 'center';
        cCtx.fillText('FELIZ', 128, 105);
        cCtx.fillText('CUMPLEAÑOS', 128, 148);
        const cumpTex = new THREE.CanvasTexture(cumpCanvas);
        cumpTex.colorSpace = THREE.SRGBColorSpace;
        this.materials.cumpleanosBadge = new THREE.MeshStandardMaterial({ map: cumpTex, roughness: 0.4 });

        // Round Blue "VALORES" Wall Badge (splat_cam_lounge_north.png)
        const valCanvas = document.createElement('canvas');
        valCanvas.width = 256; valCanvas.height = 256;
        const vCtx = valCanvas.getContext('2d');
        vCtx.fillStyle = '#0284c7';
        vCtx.beginPath(); vCtx.arc(128, 128, 122, 0, Math.PI * 2); vCtx.fill();
        vCtx.strokeStyle = '#bae6fd'; vCtx.lineWidth = 10;
        vCtx.beginPath(); vCtx.arc(128, 128, 110, 0, Math.PI * 2); vCtx.stroke();
        vCtx.fillStyle = '#ffffff'; vCtx.font = 'bold 28px sans-serif'; vCtx.textAlign = 'center';
        vCtx.fillText('NUESTROS', 128, 108);
        vCtx.fillText('VALORES', 128, 148);
        const valTex = new THREE.CanvasTexture(valCanvas);
        valTex.colorSpace = THREE.SRGBColorSpace;
        this.materials.valoresBadge = new THREE.MeshStandardMaterial({ map: valTex, roughness: 0.4 });
    }

    get(name) {
        return this.materials[name] || this.materials.wall;
    }
}

export const officeMaterials = new OfficeMaterials();
