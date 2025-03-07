import { assert, assertEquals, assertThrows } from 'jsr:@std/assert'
import { None, Option, Some } from '../src/option.ts'
import { describe } from './util.ts'

const optEq = (left: Option<any>, right: Option<any>) => {
    assertEquals(left.toString(), right.toString())
}

describe('Monad laws of Option', s => {
    s.test('left identity', () => {
        const f = (n: number) => Some(n + 1)
        const a = Option(1).flatMap(f)
        const b = f(1)
        assertEquals(a.unwrap(), b.unwrap())
    })

    s.test('right identity', () => {
        const a = Some(1)
        const b = a.flatMap(Option)
        assertEquals(a.unwrap(), b.unwrap())
    })

    s.test('associativity', () => {
        const f = (x: number) => Some(x + 2)
        const g = (x: number) => Some(x * 2)
        const o = Some(42)
        const left = o.flatMap(f).flatMap(g)
        const right = o.flatMap(x => f(x).flatMap(g))
        assertEquals(left.unwrap(), right.unwrap())
    })
})

describe('Option', (s) => {
    s.describe('map', (s) => {
        s.it('when Some, returns Some of the mapped value', () => {
            const opt = Some(1)
            const mapped = opt.map((v) => v + 1)
            optEq(opt, Some(1))
            optEq(mapped, Some(2))
        })

        s.it('when None, callback is not invoked', () => {
            const opt = None() as Option<number>
            const mapped = opt.map((_) => {
                assert(false, 'Unreacable')
            })
            optEq(mapped as any, None())
        })
    })

    s.describe('flatMap', (s) => {
        s.it('when Some, returns the returned option', () => {
            const opt = Some(1)
            const flatMapped = opt.flatMap((v) => Some(v + 1))

            optEq(opt, Some(1))
            optEq(flatMapped, Some(2))
        })

        s.it('when None, callback is not invoked', () => {
            const opt = None() as Option<number>
            const flatMapped = opt.flatMap((_) => {
                assert(false, 'Unreacable')
            })

            optEq(flatMapped, None())
        })
    })

    s.describe('zip', () => {
        s.it('when Some and arg is Some, returns Some of both', () => {
            const left = Some(1)
            const right = Some(2)
            const zipped = left.zip(right)
            optEq(zipped, Some([1, 2]))
        })
    })

    s.describe('toString', () => {})
    s.describe('switch', () => {})
    s.describe('isSome', () => {})
    s.describe('done', () => {})
    s.describe('ok', () => {})
    s.describe('okOr', () => {
        s.it('returns Err(..) for none', () => {
            assert(!None().okOr(() => '').isOk())
        })
        s.it('returns Ok(..) for some', () => {
            assert(Some(1).okOr(() => '').isOkAnd((v) => v === 1))
        })
    })
    s.describe('unwrap', () => {
        s.it('throws for none', () => {
            assertThrows(() => None().unwrap('oops'), 'oops')
        })
        s.it('returns t for some', () => {
            assert(Some(1).unwrap() === 1)
        })
    })
    s.describe('unwrapOr', (s) => {
        s.it('returns alt for none', () => {
            assert(None().unwrapOr(() => 1) === 1)
        })
        s.it('returns t for some', () => {
            assert(Some<number>(1).unwrapOr(() => 0) === 1)
        })
    })
    s.describe('[hasInstance]', (s) => {
        s.it('instanceof works for all variants', () => {
            assert(Some(1) instanceof Some)
            assert(!(Some(1) instanceof None))
            assert(!(None() instanceof Some))
            assert(None() instanceof None)
            assert(None() instanceof Option)
            assert(Some(1) instanceof Option)
        })
    })
})
