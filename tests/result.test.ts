import { assert, assertEquals } from '@std/assert'
import { describe } from './util.ts'
import { Err, Ok, Result } from '../src/result.ts'

describe('Monad laws of Result', s => {
    s.test('left identity', () => {
        const f = (n: number) => Ok(n + 1)
        const a = Ok(1).flatMap(f)
        const b = f(1)
        assertEquals(a.unwrap(), b.unwrap())
    })

    s.test('right identity', () => {
        const a = Ok(1)
        const b = a.flatMap(Result)
        assertEquals(a.unwrap(), b.unwrap())
    })

    s.test('associativity', () => {
        const f = (x: number) => Ok(x + 2)
        const g = (x: number) => Ok(x * 2)
        const o = Ok(42)
        const left = o.flatMap(f).flatMap(g)
        const right = o.flatMap(x => f(x).flatMap(g))
        assertEquals(left.unwrap(), right.unwrap())
    })
})

describe('Result', (s) => {
    s.describe('[hasInstance]', (s) => {
        s.it('instanceof works for all variants', () => {
            assert(Ok(1) instanceof Ok)
            assert(!(Ok(1) instanceof Err))
            assert(!(Err('') instanceof Ok))
            assert(Err('') instanceof Err)
            assert(Err('') instanceof Result)
            assert(Ok(1) instanceof Result)
        })
    })
})
