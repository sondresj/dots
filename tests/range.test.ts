import { describe, test } from '@std/testing/bdd'
import { assert, assertEquals } from '@std/assert'
import { Range } from '../src/range.ts'

describe('Range', () => {
    describe('intersects', () => {
        const shouldIntersect = [
            [Range.of(1, 4), Range.of(2, 3)],
            [Range.of(1, 4), Range.of(2, 5)],
            [Range.of(1, 4), Range.of(1, 5)],
            [Range.of(1, 4), Range.of(0, 2)],
            // either inverted
            [Range.of(4, 1), Range.of(0, 2)],
            [Range.of(4, 1), Range.of(4, 6)],
            // both inverted
            [Range.of(4, 1), Range.of(5, 2)],
        ]
        const shouldNot = [
            [Range.of(1, 4), Range.of(5, 6)],
            [Range.of(1, 4), Range.of(0, 1)],
            [Range.of(1, 4), Range.of(4, 6)],
            [Range.of(4, 1), Range.of(2, 3)],
        ]

        const check = (a: Range<any>, b: Range<any>, should: boolean) => {
            test(`${a.toString()} should ${should ? '' : 'not '}intersect ${b.toString()}`, () => {
                assert(a.intersects(b) === should)
                assert(b.intersects(a) === should)
            })
        }

        shouldIntersect.forEach(([a, b]) => check(a, b, true))
        shouldNot.forEach(([a, b]) => check(a, b, false))
    })

    describe('slice', () => {
        test('a: 1..3 b: 2..4 slice over 0..5>', () => {
            const rs = [
                Range.of(1, 3, 'a'),
                Range.of(2, 4, 'b'),
            ] as const
            const dice = Array.from(Range.of(0, 5, 'c').slice(rs))
            const values = dice.map((r) => {
                const [s, e, t] = r.valueOf()
                return [s, e, t?.map((i) => i.valueOf())] as const
            })

            assertEquals(values, [
                [0, 1, ['c']],
                [1, 2, ['c', [1, 3, 'a']]],
                [2, 3, ['c', [1, 3, 'a'], [2, 4, 'b']]],
                [3, 4, ['c', [2, 4, 'b']]],
                [4, 5, ['c']],
            ])
        })

        test('a: 3..1 b: 2..4 slice over 0..5', () => {
            const rs = [
                Range.of(3, 1, 'a'),
                Range.of(2, 4, 'b'),
            ] as const
            const dice = Array.from(Range.of(0, 5, 'c').slice(rs))
            const values = dice.map((r) => {
                const [s, e, t] = r.valueOf()
                return [s, e, t?.map((i) => i.valueOf())] as const
            })
            assertEquals(values, [
                [0, 1, ['c', [3, 1, 'a']]],
                [3, 4, ['c', [2, 4, 'b'], [3, 1, 'a']]],
                [4, 5, ['c', [3, 1, 'a']]],
            ])
        })
    })

    describe('cmp', () => {
        test('sorting ranges with some inverted', () => {
            const ranges = [
                Range.of(5, 7, 'a'),
                Range.of(4, 6, 'b'),
                Range.of(3, 8, 'c'),
                Range.of(4, 1, 'd'),
            ]
            const sorted = ranges.toSorted(Range.cmp)
                .map((r) => r.valueOf())
            assertEquals(sorted, [
                [3, 8, 'c'],
                [4, 1, 'd'],
                [4, 6, 'b'],
                [5, 7, 'a'],
            ])
        })
    })

    describe('iter', () => {
        test('iterating with step=2 does not yield out of bound i', () => {
            const indices = Range.of(1, 5).iter(2).toArray()
            assertEquals(indices, [1, 3])
        })

        test('iterating inverted range yields indices in descending order', () => {
            const indices = Range.of(10, 0).iter(1).toArray()
            assertEquals(indices, [10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
        })
    })
})
