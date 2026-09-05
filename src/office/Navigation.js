import * as THREE from 'three';

// A fixed grid gives racers the same accessible corridors as the player.
export class Navigation {
    constructor(colliders) {
        this.width = 109; this.depth = 73; this.step = 0.5;
        this.free = new Uint8Array(this.width * this.depth);
        const box = new THREE.Box3();
        const size = new THREE.Vector3(0.8, 1.7, 0.8);
        for (let z = 0; z < this.depth; z++) for (let x = 0; x < this.width; x++) {
            const point = this.point(z * this.width + x); point.y = 0.85;
            box.setFromCenterAndSize(point, size);
            this.free[z * this.width + x] = !colliders.some(c => c.intersectsBox(box));
        }
    }
    point(index) {
        return new THREE.Vector3(-27 + index % this.width * this.step, 0, -18 + Math.floor(index / this.width) * this.step);
    }
    nearest(point) {
        let result = -1, distance = Infinity;
        for (let i = 0; i < this.free.length; i++) if (this.free[i]) {
            const d = this.point(i).distanceToSquared(point);
            if (d < distance) { distance = d; result = i; }
        }
        return result;
    }
    route(from, to) {
        const start = this.nearest(from), goal = this.nearest(to);
        if (start < 0 || goal < 0) return [];
        const previous = new Int32Array(this.free.length).fill(-1);
        const queue = [start]; previous[start] = start;
        for (let head = 0; head < queue.length && previous[goal] < 0; head++) {
            const current = queue[head], x = current % this.width, z = Math.floor(current / this.width);
            for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx=x+dx, nz=z+dz, next=nz*this.width+nx;
                if(nx<0||nx>=this.width||nz<0||nz>=this.depth||!this.free[next]||previous[next]>=0) continue;
                previous[next]=current; queue.push(next);
            }
        }
        if (previous[goal] < 0) return [];
        const path=[];
        for(let i=goal;;i=previous[i]) { path.push(i); if(i===start)break; }
        path.reverse();
        return path.filter((i,n)=>n===0||n===path.length-1||i-path[n-1]!==path[n+1]-i).map(i=>this.point(i));
    }
}
