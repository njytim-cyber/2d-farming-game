export class Perlin {
    private perm: number[] = [];

    constructor() {
        this.seed(Math.random());
    }

    seed(seed: number) {
        this.perm = new Array(512);
        const p = new Array(256).fill(0).map((_, i) => i);

        // Shuffle
        for (let i = 255; i > 0; i--) {
            const r = Math.floor((seed * (i + 1) * 123.456) % (i + 1));
            [p[i], p[r]] = [p[r], p[i]];
        }

        // Duplicate for overflow
        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
        }
    }

    private fade(t: number): number {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    private lerp(t: number, a: number, b: number): number {
        return a + t * (b - a);
    }

    private grad(hash: number, x: number, y: number, z: number): number {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * 2D Noise
     * @param x coordinate
     * @param y coordinate
     * @returns value between -1 and 1
     */
    noise(x: number, y: number): number {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.perm[X] + Y;
        const AA = this.perm[A];
        const AB = this.perm[A + 1];
        const B = this.perm[X + 1] + Y;
        const BA = this.perm[B];
        const BB = this.perm[B + 1];

        // 2D noise uses only x, y. z=0.
        // grad takes (hash, x, y, z).
        return this.lerp(v,
            this.lerp(u,
                this.grad(this.perm[AA], x, y, 0),
                this.grad(this.perm[BA], x - 1, y, 0)
            ),
            this.lerp(u,
                this.grad(this.perm[AB], x, y - 1, 0),
                this.grad(this.perm[BB], x - 1, y - 1, 0)
            )
        );
    }
}

export const perlin = new Perlin();
