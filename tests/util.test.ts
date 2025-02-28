import { assert } from '@std/assert'
import * as util from '../src/util.ts'
import { describe } from './util.ts'

describe('util', (s) => {
    s.describe('identity', (s) => {
        s.it('returns the argument', () => {
            const x = {}
            assert(x == util.identity(x))
        })
    })

    s.describe('isNonNullable', () => {
        s.it('returns false for null and undefined', () => {
            assert(!util.isNonNullable(null))
            assert(!util.isNonNullable(undefined))
        })

        s.it('returns true for any not nullish value', () => {
            assert(util.isNonNullable(''))
            assert(util.isNonNullable([]))
            assert(util.isNonNullable({}))
            assert(util.isNonNullable(0))
            assert(util.isNonNullable(false))
        })
    })

    s.describe('isPromise', (s) => {
        s.it('returns true for builtin promise', () => {
            assert(util.isPromise(Promise.resolve(1)))
            assert(util.isPromise(new Promise((res) => res(1))))
        })

        s.it('returns true for promise-like', () => {
            assert(util.isPromise({
                then: (cb: () => any) => cb(),
                catch: (cb: () => any) => cb(),
            }))
        })

        s.it('returns false for promise-like ish', () => {
            assert(
                !util.isPromise({
                    then: true,
                    catch: false,
                }),
            )
            assert(
                !util.isPromise({
                    then: (cb: () => any) => cb(),
                    catcher: (cb: () => any) => cb(),
                }),
            )
            assert(
                !util.isPromise({
                    than: (cb: () => any) => cb(),
                    catch: (cb: () => any) => cb(),
                }),
            )
        })
    })
})
