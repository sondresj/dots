/**
 * Check if `p` is a Promise or is Promise-like
 * @param p
 * @returns `true` if `p` is Promise-like
 */
export const isPromise = (p: unknown): p is Promise<unknown> =>
    p instanceof Promise || (
        p !== null &&
        typeof p === 'object' &&
        typeof (p as any)['then'] === 'function' &&
        typeof (p as any)['catch'] === 'function'
    )

/**
 * Check if `value` is not null or undefined
 * @param value
 * @returns `true` if `value` is not null or undefined
 */
export const isNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined

/**
 * The identity is just itself, ie: x => x
 */
export const identity = <T>(t: T): T => t
