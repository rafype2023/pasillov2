# FBPR Piso 3 - Office Chronicles 🎮

A 3D browser-based isometric game recreating the FirstBank Floor 3 (Piso 3) office environment based on architectural blueprints (`plano.heic`) and authentic office reference photos.

Inspired by Matt Wolfe's 3D roguelite development style, featuring **Guillo** as the main protagonist alongside custom colleagues (**Fernan**, **Alejandro**, and **Hector**) across three unique gameplay modes.

---

## 🌟 Game Highlights

- **1:1 3D Floor Plan**: Cubicle clusters, executive offices, conference rooms, breakroom lounge, and 3 emergency stairwells.
- **Elevated 3/4 Isometric Perspective**: Top-down view with mouse wheel zoom (`0.6x`–`1.8x`), `Q`/`E` camera rotation, and toggleable 3rd & 1st person views.
- **Directional Lighting & Shadows**: Sunlight casting long, realistic floor shadows across authentic carpet tiles.
- **Sound Engine**: Procedural Web Audio API sound effects for footsteps, sneezes, laughter, sirens, and jingles.
- **Dynamic Minimap**: Live radar tracking player position, NPCs, and dynamic beacons.

---

## 👥 Character Roster

- **Guillo (Protagonist)**: Agile office hero with sprint, crouch behind cubicles, and powerup mechanics.
- **Fernan**: Colleague who is *always falling* (trips and falls with comedic physics and recovery).
- **Alejandro**: Colleague who is *always laughing* (laughs with animated "😂 Jajaja" floating emoji bubbles and sound cues).
- **Hector**: Fast coworker navigating shortcuts and assisting the team.

---

## 🕹️ Game Levels

### 🦠 Level 1: Brote de COVID-19 (Aerosol Evasion)
- **Active Sneezer Pursuit**: Sick workers in red actively track and approach Guillo to sneeze green viral clouds at him.
- **Stamina & Infection**: Sneeze exposure drains Guillo's stamina, slowing him down when exhausted and increasing viral load.
- **Randomized 45-Second Safe Station**: The decontamination safe station spawns in random sectors and relocates every 45 seconds.
- **Powerups**: Hand sanitizers (+45 stamina, -35% viral load) and N95 face masks (12s aerosol immunity).

### 🏃 Level 2: La Gran Carrera al Lounge (Snack Dash)
- **Lounge Race**: Dash to the breakroom birthday buffet table (`IMG_2843`) against Fernan, Alejandro, and Hector.
- **Turbo Boosts**: Grab coffee mugs for +35% speed boosts and manage sprint stamina to claim 1st place.

### 🚨 Level 3: Evacuación de Emergencia (Active Shooter / Evacuation)
- **Stealth & Cover**: Crouch (`C` key) behind 5-foot cubicle dividers to break line of sight and avoid hostile detection.
- **Escort & Escape**: Rescue colleagues and lead them safely out of the floor via the 3 emergency exit stairwells from the evacuation blueprint.

---

## ⌨️ Controls

| Action | Control |
| :--- | :--- |
| **Move** | `W`, `A`, `S`, `D` or `Arrow Keys` |
| **Sprint** | `Shift` (consumes Stamina) |
| **Crouch** | `C` or `Left Ctrl` (stealth behind cubicles) |
| **Rotate Camera** | `Q` / `E` |
| **Zoom** | `Mouse Wheel` |
| **Toggle Camera Mode** | `V` (Isometric / 3rd Person / 1st Person) |

---

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rafype2023/pasillov2.git
   cd pasillov2
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Production Build**:
   ```bash
   npm run build
   ```
