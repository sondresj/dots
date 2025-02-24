import { errSym, ofSym, okSym, resultSym } from './symbols.ts'
import { isNonNullable, isPromise } from './util.ts'
import { None, type Option, Some } from './option.ts'
import { Done, Fail, type Task } from './task.ts'

export class NullishResultValueError extends Error {
    constructor() {
        super('Result of nullish value')
    }
}

export class UnwrapResultError extends Error {
    constructor(msg?: string) {
        super(msg ?? 'Unwrapped a Result of Err')
    }
}

export type Result<T, E = unknown> = {
    isOk: () => boolean
    switch: <T1, T2>(cases: { ok: (t: NonNullable<T>) => T1; err: (err: E | null | undefined) => T2 }) => T1 | T2
    unwrap: (message?: string) => NonNullable<T>
    unwrapOr: (alt: () => NonNullable<T>) => NonNullable<T>
    map: <T2>(f: (t: NonNullable<T>) => T2) => Result<NonNullable<T2>, E>
    flatMap: <T2>(f: (t: NonNullable<T>) => Result<NonNullable<T2>, E>) => Result<NonNullable<T2>, E> // FlatMapFn<T, E>
    mapErr: <E2>(f: (e: E) => E2) => Result<NonNullable<T>, E2>
    some: () => Option<NonNullable<T>>
    done: () => Task<NonNullable<T>, E>
    toString: () => string
    [resultSym]: true
    [okSym]?: true
    [errSym]?: true
    [ofSym]: <T, E>(t: T) => T extends Promise<infer R> ? Promise<Result<NonNullable<R>, E>> : Result<NonNullable<T>, E>
    [Symbol.iterator]: () => Iterator<Result<T, E>, T, any>
    __proto__: null
}

export const ResultOf = <T, E>(t: T): T extends Promise<infer R> ? Promise<Result<NonNullable<R>, E>> : Result<NonNullable<T>, E> => {
    if (isNonNullable(t)) {
        if (isPromise(t)) {
            return t.then(ResultOf).catch(Err) as any
        }
        return Ok(t) as any
    }
    return Err(new NullishResultValueError()) as any
}

export const Ok = <T, E>(t: NonNullable<T>): Result<NonNullable<T>, E> => {
    const res: Result<NonNullable<T>, E> = {
        isOk: () => true,
        switch: (cases) => cases.ok(t),
        unwrap: () => t,
        unwrapOr: (_) => t,
        map: (f) => ResultOf(f(t)) as any,
        flatMap: (f) => f(t),
        mapErr: (_) => res as any,
        some: () => Some(t),
        done: () => Done(t),
        [Symbol.iterator]: function* () {
            return (yield res) as any
        },
        toString: () => `Ok(${JSON.stringify(t)})`,
        [resultSym]: true,
        [okSym]: true,
        [ofSym]: ResultOf,
        __proto__: null,
    }
    return Object.freeze(res)
}

export const Err = <T, E>(e: E): Result<NonNullable<T>, E> => {
    const res: Result<NonNullable<T>, E> = {
        isOk: () => false,
        switch: (cases) => cases.err(e),
        unwrap: (m) => {
            throw new UnwrapResultError(m)
        },
        unwrapOr: (f) => f(),
        map: (_) => res as any,
        flatMap: () => res as any,
        mapErr: (f) => Err(f(e)),
        some: () => None(),
        done: () => Fail(e),
        [Symbol.iterator]: function* () {
            return (yield res) as any
        },
        toString: () => `Err(${JSON.stringify(e)})`,
        [resultSym]: true,
        [errSym]: true,
        [ofSym]: ResultOf,
        __proto__: null,
    }
    return Object.freeze(res) as any
}
