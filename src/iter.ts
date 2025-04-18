import { None, Option } from './option.ts'
import { setInstanceFor } from './util.ts'

const filter = function* <T>(f: (t: T) => boolean, ts: Iterable<T>): Generator<T, void, unknown> {
    for (const t of ts) {
        if (f(t)) {
            yield t
        }
    }
}

const map = function* <T, T2>(f: (t: T) => T2, ts: Iterable<T>): Generator<T2, void, unknown> {
    for (const t of ts) {
        yield f(t)
    }
}

const zip = function* <T1, T2>(
    ts: Iterable<T1>,
    is: Iterable<T2>,
): Generator<readonly [T1, T2], void, unknown> {
    const genA = ts[Symbol.iterator]()
    const genB = is[Symbol.iterator]()
    let nextA = genA.next()
    let nextB = genB.next()
    while (!nextA.done && !nextB.done) {
        yield [nextA.value, nextB.value]
        nextA = genA.next()
        nextB = genB.next()
    }
}

const reduce = <T, R>(
    f: (r: R, t: T) => R,
    r: R,
    ts: Iterable<T>,
): R => {
    let res = r
    for (const t of ts) {
        res = f(r, t)
    }
    return res
}

const flatMap = function* <T, T2>(
    f: (t: T) => Iter<T2>,
    ts: Iterable<T>,
): Generator<T2, void, unknown> {
    for (const t of ts) {
        for (const t2 of f(t).valueOf()) {
            yield t2
        }
    }
}

const skip = function* <T>(n: number, ts: Iterable<T>): Generator<T, void, unknown> {
    let i = 0
    for (const t of ts) {
        if (n <= i++) {
            yield t
        }
    }
}

const take = function* <T>(n: number, ts: Iterable<T>): Generator<T, void, unknown> {
    let i = 0
    for (const t of ts) {
        if (n > i++) {
            yield t
        }
    }
}

const enumerate = function* <T>(ts: Iterable<T>): Generator<readonly [number, T], void, unknown> {
    let i = 0
    for (const t of ts) {
        yield [i++, t] as const
    }
}

const all = <T>(f: (t: T) => boolean, ts: Iterable<T>): boolean => {
    for (const t of ts) {
        if (!f(t)) return false
        continue
    }
    return true
}

const any = <T>(f: (t: T) => boolean, ts: Iterable<T>): boolean => {
    for (const t of ts) {
        if (f(t)) return true
        continue
    }
    return false
}

const count = (ts: Iterable<any>): number => {
    let count = 0
    for (const _ of ts) count++
    return count
}

/**
 * An `Iter` is a lazily evaluated iterator of a an iterable, inspired by rust iterators.
 * Being lazily evaluated is an advantage when for example long list is mapped and then the first item matching a predicate is picked.
 * @example In this example the `dbRowToModel` is only called for the first row where `notDeleted` returns `true`
 * ```typescript
 * const first = Iter.from(dbRows)
 *     .filter(notDeleted)
 *     .map(dbRowToModel)
 *     .first()
 * ```
 */
export type Iter<T> = {
    /**
     * Run the iter returning the first item it produces
     * @returns Some of the first item the iter produces, or None if the iter produces nothing
     */
    first: () => Option<NonNullable<T>>
    /**
     * Run the iter returning the last item it produces
     * @returns Some of the last item the iter produces, or None if the iter produces nothing
     */
    last: () => Option<NonNullable<T>>
    /**
     * Run the iter until the nth item is produced and return it
     * @param n 0-based
     * @returns Some of the nth item the iter produces, or None if the iter produces nothing
     */
    nth: (n: number) => Option<NonNullable<T>>
    /**
     * Run the iterator until any item produced does not match the predicate.
     * Note: if the iter contains no items, true is returned
     * @param f the predicate
     * @returns true if all items matches the predicate
     */
    all: (f: (t: T) => boolean) => boolean
    /**
     * Run the iterator until one item produced matches the predicate.
     * Note: if the iter contains no items, false is returned
     * @param f the predicate
     * @returns true if one item matches the predicate
     */
    any: (f: (t: T) => boolean) => boolean
    /**
     * Run the iter counting the number of items it produces
     * @returns the count of item the iterator produces
     */
    count: () => number
    /**
     * Create a new iter without the first n items
     * @param n number of items to skip
     * @returns An iter without the first n items
     */
    skip: (n: number) => Iter<T>
    /**
     * Create a new iter with only the first n items
     * @param n number of items to take
     * @returns An iter with only the first n items
     */
    take: (n: number) => Iter<T>
    /**
     * Create a new iter where each item is numbered.
     * Note the `i` is not necessarily the items index in the source iterable
     * @returns a new iter where each item is numbered
     */
    enumerate: () => Iter<readonly [i: number, t: T]>
    /**
     * Create a new iter where only items matching the predicate is produced
     * @param f the predicate
     * @returns a new iter where only items matching the predicate is produced
     */
    filter: (f: (t: T) => boolean) => Iter<T>
    /**
     * Create a new iter where each item is transformed using the callback `f`
     * @param f the transform function
     * @returns a new iter where each item is transformed using the callback `f`
     */
    map: <T2>(f: (t: T) => T2) => Iter<T2>
    /**
     * Create a new iter where each item produces a new iter using the callback, flattening the result into one iter
     * @param f the callback producing a new iter per item in this iter
     * @returns a new iter where each item produces a new iter using the callback, flattening the result into one iter
     */
    flatMap: <T2>(f: (t: T) => Iter<T2>) => Iter<T2>
    /**
     * Run the iter reducing each item produced into one result using the callback
     * @param f the callback function
     * @param r the initial result value
     * @returns the result of the operation
     */
    reduce: <R>(f: (r: R, t: T) => R, r: R) => R
    /**
     * Create a new iter where each item is paired with one from another iter. The resulting iter produces only as many items as the "shortest" iter.
     * @param i other iter to zip with
     * @returns a new iter where each item is paired
     */
    zip: <T2>(i: Iter<T2>) => Iter<readonly [T, T2]>
    /**
     * Run the iter, collecting all items produced into an array
     */
    toArray: () => T[]
    valueOf: () => Iterable<T>
    [Symbol.iterator]: () => Iterator<T, void, undefined>
    __proto__: null
}

const IterSymbol = Symbol('dots:iter')

/**
 * Create an iter from an init function that returns an iterable
 * @param init function to create an iterable
 * @returns `Iter<T>`
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
            all: (f) => all(f, init()),
            any: (f) => any(f, init()),
            count: () => count(init()),
            skip: (n) => Iter(() => skip<T>(n, init())),
            take: (n) => Iter(() => take<T>(n, init())),
            enumerate: () => Iter(() => enumerate<T>(init())),
            map: (f) => Iter(() => map(f, init())),
            flatMap: (f) => Iter(() => flatMap(f, init())),
            // flatMap: (f) => Iter(function*(){}),
            filter: (f) => Iter(() => filter(f, init())),
            zip: (i) => Iter(() => zip(init(), i.valueOf())),
            reduce: (f, r) => reduce(f, r, init()),
            toArray: () => [...init()],
            valueOf: () => init(),
            *[Symbol.iterator]() {
                for (const t of init()) {
                    yield t
                }
            },
            __proto__: null,
            // @ts-ignore hidden
            [IterSymbol]: true,
        } satisfies Iter<T>,
    )
}

/**
 * create an iter from an iterable
 * @param iterable any obj that implements `Symbol.iterator`
 * @returns `Iter<T>`
 */
Iter.from = <T>(iterable: Iterable<T>) => Iter(() => iterable)
setInstanceFor(Iter, IterSymbol)

/**
 * The unit constructor for iter
 */
Iter.of = <T>(item: T) =>
    Iter(function* () {
        yield item
    })
