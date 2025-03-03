import { isNonNullable } from './util.ts'
import { Result } from './result.ts'
import { Task } from './task.ts'

/**
 * Unwrapping an Option of the None variant throws this error
 */
export class UnwrapNoneError extends Error {
    /**
     * ctor, duh
     */
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
     * @param cases Callbacks for each variant. Optionally return a value from either case.
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
     * @param message an optional message to UnwrapNoneError if the option is of the None variant
     * @throws `UnwrapNoneError`
     * @returns `NonNullable<T>` the value contained if the option is of the Some variant. Otherwise an `UnwrapNoneError` is thrown with the message provided
     */
    unwrap: (message?: string) => NonNullable<T>
    /**
     * Unwrap the option, providing a fallback value if the option is of the None variant.
     * @param alt callback to create the fallback value if the option is of the None variant
     */
    unwrapOr: (alt: () => T) => NonNullable<T>
    /**
     * Transform the value of the option if it is of the Some variant.
     * @param f the transform function
     * @returns a new Option if the option was of the Some variant, otherwise the same instance of None is returned
     */
    map: <T2>(f: (t: NonNullable<T>) => T2) => Option<NonNullable<T2>>
    /**
     * Transform this option, if it is of the Somevariant, to a new option
     * @param f the transform function
     * @returns the new option if this option was of the Some variant, otherwise the same instance of None is returned
     */
    flatMap: <T2>(f: (t: NonNullable<T>) => Option<NonNullable<T2>>) => Option<NonNullable<T2>>
    /**
     * Combine this option with another option
     * @param t2 the other option
     * @returns a new Option if both options where of the Some variant, otherwise the same instance of None is returned
     */
    zip: <T2>(t2: Option<T2>) => Option<readonly [T, T2]>
    /**
     * Convert this option to a Result
     * @param f callback to create the Error if this option i of the None variant
     */
    okOr: <E>(f: () => E) => Result<NonNullable<T>, E>
    /**
     * Convert this option to a Task
     * @param f the callback to create an error value for the Failed task if this option is of the None variant
     * @returns a Done task if this option is of the Some variant, otherwise a Fail task will be created using the callback
     */
    done: <E>(f: () => E) => Task<NonNullable<T>, E>
    /**
     * Get a string representation of this Option.
     */
    toString: () => string
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
        okOr: (_) => Result.ok(t),
        done: (_) => Task.done(t),
        toString: () => `Some(${JSON.stringify(t)})`,

        [Symbol.iterator]: function* () {
            return yield opt
        },
        __proto__: null,
    }
    return Object.freeze(opt)
}

const _none: Option<NonNullable<any>> = Object.freeze({
    isSome: () => false,
    switch: (c) => c.none(),
    unwrap: (m) => {
        throw new UnwrapNoneError(m)
    },
    unwrapOr: (f) => f(),
    map: (_) => _none as any,
    flatMap: (_) => _none as any,
    zip: (_) => _none as any,
    okOr: (f) => Result.err(f()),
    done: (f) => Task.fail(f()),
    toString: () => 'None',

    [Symbol.iterator]: function* () {
        return yield _none
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

/**
 * Option group export
 * TODO: Examples
 *
 * @module
 */
export const Option = {
    of: OptionOf,
    none: None,
    some: Some,
} as const
