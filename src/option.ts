import { noneSym, ofSym, optionSym, someSym } from './symbols.ts'
import { isNonNullable } from './util.ts'
import { Err, Ok, type Result } from './result.ts'
import { Done, Fail, type Task } from './task.ts'

export class UnwrapOptionError extends Error {
    constructor(msg?: string) {
        super(msg ?? 'Unwrapped an Option of None')
    }
}

export type Option<T> = {
    isSome: () => boolean
    switch: <T1, T2>(cases: { some: (t: NonNullable<T>) => T1; none: () => T2 }) => T1 | T2
    unwrap: (message?: string) => NonNullable<T>
    unwrapOr: (alt: () => T) => NonNullable<T>
    map: <T2>(f: (t: NonNullable<T>) => T2) => Option<NonNullable<T2>>
    flatMap: <T2>(f: (t: NonNullable<T>) => Option<NonNullable<T2>>) => Option<NonNullable<T2>>
    ok: () => Result<NonNullable<T>, Error>
    okOr: <E>(f: () => E) => Result<NonNullable<T>, E>
    done: () => Task<NonNullable<T>, Error>
    toString: () => string
    [optionSym]: true
    [someSym]?: true
    [noneSym]?: true
    [ofSym]: <T>(t: T) => Option<NonNullable<T>>
    [Symbol.iterator]: () => Iterator<Option<T>, T, any>
    __proto__: null
}

export const OptionOf = <T>(t: T): Option<NonNullable<T>> => isNonNullable(t) ? Some(t) : None()

export const Some = <T>(t: NonNullable<T>): Option<NonNullable<T>> => {
    const opt: Option<NonNullable<T>> = {
        isSome: () => true,
        switch: (c) => c.some(t),
        unwrap: (_) => t,
        unwrapOr: (_) => t,
        map: (f) => OptionOf(f(t)),
        flatMap: (f) => f(t),
        ok: () => Ok(t),
        okOr: (_) => Ok(t),
        done: () => Done(t),
        toString: () => `Some(${JSON.stringify(t)})`,
        [optionSym]: true,
        [someSym]: true,
        [ofSym]: OptionOf,
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
    ok: () => Err(new Error('Option was None')),
    okOr: (f) => Err(f()),
    done: () => Fail(new Error('Option was None')),
    toString: () => 'None',
    [optionSym]: true,
    [noneSym]: true,
    [ofSym]: OptionOf,
    [Symbol.iterator]: function* () {
        return (yield _none) as any
    },
    __proto__: null,
})

export const None = <T>(): Option<NonNullable<T>> => {
    return _none as any
}
