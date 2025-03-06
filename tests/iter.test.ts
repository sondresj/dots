import { assert } from '@std/assert/assert'
import { Iter } from '../src/iter.ts'
import { describe } from './util.ts'
import { assertEquals, assertThrows } from '@std/assert'

describe('Iter', (s) => {
    s.it('is lazily evaluated', () => {
        let yielded = 0
        const iter = Iter(function* () {
            yield ++yielded
            yield ++yielded
            yield ++yielded
        }).map((n) => n.toString())
        assert(iter.nth(1).filter((n) => n === '2').isSome())
        assert(yielded === 2)
    })

    s.it('multiple enumerations enumerates iterable multiple times', () => {
        let yielded = 0
        const f = function* () {
            yield ++yielded
            yield ++yielded
            yield ++yielded
        }
        const iter = Iter(f)
        const _mapped = iter.map((n) => n.toString()).toArray()
        const summed = iter.reduce((r, n) => r + n, 0)
        assertEquals(yielded, 6)
        assertEquals(summed, 6)
    })

    s.describe('first', (s) => {
        s.it('returns the first element', () => {
            assert(Iter.from([1, 2, 3]).first().unwrap() === 1)
        })
    })

    s.describe('last', (s) => {
        s.it('returns the last element', () => {
            assert(Iter.from([1, 2, 3]).last().unwrap() === 3)
        })
    })

    s.describe('nth', (s) => {
        s.it('returns the nth element', () => {
            assert(Iter.from([1, 2, 3]).nth(1).unwrap() === 2)
        })
    })

    s.describe('skip', (s) => {
        s.it('returns elements after n', () => {
            assertEquals(Iter.from([1, 2, 3]).skip(1).toArray(), [2, 3])
        })
    })

    s.describe('take', (s) => {
        s.it('returns the first n elements', () => {
            assertEquals(Iter.from([1, 2, 3]).take(2).toArray(), [1, 2])
        })
    })

    s.describe('enumerate', (s) => {
        s.it('returns elements togheter with its index', () => {
            assertEquals(Iter.from([1, 2, 3]).enumerate().toArray(), [[0, 1], [1, 2], [2, 3]])
        })
    })

    s.describe('filter', (s) => {
        s.it('returns items matching predicate', () => {
            assertEquals(Iter.from([1, 2, 3]).filter((i) => i % 2 === 0).toArray(), [2])
        })
    })

    s.describe('map', (s) => {
        s.it('does not call init when invoked', () => {
            const iter = Iter(() => {
                assert(false, 'Throwing iterator')
            })
            const mapped = iter.map(() => 'ok')
            assertThrows(() => mapped.nth(1))
        })

        s.it('returns elements as returned by callback', () => {
            const mapped = [...Iter(() => [1, 2, 3]).map((n) => n * 2)]
            assertEquals(mapped, [2, 4, 6])
        })
    })

    s.describe('flatMap', (s) => {
        s.it('returns a flattened iter', () => {
            const flatmapped = Iter
                .from([1, 2, 3])
                .flatMap((i) =>
                    Iter(function* () {
                        const y = 1 << i
                        for (let x = 0; x <= i; x++) {
                            yield y | 1 << x
                        }
                    })
                )
                .toArray()
            assertEquals(flatmapped, [3, 2, 5, 6, 4, 9, 10, 12, 8])
        })
    })

    s.describe('reduce', (s) => {
        s.it('reduces the iterator to R', () => {
            const r = Iter.from([1, 2, 3]).reduce((r, t) => r | 1 << t, 0)
            assertEquals(r, 8)
        })
    })

    s.describe('[hasInstance]', () => {
        s.it('returns true for iter instances', () => {
            const iter = Iter.from([1, 2, 3])
            assert(iter instanceof Iter)
        })
    })
})
