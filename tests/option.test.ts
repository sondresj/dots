import { assert, assertEquals, assertThrows } from 'jsr:@std/assert'
import { None, Option, Some } from '../src/option.ts'
import { describe, it } from '@std/testing/bdd'

const optEq = (left: Option<any>, right: Option<any>) => {
    assertEquals(left.toString(), right.toString())
}

describe('Option', () => {
    describe('map', () => {
        it('when Some, returns Some of the mapped value', () => {
            const opt = Some(1)
            const mapped = opt.map((v) => v + 1)
            optEq(opt, Some(1))
            optEq(mapped, Some(2))
        })

        it('when None, callback is not invoked', () => {
            const opt = None() as Option<number>
            const mapped = opt.map((_) => {
                assert(false, 'Unreacable')
            })
            optEq(mapped as any, None())
        })
    })

    describe('flatMap', () => {
        it('when Some, returns the returned option', () => {
            const opt = Some(1)
            const flatMapped = opt.flatMap((v) => Some(v + 1))

            optEq(opt, Some(1))
            optEq(flatMapped, Some(2))
        })

        it('when None, callback is not invoked', () => {
            const opt = None() as Option<number>
            const flatMapped = opt.flatMap((_) => {
                assert(false, 'Unreacable')
            })

            optEq(flatMapped, None())
        })
    })

    describe('zip', () => {
        it('when Some and arg is Some, returns Some of both', () => {
            const left = Some(1)
            const right = Some(2)
            const zipped = left.zip(right)
            optEq(zipped, Some([1, 2]))
        })
    })

    describe('toString', () => {})
    describe('switch', () => {})
    describe('isSome', () => {})
    describe('done', () => {})
    describe('ok', () => {})
    describe('okOr', () => {
        it('returns Err(..) for none', () => {
            assert(!None().okOr(() => '').isOk())
        })
        it('returns Ok(..) for some', () => {
            assert(Some(1).okOr(() => '').isOkAnd((v) => v === 1))
        })
    })
    describe('unwrap', () => {
        it('throws for none', () => {
            assertThrows(() => None().unwrap('oops'), 'oops')
        })
        it('returns t for some', () => {
            assert(Some(1).unwrap() === 1)
        })
    })
    describe('unwrapOr', () => {
        it('returns alt for none', () => {
            assert(None().unwrapOr(() => 1) === 1)
        })
        it('returns t for some', () => {
            assert(Some<number>(1).unwrapOr(() => 0) === 1)
        })
    })
    describe('[hasInstance]', () => {
        it('instanceof works for all variants', () => {
            assert(Some(1) instanceof Some)
            assert(!(Some(1) instanceof None))
            assert(!(None() instanceof Some))
            assert(None() instanceof None)
            assert(None() instanceof Option)
            assert(Some(1) instanceof Option)
        })
    })
})
