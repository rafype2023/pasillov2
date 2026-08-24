import { sounds } from '../audio/SoundEffects.js';

export class HUD {
    constructor(game) {
        this.game = game;
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
        this.missionTime = 15 * 60; // 15:00 countdown timer
        this.modalActive = false;

        this.planoImg = new Image();
        this.planoImg.src = '/assets/plano_map.png';

        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('btn-mute')?.addEventListener('click', () => {
            const muted = sounds.toggleMute();
            const btn = document.getElementById('btn-mute');
            if (btn) btn.innerText = muted ? '🔇 Silenciado' : '🔊 Sonido';
        });

        document.getElementById('btn-skin')?.addEventListener('click', () => {
            if (this.game.player) {
                this.game.player.toggleSkin();
                this.updateSkinButton();
            }
        });

        document.getElementById('btn-cam')?.addEventListener('click', () => {
            if (this.game.player) {
                this.game.player.toggleCameraMode();
                this.updateCamButton();
            }
        });

        document.getElementById('btn-restart')?.addEventListener('click', () => {
            this.hideModal();
            this.game.restartLevel();
        });

        document.getElementById('btn-next-level')?.addEventListener('click', () => {
            this.hideModal();
            this.game.nextLevel();
        });

        document.getElementById('btn-menu')?.addEventListener('click', () => {
            this.hideModal();
            this.game.showMenu();
        });
    }

    updateSkinButton() {
        const btn = document.getElementById('btn-skin');
        const badge = document.getElementById('hud-skin-badge');
        if (this.game.player) {
            const isCyber = this.game.player.currentSkin === 'cyber';
            if (btn) btn.innerText = isCyber ? '👔 Skin: Humano' : '🤖 Skin: Cyber';
            if (badge) badge.innerText = isCyber ? '⚡ Cyber Android' : '👔 Humano Casual';
        }
    }

    updateCamButton() {
        const btn = document.getElementById('btn-cam');
        if (btn && this.game.player) {
            const mode = this.game.player.cameraMode;
            if (mode === 'isometric') btn.innerText = '🎥 Vista: Isométrica';
            else if (mode === 'third') btn.innerText = '🎥 Vista: 3ra Persona';
            else btn.innerText = '👁️ Vista: 1ra Persona';
        }
    }

    update(levelIndex, currentLevel, player) {
        if (!player || !currentLevel) return;

        // Skin & Level tag
        this.updateSkinButton();
        const levelTag = document.getElementById('hud-level-tag');
        if (levelTag) levelTag.innerText = `LEVEL ${levelIndex + 1}`;

        // Timer update
        const timerEl = document.getElementById('hud-timer-val');
        if (timerEl && levelIndex !== 0) {
            const mins = Math.floor(this.missionTime / 60);
            const secs = Math.floor(this.missionTime % 60);
            timerEl.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        const healthBar = document.getElementById('hud-health-bar');
        const healthLabel = document.getElementById('hud-health-label');
        const healthVal = document.getElementById('hud-health-val');

        const staminaBar = document.getElementById('hud-stamina-bar');
        const staminaLabel = document.getElementById('hud-stamina-label');
        const staminaVal = document.getElementById('hud-stamina-val');

        const chaosLabel = document.getElementById('hud-chaos-label');
        const statusSub = document.getElementById('hud-status-subtitle');

        if (levelIndex === 0) { // COVID
            const infVal = Math.round(player.infection);
            const healthPct = Math.max(0, 100 - infVal);
            if (healthBar) healthBar.style.width = `${healthPct}%`;
            if (healthLabel) healthLabel.innerText = player.isMasked ? 'MASK IMMUNITY' : 'HEALTH';
            if (healthVal) healthVal.innerText = `${healthPct}%`;

            if (staminaBar) staminaBar.style.width = `${Math.round(player.stamina)}%`;
            if (staminaLabel) staminaLabel.innerText = 'STAMINA';
            if (staminaVal) staminaVal.innerText = `${Math.round(player.stamina)}%`;

            // 45-Second Safe Place Relocation Countdown
            const timeLeft = Math.ceil(currentLevel.safeRelocateTimer || 45);
            if (timerEl) timerEl.innerText = `00:${timeLeft.toString().padStart(2, '0')}`;
            if (chaosLabel) chaosLabel.innerText = `CAMBIO EN ${timeLeft}s`;
            if (statusSub) statusSub.innerText = `ESTACIÓN: ${currentLevel.currentLocationName || 'Lounge'} (45s)`;
        } else if (levelIndex === 1) { // Lounge Race
            const stam = Math.round(player.stamina);
            if (healthBar) healthBar.style.width = `100%`;
            if (healthLabel) healthLabel.innerText = 'ENERGY';
            if (healthVal) healthVal.innerText = `100%`;

            if (staminaBar) staminaBar.style.width = `${stam}%`;
            if (staminaLabel) staminaLabel.innerText = (player.boostTimer > 0) ? 'TURBO BOOST' : 'STAMINA';
            if (staminaVal) staminaVal.innerText = `${stam}%`;

            if (!currentLevel.raceStarted) {
                if (chaosLabel) chaosLabel.innerText = `SALIDA EN ${Math.ceil(currentLevel.countdown)}s`;
                if (statusSub) statusSub.innerText = `¡PREPÁRATE PARA CORRER AL BUFFET!`;
            } else {
                const medal = currentLevel.getRankMedal ? currentLevel.getRankMedal(currentLevel.rank) : '🥇';
                if (chaosLabel) chaosLabel.innerText = `${medal} POSICIÓN: ${currentLevel.rank}º / 4`;
                if (statusSub) statusSub.innerText = `TIEMPO: ${(currentLevel.raceTime || 0).toFixed(1)}s | META: BREAKROOM LOUNGE`;
            }
        } else if (levelIndex === 2) { // Active Shooter Evacuation (Archer Threat)
            const hp = Math.max(0, Math.round(player.health));
            const stam = Math.max(0, Math.round(player.stamina));
            if (healthBar) healthBar.style.width = `${hp}%`;
            if (healthLabel) healthLabel.innerText = player.isCrouching ? 'HEALTH (AGACHADO / A COBIJO)' : 'HEALTH (VIDA)';
            if (healthVal) healthVal.innerText = `${hp}%`;

            if (staminaBar) staminaBar.style.width = `${stam}%`;
            if (staminaLabel) staminaLabel.innerText = 'STAMINA';
            if (staminaVal) staminaVal.innerText = `${stam}%`;

            const hits = currentLevel.hitsReceived || 0;
            const headstart = Math.ceil(currentLevel.headstartTimer || 0);

            if (headstart > 0) {
                if (chaosLabel) chaosLabel.innerText = `⏳ VENTAJA: ${headstart}s`;
                if (statusSub) statusSub.innerText = `¡TIENES ${headstart}s PARA MOVERTE Y BUSCAR COBIJO!`;
            } else {
                if (chaosLabel) chaosLabel.innerText = `FLECHAZOS: ${hits}/4`;
                const rescued = currentLevel.rescuedColleagues || 0;
                if (statusSub) statusSub.innerText = `COMPAÑEROS RESCATADOS: ${rescued}/3 | ESCALERAS DE EMERGENCIA`;
            }
        }

        // Inventory slots update
        const countEl = document.getElementById('carrying-count');
        if (countEl) countEl.innerText = `${player.carryingCount || 0}/8`;

        // Update slots visuals
        const slotBoxes = document.querySelectorAll('.slot-box');
        slotBoxes.forEach((box, idx) => {
            if (idx < (player.carryingCount || 0)) {
                box.classList.add('active-slot');
            } else {
                box.classList.remove('active-slot');
            }
        });

        // 2. Draw Dynamic Minimap
        this.drawMinimap(levelIndex, currentLevel, player);
    }

    drawMinimap(levelIndex, currentLevel, player) {
        if (!this.minimapCtx || !this.minimapCanvas) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        // Dark Blueprint Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        // Draw Authentic Floorplan Map Image (/assets/plano_map.png)
        if (this.planoImg && this.planoImg.complete && this.planoImg.naturalWidth > 0) {
            ctx.globalAlpha = 0.60;
            ctx.drawImage(this.planoImg, 4, 4, w - 8, h - 8);
            ctx.globalAlpha = 1.0;
        }

        const mapX = (x) => ((x + 28) / 56) * (w - 16) + 8;
        const mapY = (z) => ((z + 20) / 40) * (h - 16) + 8;

        // Central Spine (Highlighted in Red CAD zone matching reference image)
        const spineX1 = mapX(-3.0);
        const spineX2 = mapX(3.0);
        const spineY1 = mapY(-9);
        const spineY2 = mapY(9);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
        ctx.fillRect(spineX1, spineY1, spineX2 - spineX1, spineY2 - spineY1);

        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(spineX1, spineY1, spineX2 - spineX1, spineY2 - spineY1);

        // Draw Player position as a pulsing white beacon
        const px = mapX(player.position.x);
        const py = mapY(player.position.z);
        const pulse = 3 + Math.sin(Date.now() * 0.01) * 1.5;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, pulse + 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(px, py, 3.5, 0, Math.PI * 2);
        ctx.fill();
    }

    showVictory(levelIndex, currentLevel) {
        if (this.modalActive) return;
        this.modalActive = true;

        const modal = document.getElementById('modal-gameover');
        if (!modal) return;

        let title = '¡Misión Cumplida!';
        let message = 'Has completado el objetivo con éxito.';
        let score = '';

        if (levelIndex === 0) {
            title = '¡Llegaste a la Estación Segura!';
            message = 'Guillo logró descontaminarse y esquivar a los infectados de COVID-19.';
            score = `Infección: ${Math.round(this.game.player.infection)}% | ¡Zona Segura Alcanzada!`;
        } else if (levelIndex === 1) {
            const rank = currentLevel.rank || 1;
            const medal = currentLevel.getRankMedal ? currentLevel.getRankMedal(rank) : '🥇';
            title = `${medal} ¡${rank}º Lugar en el Buffet!`;
            message = `Guillo cruzó la meta del Lounge en ${currentLevel.raceTime.toFixed(1)} segundos.`;

            if (currentLevel.leaderboard && currentLevel.leaderboard.length > 0) {
                const rankingText = currentLevel.leaderboard.map((r, i) => {
                    const place = i + 1;
                    const m = place === 1 ? '🥇' : (place === 2 ? '🥈' : (place === 3 ? '🥉' : '🏃'));
                    const timeStr = r.finishTime ? `${r.finishTime.toFixed(1)}s` : 'En carrera';
                    return `${m} ${place}º ${r.name} (${timeStr})`;
                }).join('<br>');
                score = `<div style="text-align: left; background: rgba(0,0,0,0.5); padding: 0.8rem; border-radius: 8px; margin-top: 0.5rem; line-height: 1.6;">${rankingText}</div>`;
            }
        } else if (levelIndex === 2) {
            title = '¡Evacuación Exitosa!';
            message = 'Guillo esquivó los flechazos, rescató a sus compañeros y escapó por las escaleras de emergencia.';
            score = `Compañeros Rescatados: ${currentLevel.rescuedColleagues || 3}/3 | Escaleras Despejadas`;
        }

        modal.style.display = 'flex';
        document.getElementById('modal-title').innerHTML = `🎉 ${title}`;
        document.getElementById('modal-title').style.color = '#e6be6d';
        document.getElementById('modal-message').innerHTML = message;
        document.getElementById('modal-score').innerHTML = score;
        document.getElementById('btn-next-level').style.display = 'inline-block';
    }

    showGameOver(levelIndex, currentLevel) {
        if (this.modalActive) return;
        this.modalActive = true;

        const modal = document.getElementById('modal-gameover');
        if (!modal) return;

        let title = '¡Misión Fallida!';
        let message = 'No lograste completar el objetivo.';

        if (levelIndex === 0) {
            title = '¡Infectado por COVID-19!';
            message = 'Los estornudos sobrepasaron a Guillo y agotaron su resistencia.';
        } else if (levelIndex === 1) {
            title = '¡Te quedaste sin snacks!';
            message = 'No lograste llegar a tiempo al buffet del breakroom.';
        } else if (levelIndex === 2) {
            title = '¡Alcanzado por los Flechazos!';
            message = 'Guillo recibió 4 flechazos y no pudo llegar a las escaleras de evacuación.';
        }

        modal.style.display = 'flex';
        document.getElementById('modal-title').innerHTML = `💥 ${title}`;
        document.getElementById('modal-title').style.color = '#e8637c';
        document.getElementById('modal-message').innerHTML = message;
        document.getElementById('modal-score').innerHTML = '';
        document.getElementById('btn-next-level').style.display = 'none';
    }

    hideModal() {
        this.modalActive = false;
        const modal = document.getElementById('modal-gameover');
        if (modal) modal.style.display = 'none';
    }
}
