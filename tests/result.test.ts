import { assert } from '@std/assert'
import { Err, Ok, Result } from '../src/result.ts'
import { describe, it } from '@std/testing/bdd'

describe('Result', () => {
    describe('[hasInstance]', () => {
        it('instanceof works for all variants', () => {
            assert(Ok(1) instanceof Ok)
            assert(!(Ok(1) instanceof Err))
            assert(!(Err('') instanceof Ok))
            assert(Err('') instanceof Err)
            assert(Err('') instanceof Result)
            assert(Ok(1) instanceof Result)
        })
    })
})
