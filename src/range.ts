import { Iter } from './iter.ts'
import { None, Option, Some } from './option.ts'
import { setInstanceFor } from './util.ts'

const RangeSymbol = Symbol('dots.range')

/**
 * A single slice of a range as yielded from Range.slice
 */
export type Slice<ATag, BTag> = [ATag] extends [never] ? Range<readonly Range<BTag>[]>
    : Range<readonly [ATag, ...Range<BTag>[]]>

/**
 * Represents a range defined by a start and an end value, where the start is inclusive
 * and the end is exclusive.
 *
 * The range can optionally be tagged with a value.
 *
 * A range can be categorized as either
 * `'normal'` => `start < end`
 * `'point'` => `start === end`
 * `'inverted'` => `start > end`
 *
 * A normal range contains a value X if X >= start && X < end.
 *
 * A point range contains no values.
 *
 * An inverted range contains a value X if X >= start || X < end,
 * in other words, it contains all values except those between start and end.
 */
export type Range<Tag = unknown> = {
    readonly start: number
    readonly end: number
    readonly tag: Option<Tag>

    /**
     * If the tag is Some, map the tag and return a new range with the tag from the map result
     * If the tag is None, returns the same range instance
     */
    mapTag: <T>(f: (tag: NonNullable<Tag>) => T) => Range<NonNullable<T>>

    /**
     * Return a new range as returned from `f`
     */
    flatMap: <T>(f: (start: number, end: number, tag: Option<Tag>) => Range<T>) => Range<T>

    /**
     * If the range is inverted, the step will be
     * @param step Non-zero positive number, length of each increments when iterating over the range
     */
    iter: (step: number) => Iter<number>
    withTag: <T>(t: T) => Range<NonNullable<T>>
    withStart: (start: number) => Range<Tag>
    withEnd: (end: number) => Range<Tag>

    /**
     * Checks if start < end, meaning the range is 'normal'
     */
    isNormal: () => boolean
    /**
     * Checks if start === end, meaning the range contains no values, it is point-like
     */
    isPoint: () => boolean
    /**
     * Checks if start > end, meaning the range is 'inverted' and contains all values except those between start and end
     */
    isInverted: () => boolean

    /**
     * Create a new range with start and end swapped.
     * If the range is inverted, this creates a normal range, and vice versa
     */
    invert: () => Range<Tag>

    includes: (n: number) => boolean
    contains: (r: Range<any>) => boolean
    intersects: (r: Range<any>) => boolean
    cmp: (r: Range<any>) => number
    split: (n: number) => Option<readonly [Range<Tag>, Range<Tag>]>
    slice: <T2>(
        r: readonly Range<T2>[],
    ) => Generator<Slice<Tag, T2>, void, undefined>
    valueOf: () => readonly [start: number, end: number, tag?: Tag | null]
    toString: () => string
    __proto__: null
}

/**
 * NOTE: unstable api, subject to breaking changes!
 * @inheritdoc
 */
export const Range = <T>(start: number, end: number, tag: Option<T>): Range<T> => {
    const self: Range<T> = Object.freeze({
        start: start,
        end: end,
        tag: tag,
        mapTag: (f) => tag.isSome() ? Range(start, end, tag.map(f)) : self as any,
        flatMap: (f) => f(start, end, tag),
        iter: (step) => {
            step = Math.abs(step)
            return self.isInverted()
                ? Iter(function* () {
                    for (let s = start; s > end; s -= step) {
                        yield s
                    }
                })
                : Iter(function* () {
                    for (let s = start; s < end; s += step) {
                        yield s
                    }
                })
        },
        withTag: (t) => Range(start, end, Option(t)),
        withStart: (s) => Range(s, end, tag),
        withEnd: (e) => Range(start, e, tag),
        isPoint: () => start === end,
        isNormal: () => start < end,
        isInverted: () => start > end,
        invert: () => Range(end, start, tag),
        contains: (r) => {
            return self.includes(r.start) && self.includes(r.end)
        },
        includes: (n) => {
            if (start > end) {
                // inverted
                return start <= n || n < end
            }
            return start <= n && n < end
        },
        intersects: (r) => {
            if (r.isInverted() && self.isInverted()) {
                return r.start > end && start > r.end
            }
            if (r.isInverted() || self.isInverted()) {
                return r.start < end || start < r.end
            }
            return r.start < end && start < r.end
        },
        split: (n) => self.includes(n) ? Some([Range(start, n, tag), Range(n, end, tag)] as const) : None(),
        cmp: (r) => {
            // treat inverted ranges the same as normal for the sake of ordering
            if (start === r.start) {
                return end - r.end
            }
            return start - r.start
        },
        slice: (rs) => slice(rs, self),
        valueOf: () => [start, end.valueOf(), tag.valueOf()] as const,
        toString: () =>
            `${start}..${end}${
                tag.switch({
                    some: (t) => ` (${t})`,
                    none: () => '',
                })
            }`,
        __proto__: null,
        // @ts-ignore private
        [RangeSymbol]: true,
    })

    return self
}
setInstanceFor(Range, RangeSymbol)

Range.from = <T extends { start: number; end: number }>(t: T): T extends { tag: infer Tag } ? Range<Tag> : Range<T> => {
    const tag = 'tag' in t ? t.tag : t
    return Range(t.start, t.end, Some(tag as any)) as any
}
Range.fromDates = (start: Date, end: Date) => Range(start.valueOf(), end.valueOf(), Some([start, end]))
Range.point = (n: number) => Range(n, n, None())
Range.of = <T>(start: number, end: number, tag?: T) => Range(start, end, Option(tag))
Range.cmp = (a: Range<any>, b: Range<any>) => a.cmp(b)

/**
 * Slice a set of ranges over the given `range`, returning discrete intersections of each range
 * @example ```ts
 * slice(Range(
 * ```
 */
export function* slice<T, T2 = T>(
    ranges: readonly Range<T2>[],
    range: Range<T>,
): Generator<Slice<T, T2>, void, undefined> {
    const points = new Set<number>()
    ranges = ranges
        .filter((r) => range.intersects(r))
        .sort((a, b) => a.cmp(b))

    points.add(range.start)
    ranges.forEach((r) => {
        points.add(r.start)
        points.add(r.end)
    })
    points.add(range.end)

    const sortedPoints = Array.from(points).sort((a, b) => a - b)

    for (let i = 0; i < sortedPoints.length - 1; i++) {
        const start = sortedPoints[i]
        const end = sortedPoints[i + 1]
        const slice = Range.of(start, end)

        // TODO: There must be a more optimized way to do this
        const isExcluded = ranges.some((r) => r.isInverted() && !r.intersects(slice))
        if (isExcluded) continue

        const intersections = ranges.filter((r) => r.intersects(slice))

        yield slice.withTag(
            range.tag.switch({
                some: (tag) => [tag, ...intersections] as const,
                none: () => intersections,
            }) as any,
        )
    }
}
