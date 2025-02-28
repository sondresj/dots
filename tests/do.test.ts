import { assert } from '@std/assert'
import { Do } from '../src/do.ts'
import { None, type Option, Some } from '../src/option.ts'
import { Ok } from '../src/result.ts'
import { describe } from './util.ts'

describe('Do', (s) => {
    function* woo_do(val: Option<string>) {
        const res = yield* val.okOr<Error>(() => new Error('No string'))
        return Ok(res.toUpperCase())
    }
    s.describe('bind', (s) => {
        s.it('returns a HOF', () => {
            const gen = Do.bind(woo_do)
            assert(typeof gen === 'function')
            assert(!gen(None()).isOk())
        })
    })
    s.it('aborts execution at the first None', () => {
        const res = Do(function* () {
            yield None()
            // @ts-ignore yeh
            assert(1 === 0)
            return Some('unreachable')
        })
        assert(!res.isSome())
    })
})
