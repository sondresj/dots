import { isNonNullable } from './util.ts'
import { Err, Ok, type Result } from './result.ts'
import { Done, Fail, type Task } from './task.ts'

export class UnwrapOptionError extends Error {
    constructor(msg?: string) {
        super(msg ?? 'Unwrapped an Option of None')
    }
}

/**
 * The Option type can either hold a value (`Some(value)`) or hold nothing (`None()`), represented by Some or None respectively.
 * Useful as a functional alternative to represent `null`
 * Option is also known as Maybe
 */
export type Option<T> = {
    /**
     * Returns `true` if this option is the `Some` variant, otherwise `false`
     */
    isSome: () => boolean
    /**
     * Safely unwrap the option
     * @param cases Callbacks for each variant. Optionally return a value from either variant of the option.
     * @example import { OptionOf, identity } from 'jsr:@sj/dots'
     * const item = OptionOf(array.get(idx))
     *   .map(transformItem)
     *   .switch({
     *       some: identity,
     *       none: () => createItem()
     *   })
     */
    switch: <T1, T2>(cases: { some: (t: NonNullable<T>) => T1; none: () => T2 }) => T1 | T2
    /**
     * Unwrap the Option
     * @param message an optional message to UnwrapOptionError if the option is of the None variant
     * @throws {UnwrapOptionError}
     * @returns {NonNullable<T>} the value contained if the option is of the Some variant. Otherwise an {UnwrapOptionError} is thrown with the message provided
     */
    unwrap: (message?: string) => NonNullable<T>
    unwrapOr: (alt: () => T) => NonNullable<T>
    map: <T2>(f: (t: NonNullable<T>) => T2) => Option<NonNullable<T2>>
    flatMap: <T2>(f: (t: NonNullable<T>) => Option<NonNullable<T2>>) => Option<NonNullable<T2>>
    zip: <T2>(t2: Option<T2>) => Option<readonly [T, T2]>
    okOr: <E>(f: () => E) => Result<NonNullable<T>, E>
    done: () => Task<NonNullable<T>, Error>
    toString: () => string
    of: <T>(t: T) => Option<NonNullable<T>>
    [Symbol.iterator]: () => Iterator<Option<T>, T, any>
    __proto__: null
}

/**
 * Create an `Option<T>`
 * @param t the option value.
 * @returns `Some(t)` if `t` is not `null` or `undefined`, otherwise `None`
 */
export const OptionOf = <T>(t: T): Option<NonNullable<T>> => isNonNullable(t) ? Some(t) : None()

/**
 * Create an Option of the Some variant
 * @param t the value of the Option
 * @returns an Option of the Some variant containing the value `t`
 */
export const Some = <T>(t: NonNullable<T>): Option<NonNullable<T>> => {
    const opt: Option<NonNullable<T>> = {
        isSome: () => true,
        switch: (c) => c.some(t),
        unwrap: (_) => t,
        unwrapOr: (_) => t,
        map: (f) => OptionOf(f(t)),
        flatMap: (f) => f(t),
        zip: (t2) => t2.map((t2) => [t, t2] as const) as any,
        okOr: (_) => Ok(t),
        done: () => Done(t),
        toString: () => `Some(${JSON.stringify(t)})`,
        of: OptionOf,
        [Symbol.iterator]: function* () {
            return (yield opt) as any
        },
        __proto__: null,
    }
    return Object.freeze(opt)
}

const _none: Option<NonNullable<any>> = Object.freeze({
    isSome: () => false,
    switch: (c) => c.none(),
    unwrap: (m) => {
        throw new UnwrapOptionError(m)
    },
    unwrapOr: (f) => f(),
    map: (_) => _none as any,
    flatMap: (_) => _none as any,
    zip: (_) => _none as any,
    okOr: (f) => Err(f()),
    done: () => Fail(new Error('Option was None')),
    toString: () => 'None',
    of: OptionOf,
    [Symbol.iterator]: function* () {
        return (yield _none) as any
    },
    __proto__: null,
})

/**
 * Create an Option of the None variant.
 * @returns An Option of the None variant. Note, this is always returns the _same_ None instance
 */
export const None = <T>(): Option<NonNullable<T>> => {
    return _none as any
}
