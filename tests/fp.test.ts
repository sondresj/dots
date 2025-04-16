import { compose } from '../src/fp.ts'
import { None, Some } from '../src/mod.ts'
import { assert } from '@std/assert'
import { describe, it } from '@std/testing/bdd'

describe('fp', () => {
    const div = (denominator: number) => (numerator: number) => {
        const res = numerator / denominator
        return Number.isFinite(res) ? Some(res) : None()
    }

    const fix = (precision: number) => (n: number) => {
        return n.toFixed(precision)
    }

    describe('compose', () => {
        it('returns a function', () => {
            const c = compose(div(2), fix(1))
            assert(typeof c === 'function')
        })

        it('calls functions in reading order', () => {
            let i = 0
            const c = compose(() => {
                assert(i++ === 0)
            }, () => {
                assert(i++ === 1)
            }, () => {
                assert(i++ === 2)
                return i
            })
            assert(c() === 3)
        })
    })
})
