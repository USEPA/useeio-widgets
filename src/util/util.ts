/**
 * A simple `string -> T` map type. We compile to `ES5` and thus do not
 * use https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map
 */
export type TMap<T> = { [key: string]: T };

/**
 * Returns true if the given object is `null` or `undefined`.
 */
export function isNone<T>(obj?: T | null | undefined): obj is null | undefined {
    return typeof obj === "undefined" || obj === null;
}

export function isNoneOrEmpty<T>(array?: T[] | null | undefined):
    array is null | undefined | [] {
    return isNone(array) || array.length === 0;
}

export function isNotEmpty<T>(array: T[]): boolean {
    return !isNoneOrEmpty(array);
}

/**
 * Returns true if the given object is not `null` or undefined.
 */
export function isNotNone<T>(obj?: T | null | undefined): obj is T {
    return !isNone(obj);
}

/**
 * Returns the given object if it is not `null` or `undefined`. Otherwise it
 * returns the given default value which may also be a function that computes
 * the default value.
 */
export function ifNone<T>(
    obj: T | null | undefined, defaultValue: T | (() => T)): T {
    if (!isNone(obj)) {
        return obj;
    }
    if (typeof defaultValue === "function") {
        const fn = defaultValue as () => T;
        return fn();
    }
    return defaultValue;
}
