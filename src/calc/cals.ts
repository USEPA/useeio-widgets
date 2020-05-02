export function zeros(len: number): number[] {
    return new Array(len).fill(0);
}

export function max(xs: number[]): number {
    if (!xs || xs.length === 0) {
        return 0;
    }
    return xs.reduce((maxval, x) => Math.max(maxval, x));
}
