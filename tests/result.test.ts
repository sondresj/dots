import { assert } from '@std/assert'
import { describe } from './util.ts'
import { Err, Ok, Result } from '../src/result.ts'

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
