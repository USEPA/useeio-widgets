
export function select<T>(elems: T[], config: { page: number, count: number }): T[] {
    if (!elems) {
        return [];
    }
    if (!config) {
        return elems;
    }
    const count = config.count;
    if (!count) {
        return [];
    }
    if (count < 0) {
        return elems;
    }
    let page = config.page;
    if (!page || page < 1) {
        page = 1;
    }

    const start = (page - 1) * count;
    if (start > (elems.length - 1)) {
        return [];
    }
    const end = Math.min(start + count, elems.length);
    return elems.slice(start, end);
}