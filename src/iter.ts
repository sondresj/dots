import { None, Option } from './option.ts'
import { setInstanceFor } from './util.ts'

const filter = <T>(f: (t: T) => boolean) => {
    return function* (ts: Iterable<T>): Generator<T, void, unknown> {
        for (const t of ts) {
            if (f(t)) {
                yield t
            }
        }
    }
}

const map = <T, T2>(f: (t: T) => T2) => {
    return function* (ts: Iterable<T>): Generator<T2, void, unknown> {
        for (const t of ts) {
            yield f(t)
        }
    }
}

const reduce = <T, R>(f: (r: R, t: T) => R, r: R) => {
    return (ts: Iterable<T>): R => {
        let res = r
        for (const t of ts) {
            res = f(r, t)
        }
        return res
    }
}

const flatMap = <T, T2>(f: (t: T) => Iter<T2>) => {
    return function* (ts: Iterable<T>): Generator<T2, void, unknown> {
        for (const t of ts) {
            for (const t2 of f(t)) {
                yield t2
            }
        }
    }
}

const skip = <T>(n: number) => {
    return function* (ts: Iterable<T>): Generator<T, void, unknown> {
        let i = 0
        for (const t of ts) {
            if (n <= i++) {
                yield t
            }
        }
    }
}

const take = <T>(n: number) => {
    return function* (ts: Iterable<T>): Generator<T, void, unknown> {
        let i = 0
        for (const t of ts) {
            if (n > i++) {
                yield t
            }
        }
    }
}

const enumerate = <T>() => {
    return function* (ts: Iterable<T>): Generator<readonly [number, T], void, unknown> {
        let i = 0
        for (const t of ts) {
            yield [i++, t] as const
        }
    }
}

export type Iter<T> = {
    first: () => Option<NonNullable<T>>
    last: () => Option<NonNullable<T>>
    nth: (n: number) => Option<NonNullable<T>>
    skip: (n: number) => Iter<T>
    take: (n: number) => Iter<T>
    enumerate: () => Iter<readonly [i: number, t: T]>
    filter: (f: (t: T) => boolean) => Iter<T>
    map: <T2>(f: (t: T) => T2) => Iter<T2>
    flatMap: <T2>(f: (t: T) => Iter<T2>) => Iter<T2>
    reduce: <R>(f: (r: R, t: T) => R, r: R) => R
    toArray: () => T[]
    [Symbol.iterator]: () => Iterator<T, Iter<T>, any>
    __proto__: null
}

const IterSymbol = Symbol('dots:iter')

/**
 * An `Iter` is a lazily evaluated iterator of a an iterable, inspired by rust iterators.
 * @param init the factory function to create the initial iterable
 * @returns a lazy iter
 */
export const Iter = <T>(init: () => Iterable<T>): Iter<T> => {
    return Object.freeze(
        {
            first: () => {
                for (const t of init()) {
                    return Option(t)
                }
                return None()
            },
            last: () => {
                let r = null as T | null
                for (const t of init()) {
                    r = t
                }
                return Option(r)
            },
            nth: (n) => {
                let i = 0
                for (const t of init()) {
                    if (n === i++) {
                        return Option(t)
                    }
                }
                return None()
            },
            skip: (n) => Iter(() => skip<T>(n)(init())),
            take: (n) => Iter(() => take<T>(n)(init())),
            enumerate: () => Iter(() => enumerate<T>()(init())),
            map: (f) => Iter(() => map(f)(init())),
            flatMap: (f) => Iter(() => flatMap(f)(init())),
            filter: (f) => Iter(() => filter(f)(init())),
            reduce: (f, r) => reduce(f, r)(init()),
            toArray: () => [...init()],
            *[Symbol.iterator]() {
                for (const t of init()) {
                    yield t
                }
                return this
            },
            __proto__: null,
            // @ts-ignore hidden
            [IterSymbol]: true,
        } satisfies Iter<T>,
    )
}
Iter.from = <T>(iterable: Iterable<T>) => Iter(() => iterable)
setInstanceFor(Iter, IterSymbol)
