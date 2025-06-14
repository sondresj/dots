import { assert } from '@std/assert'
import { Do } from '../src/do.ts'
import { None, type Option, Some } from '../src/option.ts'
import { Ok } from '../src/result.ts'
import { describe, it } from '@std/testing/bdd'

describe('Do', () => {
    function* woo_do(val: Option<string>) {
        const res = yield* val.okOr<Error>(() => new Error('No string'))
        return Ok(res.toUpperCase())
    }
    describe('bind', () => {
        it('returns a HOF', () => {
            const gen = Do.bind(woo_do)
            assert(typeof gen === 'function')
            assert(!gen(None()).isOk())
        })
    })
    it('aborts execution at the first None', () => {
        const res = Do(function* () {
            yield None()
            // @ts-ignore yeh
            assert(1 === 0)
            return Some('unreachable')
        })
        assert(!res.isSome())
    })
    it('does not exceed call stack size', () => {
        const res = Do(function* () {
            let sum = 0
            for (let i = 0; i < 1e6; i++) {
                sum += yield* Some(1)
            }
            return Some(sum)
        })
        assert(res.unwrap() === 1e6)
    })
})
