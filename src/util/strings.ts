export function compare(s1: string, s2: string): number {
    if (!s1 && !s2) {
        return 0;
    }
    if (!s1) {
        return -1;
    }
    if (!s2) {
        return 1;
    }
    return s1.toLowerCase().localeCompare(s2.toLowerCase());
}

export function search(s: string, term: string): number {
    if (!s) {
        return -1;
    }
    if (!term || term === "") {
        return 0;
    }
    return s.toLowerCase().indexOf(term.toLowerCase());
}

export function cut(s: string, length: number): string {
    if (!s) {
        return "";
    }
    if (s.length <= length) {
        return s;
    }
    if (length <= 3) {
        return s.substring(0, 3);
    }
    return s.substring(0, length - 3) + "...";
}

/**
 * Removes the given prefix from the given string if and only if the string
 * starts with that prefix. Otherwise it returns the unchanged string.
 */
export function trimPrefix(s: string, prefix: string): string {
    if (!s) {
        return "";
    }
    if (!prefix) {
        return s;
    }
    if (!s.startsWith(prefix)) {
        return s;
    }
    return s.substring(prefix.length);
}

/**
 * Returns true if the given string equals any of the given other strings. It
 * is case insensitive and ignores leading and trailing whitespaces.
 */
export function eq(s: string, ...others: string[]): boolean {
    if (!others) {
        return false;
    }
    if (s === "") {
        const i = others.findIndex(other => other === "");
        return i >= 0;
    }
    if (!s) {
        return false;
    }
    const first = s.trim().toLowerCase();
    const idx = others.findIndex(other => !other
        ? false
        : other.trim().toLowerCase() === first);
    return idx >= 0;
}

export function isNullOrEmpty(s: string): boolean {
    if (!s) {
        return true;
    }
    return s.trim().length === 0;
}

export function isNotEmpty(s: string): boolean{
    return !isNullOrEmpty(s);
}

export function isMember(x: string, xs: string[]): boolean {
    if (!xs) {
        return false;
    }
    return xs.indexOf(x) >= 0;
}
