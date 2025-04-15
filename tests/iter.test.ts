import { Do } from '../src/do.ts'
import { Iter } from '../src/iter.ts'
import { None, Some } from '../src/option.ts'
import { assert, assertEquals, assertThrows } from '@std/assert'
import { describe, it, test } from '@std/testing/bdd'

describe('Iter', () => {
    it('is lazily evaluated', () => {
        let yielded = 0
        const iter = Iter(function* () {
            yield ++yielded
            yield ++yielded
            yield ++yielded
        }).map((n) => n.toString())
        assert(iter.nth(1).filter((n) => n === '2').isSome())
        assert(yielded === 2)
    })

    test('multiple enumerations enumerates iterable multiple times', () => {
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

    describe('first', () => {
        it('returns the first item', () => {
            assert(Iter.from([1, 2, 3]).first().unwrap() === 1)
        })
    })

    describe('last', () => {
        it('returns the last item', () => {
            assert(Iter.from([1, 2, 3]).last().unwrap() === 3)
        })
    })

    describe('nth', () => {
        it('returns the nth item', () => {
            assert(Iter.from([1, 2, 3]).nth(1).unwrap() === 2)
        })
    })

    describe('all', () => {
        it('returns true if all items matches predicate', () => {
            assert(Iter.from([1, 2, 3]).all((n) => n > 0))
        })

        it('returns false if one item does not match predicate', () => {
            assert(!Iter.from([1, 2, 3]).all((n) => n !== 1))
        })

        it('early exits iterable', () => {
            let yielded = 0
            const iter = Iter(function* () {
                while (yielded < 3) {
                    yield yielded++
                }
            })
            assert(!iter.all((n) => n === 0), 'only first item should match')
            assertEquals(yielded, 2)
        })
    })

    describe('any', () => {
        it('returns true if any item matches predicate', () => {
            assert(Iter.from([1, 2, 3]).any((n) => n === 2))
        })

        it('returns false if no item matches predicate', () => {
            assert(!Iter.from([1, 2, 3]).any((n) => n > 3))
        })

        it('early exits iterable', () => {
            let yielded = 0
            const iter = Iter(function* () {
                while (yielded < 3) {
                    yield yielded++
                }
            })
            assert(iter.any((n) => n === 1), 'only first item should match')
            assertEquals(yielded, 2)
        })
    })

    describe('skip', () => {
        it('returns items after n', () => {
            assertEquals(Iter.from([1, 2, 3]).skip(1).toArray(), [2, 3])
        })
    })

    describe('take', () => {
        it('returns the first n items', () => {
            assertEquals(Iter.from([1, 2, 3]).take(2).toArray(), [1, 2])
        })
    })

    describe('enumerate', () => {
        it('returns items togheter with its index', () => {
            assertEquals(Iter.from([1, 2, 3]).enumerate().toArray(), [[0, 1], [1, 2], [2, 3]])
        })
    })

    describe('filter', () => {
        it('returns items matching predicate', () => {
            assertEquals(Iter.from([1, 2, 3]).filter((i) => i % 2 === 0).toArray(), [2])
        })
    })

    describe('map', () => {
        it('does not call init when invoked', () => {
            const iter = Iter(() => {
                assert(false, 'Throwing iterator')
            })
            const mapped = iter.map(() => 'ok')
            assertThrows(() => mapped.nth(1))
        })

        it('returns items as returned by callback', () => {
            const mapped = Iter(() => [1, 2, 3]).map((n) => n * 2).toArray()
            assertEquals(mapped, [2, 4, 6])
        })
    })

    describe('flatMap', () => {
        it('returns a flattened iter', () => {
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

    describe('zip', () => {
        it('returns Iter of [a, b] yielding until one of a or b is done', () => {
            const a = Iter.from([1, 2, 3])
            const b = Iter.from([4, 5, 6, 7, 8])
            const ab = a.zip(b).toArray()
            const ba = b.zip(a).toArray()
            const c = Iter.from([0, -1])
            const abc = a.zip(b)
                .zip(c)
                .map(([[a, b], c]) => [a, b, c])
                .toArray()
            assertEquals(abc, [[1, 4, 0], [2, 5, -1]])
            assertEquals(ab, [[1, 4], [2, 5], [3, 6]])
            assertEquals(ba, [[4, 1], [5, 2], [6, 3]])
        })
    })

    describe('reduce', () => {
        it('reduces the iterator to R', () => {
            const r = Iter.from([1, 2, 3]).reduce((r, t) => r | 1 << t, 0)
            assertEquals(r, 8)
        })
    })

    describe.skip('[Symbol.iterator]', () => {
        it('works in do-notation', () => {
            const stoi = (_: any) => {
                const maybeNum = Number()
                return Number.isFinite(maybeNum) && Number.isInteger(maybeNum) ? Some(maybeNum) : None<number>()
            }
            const sum = Do(function* () {
                // bit of a contrived example, there are more succinct and readable ways to express this logic
                const x = yield Iter(function* () {
                    yield 'abc'
                    yield '123'
                    yield '1.23'
                    yield '-1337'
                    yield '+9000'
                })
                // .map(stoi)
                // .filter((o) => o.isSome())
                // .map((o) => o.unwrap())
                return stoi(x)
            })
            console.log(sum)
            assertEquals(sum, 123 - 1337 + 9000 as any)
        })
    })

    describe('[hasInstance]', () => {
        it('returns true for iter instances', () => {
            const iter = Iter.from([1, 2, 3])
            assert(iter instanceof Iter)
        })
    })
})
