import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

const library = new Map();
export async function loadHumanModels(onProgress = () => {}) {
    const loader = new GLTFLoader();
    for (const name of ['guillo', 'colleague', 'fernan']) {
        const asset = await loader.loadAsync(`/models/${name}.glb`);
        library.set(name, asset);
        onProgress(library.size / 3);
    }
}

export function createDetailedHuman(options = {}) {
    const isGuillo = options.faceTexturePath?.includes('guillo');
    const isFernan = options.faceTexturePath?.includes('fernan');
    const asset = library.get(isFernan ? 'fernan' : isGuillo ? 'guillo' : 'colleague');
    if (!asset) return null;
    const group = new THREE.Group();
    const body = clone(asset.scene);
    group.add(body);
    const bones = {};
    body.traverse(object => {
        if (object.isBone) bones[object.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()] = object;
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
            object.frustumCulled = false;
            object.material = object.material.clone();
            object.material.envMapIntensity = 0.45;
            if (object.material.map) object.material.map.anisotropy = 4;
        }
    });
    const find = name => {
        const bone = Object.entries(bones).find(([key]) => key.endsWith(name.toLowerCase()))?.[1];
        if (!bone) throw new Error(`Falta el hueso ${name} en el personaje`);
        return bone;
    };
    const mixer = new THREE.AnimationMixer(body);
    const actions = Object.fromEntries(asset.animations.map(clip => [clip.name, mixer.clipAction(clip)]));
    const head = find('Head');
    const model = {
        group, body, mixer, actions, detailed: true, currentAction: null,
        torsoGroup: find('Spine2'), headGroup: head, headMesh: null,
        leftArm: find('LeftArm'), rightArm: find('RightArm'),
        leftForearm: find('LeftForeArm'), rightForearm: find('RightForeArm'),
        leftLeg: find('LeftUpLeg'), rightLeg: find('RightUpLeg'),
        leftCalf: find('LeftLeg'), rightCalf: find('RightLeg'),
        update(state, time, speed) {
            const dt = this.lastTime === undefined ? 1 / 60 : Math.max(0, Math.min(0.1, time - this.lastTime));
            this.lastTime = time;
            // Hysteresis avoids switching clips repeatedly during acceleration.
            const running = speed > (this.currentAction === actions.Run ? 4.6 : 4.8);
            const name = state === 'run' ? (running ? 'Run' : 'Walk') : state === 'crouch' ? 'Crouch' : state === 'jump' ? 'Jump' : 'Idle';
            const action = actions[name] || actions.Idle;
            if (action && action !== this.currentAction) {
                const previous = this.currentAction;
                const locomotion = (action === actions.Walk || action === actions.Run) && (previous === actions.Walk || previous === actions.Run);
                const phase = locomotion ? previous.time / previous.getClip().duration : 0;
                action.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
                action.time = phase * action.getClip().duration;
                if (previous) action.crossFadeFrom(previous, 0.28, false);
                this.currentAction = action;
            }
            const targetRate = state === 'run' ? THREE.MathUtils.clamp(speed / (name === 'Run' ? 5.2 : 2.8), .35, 1.8) : 1;
            this.playbackRate = THREE.MathUtils.damp(this.playbackRate ?? targetRate, targetRate, 12, dt);
            if (action) action.timeScale = this.playbackRate;
            mixer.update(dt);
        }
    };
    model.update('idle', 0, 0);
    model.lastTime = undefined;
    // Keep accessories in character coordinates while following the head bone.
    const faceAnchor = new THREE.Group();
    faceAnchor.position.set(0, 1.62, 0.02);
    group.add(faceAnchor);
    group.updateMatrixWorld(true);
    head.attach(faceAnchor);
    model.faceAnchor = faceAnchor;
    return model;
}
