import * as THREE from 'three';
import { FloorPlan } from './office/FloorPlan.js';
import { Player } from './entities/Player.js';
import { ParticleSystem } from './entities/Particles.js';
import { CovidLevel } from './levels/CovidLevel.js';
import { LoungeRaceLevel } from './levels/LoungeRaceLevel.js';
import { ActiveShooterLevel } from './levels/ActiveShooterLevel.js';
import { HUD } from './ui/HUD.js';
import { sounds } from './audio/SoundEffects.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');
        this.currentLevelIndex = 0;
        this.selectedPendingLevel = 0;
        this.clock = new THREE.Clock();

        this.initThree();
        this.initScene();
        this.initUI();
        this.initIntroVideo();
    }

    initThree() {
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.12;
        this.container.appendChild(this.renderer.domElement);

        // Scene & Camera
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x181e28);

        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 150);

        // Ambient Office Light (Warm soft corporate ambient)
        this.ambientLight = new THREE.AmbientLight(0xfff8ee, 0.95);
        this.scene.add(this.ambientLight);

        // Overhead Key Light along the Spine
        this.dirLight = new THREE.DirectionalLight(0xffeedd, 1.4);
        this.dirLight.position.set(0, 18, 6);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 60;
        this.dirLight.shadow.camera.left = -25;
        this.dirLight.shadow.camera.right = 25;
        this.dirLight.shadow.camera.top = 25;
        this.dirLight.shadow.camera.bottom = -25;
        this.dirLight.shadow.bias = -0.0004;
        this.scene.add(this.dirLight);

        // Fill Light East (Command Center / Glass room)
        const fillEast = new THREE.DirectionalLight(0xddeeff, 0.8);
        fillEast.position.set(16, 12, -2);
        this.scene.add(fillEast);

        // Fill Light West (Manager pods)
        const fillWest = new THREE.DirectionalLight(0xfff0dd, 0.7);
        fillWest.position.set(-16, 12, -2);
        this.scene.add(fillWest);

        // Resize handler
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    initScene() {
        // Floor Plan & 3D Office Environment
        this.floorPlan = new FloorPlan(this.scene);

        // Particles
        this.particles = new ParticleSystem(this.scene);

        // Player (Guillo)
        this.player = new Player(this.scene, this.camera, this.renderer.domElement);

        // Levels
        this.levels = [
            new CovidLevel(this.scene, this.floorPlan, this.particles, this.player),
            new LoungeRaceLevel(this.scene, this.floorPlan, this.particles, this.player),
            new ActiveShooterLevel(this.scene, this.floorPlan, this.particles, this.player)
        ];

        // HUD & Minimap
        this.hud = new HUD(this);

        // Start render loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initIntroVideo() {
        const videoOverlay = document.getElementById('intro-video-overlay');
        const video = document.getElementById('intro-video');
        const btnSkip = document.getElementById('btn-skip-intro');
        const btnAudio = document.getElementById('btn-video-audio');
        const btnWatchIntro = document.getElementById('btn-watch-intro');

        if (!videoOverlay || !video) return;

        const closeVideo = () => {
            try { video.pause(); } catch (e) {}
            videoOverlay.style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        };

        btnSkip?.addEventListener('click', (e) => {
            e.stopPropagation();
            closeVideo();
        });

        btnAudio?.addEventListener('click', (e) => {
            e.stopPropagation();
            video.muted = !video.muted;
            btnAudio.innerText = video.muted ? '🔇 Activar Audio' : '🔊 Audio Activado';
        });

        video.addEventListener('ended', closeVideo);

        video.onerror = () => {
            console.warn('Video failed to load - closing overlay');
            closeVideo();
        };

        btnWatchIntro?.addEventListener('click', () => {
            document.getElementById('main-menu').style.display = 'none';
            videoOverlay.style.display = 'flex';
            video.currentTime = 0;
            video.muted = false;
            if (btnAudio) btnAudio.innerText = '🔊 Audio Activado';
            sounds.init();
            video.play().catch(err => {
                console.warn('Video playback notice:', err);
                video.muted = true;
                if (btnAudio) btnAudio.innerText = '🔇 Activar Audio';
                video.play().catch(() => {});
            });
        });

        // Autoplay on startup with muted fallback for browser policy
        video.muted = true;
        sounds.init();
        video.play().catch(err => {
            console.warn('Autoplay notice:', err);
        });
    }

    initUI() {
        // Level selection cards -> Opens Level Intro Screen Briefing Modal
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const lvl = parseInt(card.getAttribute('data-level'), 10);
                this.showLevelIntroScreen(lvl);
            });
        });

        // Level Intro Modal buttons
        const btnIntroStart = document.getElementById('btn-intro-start');
        const btnIntroBack = document.getElementById('btn-intro-back');

        btnIntroStart?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('level-intro-modal').style.display = 'none';
            this.startLevel(this.selectedPendingLevel);
        });

        btnIntroBack?.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('level-intro-modal').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        });
    }

    showLevelIntroScreen(levelIndex) {
        this.selectedPendingLevel = levelIndex;
        document.getElementById('main-menu').style.display = 'none';

        const modal = document.getElementById('level-intro-modal');
        const img = document.getElementById('level-intro-img');
        const badge = document.getElementById('level-intro-badge');
        const title = document.getElementById('level-intro-title');
        const desc = document.getElementById('level-intro-desc');

        const levelData = [
            {
                badge: 'NIVEL 1',
                img: '/v2_assets/scene_level1.png',
                title: 'NIVEL 1: ESCAPE DE CUBÍCULOS (COVID-19)',
                desc: 'Evita a los infectados que estornudan activamente hacia ti. Esquiva el aerosol viral, recoge mascarillas N95 y desinfectante, y corre hacia la estación segura que cambia cada 45 segundos.'
            },
            {
                badge: 'NIVEL 2',
                img: '/v2_assets/scene_level2.png',
                title: 'NIVEL 2: CARRERA AL BUFFET',
                desc: '¡Hay picadera y desayuno de cumpleaños en el lounge! Corre por los pasillos contra Fernan (que se cae cómicamente), Alejandro (riéndose con su celular) y Hector para llegar primero a la mesa de snacks.'
            },
            {
                badge: 'NIVEL 3',
                img: '/v2_assets/scene_level3.png',
                title: 'NIVEL 3: HUYE HACIA LA SALIDA',
                desc: '¡Alarma de emergencia activada! Tienes 8 segundos de ventaja para posicionarte. Agáchate detrás de los cubículos para protegerte de las flechas (4 flechazos te eliminan), rescata a tus compañeros y escapa por las escaleras.'
            }
        ];

        const data = levelData[levelIndex] || levelData[0];
        if (badge) badge.innerText = data.badge;
        if (img) img.src = data.img;
        if (title) title.innerText = data.title;
        if (desc) desc.innerText = data.desc;

        modal.style.display = 'flex';
        sounds.init();
    }

    startLevel(index) {
        // Cleanup previous
        if (this.currentLevel) {
            this.currentLevel.cleanup();
        }
        this.particles.clear();
        this.hud.hideModal();

        this.currentLevelIndex = index;
        this.currentLevel = this.levels[index];

        // Hide Menu and Intro Modal, Show Game HUD
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('level-intro-modal').style.display = 'none';
        document.getElementById('game-hud').style.display = 'block';

        // Update Level Title Banner
        const titles = [
            '🦠 Nivel 1: Escape de Cubículos (COVID-19)',
            '🏃 Nivel 2: Carrera al Buffet (Breakroom)',
            '🚨 Nivel 3: Huye hacia la Salida (Evacuación)'
        ];
        const objectives = [
            'Navega los cubículos, recolecta mascarillas N95 y llega a la Estación Segura (cambia cada 45s).',
            '¡Corre al lounge contra Fernan, Alejandro y Hector! Agarra café para turbo velocidad y llega primero al buffet.',
            '¡Alarma activada! Tienes 8s de ventaja. Agáchate detrás de los cubículos, rescata a tus compañeros y sal por las escaleras.'
        ];

        document.getElementById('hud-level-title').innerText = titles[index];
        document.getElementById('hud-objective-text').innerText = objectives[index];

        // Start the level logic
        this.currentLevel.start();
        sounds.init();
    }

    restartLevel() {
        this.startLevel(this.currentLevelIndex);
    }

    nextLevel() {
        if (this.currentLevel) {
            this.currentLevel.cleanup();
            this.currentLevel = null;
        }
        document.getElementById('game-hud').style.display = 'none';
        const nextIdx = (this.currentLevelIndex + 1) % this.levels.length;
        this.hud.hideModal();
        this.showLevelIntroScreen(nextIdx);
    }

    showMenu() {
        if (this.currentLevel) {
            this.currentLevel.cleanup();
            this.currentLevel = null;
        }
        document.getElementById('game-hud').style.display = 'none';
        document.getElementById('level-intro-modal').style.display = 'none';
        this.hud.hideModal();
        document.getElementById('main-menu').style.display = 'flex';
    }

    animate() {
        requestAnimationFrame(this.animate);

        const delta = Math.min(this.clock.getDelta(), 0.1);

        // Update Player
        if (this.player) {
            this.player.update(delta, this.floorPlan.colliders);
        }

        // Update Current Level
        if (this.currentLevel && !this.currentLevel.isComplete && !this.currentLevel.isFailed) {
            this.currentLevel.update(delta, this.camera);
        }

        // Update Particles
        if (this.particles) {
            this.particles.update(delta);
        }

        // Update HUD
        if (this.hud && this.currentLevel && this.player) {
            this.hud.update(this.currentLevelIndex, this.currentLevel, this.player);

            // Check Win / Lose Conditions
            if (this.currentLevel.isComplete) {
                this.hud.showVictory(this.currentLevelIndex, this.currentLevel);
            } else if (this.currentLevel.isFailed) {
                this.hud.showGameOver(this.currentLevelIndex, this.currentLevel);
            }
        }

        // Render Scene
        this.renderer.render(this.scene, this.camera);
    }
}

// Instantiate Game reliably
function startApp() {
    if (!window.game) {
        window.game = new Game();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}
