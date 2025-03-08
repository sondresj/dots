import { isNonNullable, isPromise, setInstanceFor } from './util.ts'
import { None, type Option, Some } from './option.ts'
import { Done, Fail, type Task } from './task.ts'

const ResultSymbol = Symbol('dots.result')
const OkSymbol = Symbol('dots.ok')
const ErrSymbol = Symbol('dots.err')

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
     * Check if the Result is Ok
     * @returns true if this result Ok
     */
    isOk: () => boolean
    /**
     * Check if the Result is Ok and matches the predicate
     * @param f predicate
     * @returns true if this result is Ok and the predicate returns true, otherwise false
     */
    isOkAnd: (f: (t: NonNullable<T>) => boolean) => boolean
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
export const Result = <T, E>(
    t: T,
): T extends Promise<infer R> ? Promise<Result<NonNullable<R>, E>> : Result<NonNullable<T>, E> => {
    if (isNonNullable(t)) {
        if (isPromise(t)) {
            return t.then(Result).catch(Err) as any
        }
        return Ok(t) as any
    }
    return Err(new NullishResultValueError()) as any
}
setInstanceFor(Result, ResultSymbol)

/**
 * Equivalent to Result(...)
 */
Result.of = Result

/**
 * Create a new result of the Ok variant
 * @param t
 * @returns Ok(t)
 */
export const Ok = <T, E>(t: NonNullable<T>): Result<NonNullable<T>, E> => {
    const res: Result<NonNullable<T>, E> = {
        isOk: () => true,
        isOkAnd: (f) => f(t),
        switch: (cases) => cases.ok(t),
        unwrap: () => t,
        unwrapOr: (_) => t,
        map: (f) => Result(f(t)) as any,
        flatMap: (f) => f(t),
        mapErr: (_) => res as any,
        some: () => Some(t),
        done: () => Done(t),
        *[Symbol.iterator]() {
            return yield res
        },
        toString: () => `Ok(${JSON.stringify(t)})`,
        __proto__: null,

        // @ts-ignore private
        [ResultSymbol]: true,
        [OkSymbol]: true,
    }
    return Object.freeze(res)
}
setInstanceFor(Ok, OkSymbol)

/**
 * Create a new result of the Err variant
 */
export const Err = <T, E>(e: E): Result<NonNullable<T>, E> => {
    const res: Result<NonNullable<T>, E> = {
        isOk: () => false,
        isOkAnd: (_) => false,
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
        *[Symbol.iterator]() {
            return yield res
        },
        toString: () => `Err(${JSON.stringify(e)})`,
        __proto__: null,

        // @ts-ignore private
        [ResultSymbol]: true,
        [ErrSymbol]: true,
    }
    return Object.freeze(res)
}
setInstanceFor(Err, ErrSymbol)
