/**
 * Simple object check.
 * From https://stackoverflow.com/a/34749873/772859
 */
export function isObject(item: any): item is object {
    return item && typeof item === 'object' && !Array.isArray(item)
}

export function isClassInstance(item: any): boolean {
    // Even if item is an object, it might not have a constructor as in the
    // case when it is a null-prototype object, i.e. created using `Object.create(null)`.
    return isObject(item) && item.constructor && item.constructor.name !== 'Object'
}
