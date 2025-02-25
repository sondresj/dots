import { assert, assertEquals } from 'jsr:@std/assert'
import { None, type Option, Some } from '../src/option.ts'
import { describe } from './util.ts'

const optEq = (left: Option<any>, right: Option<any>) => {
    assertEquals(left.toString(), right.toString())
}

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
    s.describe('okOr', () => {})
    s.describe('unwrap', () => {})
    s.describe('unwrapOr', () => {})
})
