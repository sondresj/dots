export const isPromise = (p: unknown): p is Promise<unknown> =>
    p instanceof Promise || (
        p !== null &&
        typeof p === 'object' &&
        typeof p['then'] === 'function' &&
        typeof p['catch'] === 'function'
    )

export const isNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined
