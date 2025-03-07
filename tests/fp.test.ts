import { compose } from '../src/fp.ts'
import { None, Some } from 'dots'
import { describe } from './util.ts'
import { assert } from '@std/assert'

describe('fp', (s) => {
    const div = (denominator: number) => (numerator: number) => {
        const res = numerator / denominator
        return Number.isFinite(res) ? Some(res) : None()
    }

    const fix = (precision: number) => (n: number) => {
        return n.toFixed(precision)
    }

    s.describe('compose', (s) => {
        s.it('returns a function', () => {
            const c = compose(div(2), fix(1))
            assert(typeof c === 'function')
        })

        s.it('calls functions in reading order', () => {
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
