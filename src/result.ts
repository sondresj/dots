import { isNonNullable, isPromise } from './util.ts'
import { Option } from './option.ts'
import { Task } from './task.ts'

/**
 * The error when a result was created with a nullish value
 */
export class NullishResultValueError extends Error {
    /**
     * ctor, duh
     */
    constructor() {
        super('Result of nullish value')
    }
}

/**
 * Unwrapping a Result of the Err variant throws this error
 */
export class UnwrapResultError extends Error {
    /**
     * ctor, duh
     */
    constructor(msg?: string) {
        super(msg ?? 'Unwrapped a Result of Err')
    }
}

/**
 * The Result Monad, also known as the Either monad, is useful to represent results of fallible operations.
 */
export type Result<T, E = unknown> = {
    /**
     * Check if the Result is of the Ok variant
     * @returns true if this result is of the Ok variant
     */
    isOk: () => boolean
    /**
     * Safely unwrap the Result
     * @param cases Callbacks for each variant. Optionally return a value from either case.
     * @example import { ResultOf, identity } from 'jsr:@sj/dots'
     * const res = ResultOf(db.get(id))
     *   .map(transformRow)
     *   .switch({
     *       ok: identity,
     *       err: (e) => createItem()
     *   })
     */
    switch: <T1, T2>(cases: { ok: (t: NonNullable<T>) => T1; err: (err: E | null | undefined) => T2 }) => T1 | T2
    /**
     * Unwrap the Result
     * @param message an optional message to UnwrapResultError if the result is of the Err variant
     * @throws `UnwrapResultError`
     * @returns `NonNullable<T>` the value contained if the result is of the Ok variant. Otherwise an `UnwrapResultError` is thrown with the message provided
     */
    unwrap: (message?: string) => NonNullable<T>
    /**
     * Unwrap the result, providing a fallback value if the result is of the Err variant.
     * @param alt callback to create the fallback value if the result is of the Err variant
     */
    unwrapOr: (alt: () => NonNullable<T>) => NonNullable<T>
    /**
     * Transform the value of the result if it is of the Ok variant.
     * @param f the transform function
     * @returns a new Result if the result was of the Ok variant, otherwise the same instance of Err is returned
     */
    map: <T2>(f: (t: NonNullable<T>) => T2) => Result<NonNullable<T2>, E>
    /**
     * Transform this result, if it is of the Ok variant, to a new result
     * @param f the transform function
     * @returns the new result if this result was of the Ok variant, otherwise the same instance of Err is returned
     */
    flatMap: <T2>(f: (t: NonNullable<T>) => Result<NonNullable<T2>, E>) => Result<NonNullable<T2>, E>
    /**
     * Transform the error of the result if it is of the Err variant.
     * @param f the transform function
     * @returns a new Result if the result was of the Err variant, otherwise the same instance of Ok is returned
     */
    mapErr: <E2>(f: (e: E) => E2) => Result<NonNullable<T>, E2>
    /**
     * Convert this Result to an Option
     */
    some: () => Option<NonNullable<T>>
    /**
     * Convert this result to a Task
     */
    done: () => Task<NonNullable<T>, E>
    /**
     * Get a string representation of this Result.
     */
    toString: () => string
    [Symbol.iterator]: () => Iterator<Result<T, E>, T, any>
    __proto__: null
}

/**
 * Create a new Result with the value `t`.
 * @param t
 * @returns `Err(NullishResultValueError)` If `t` is null or undefined otherwise `Ok(t)`
 */
export const ResultOf = <T, E>(t: T): T extends Promise<infer R> ? Promise<Result<NonNullable<R>, E>> : Result<NonNullable<T>, E> => {
    if (isNonNullable(t)) {
        if (isPromise(t)) {
            return t.then(ResultOf).catch(Err) as any
        }
        return Ok(t) as any
    }
    return Err(new NullishResultValueError()) as any
}

/**
 * Create a new result of the Ok variant
 * @param t
 * @returns
 */
export const Ok = <T, E>(t: NonNullable<T>): Result<NonNullable<T>, E> => {
    const res: Result<NonNullable<T>, E> = {
        isOk: () => true,
        switch: (cases) => cases.ok(t),
        unwrap: () => t,
        unwrapOr: (_) => t,
        map: (f) => ResultOf(f(t)) as any,
        flatMap: (f) => f(t),
        mapErr: (_) => res as any,
        some: () => Option.some(t),
        done: () => Task.done(t),
        [Symbol.iterator]: function* () {
            return yield res
        },
        toString: () => `Ok(${JSON.stringify(t)})`,
        __proto__: null,
    }
    return Object.freeze(res)
}

/**
 * Create a new result of the Err variant
 */
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
        some: () => Option.none(),
        done: () => Task.fail(e),
        [Symbol.iterator]: function* () {
            return yield res
        },
        toString: () => `Err(${JSON.stringify(e)})`,
        __proto__: null,
    }
    return Object.freeze(res) as any
}

/**
 * Result group export
 * TODO: Examples
 *
 * @module
 */
export const Result = {
    of: ResultOf,
    err: Err,
    ok: Ok,
} as const
