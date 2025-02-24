export const isPromise = (p: unknown): p is Promise<unknown> =>
    p instanceof Promise || (
        p !== null &&
        typeof p === 'object' &&
        typeof (p as any)['then'] === 'function' &&
        typeof (p as any)['catch'] === 'function'
    )

export const isNonNullable = <T>(value: T): value is NonNullable<T> => value !== null && value !== undefined
