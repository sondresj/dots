import { assert } from '@std/assert'
import * as util from '../src/util.ts'
import { describe, it } from '@std/testing/bdd'

describe('util', () => {
    describe('isNonNullable', () => {
        it('returns false for null and undefined', () => {
            assert(!util.isNonNullable(null))
            assert(!util.isNonNullable(undefined))
        })

        it('returns true for any not nullish value', () => {
            assert(util.isNonNullable(''))
            assert(util.isNonNullable([]))
            assert(util.isNonNullable({}))
            assert(util.isNonNullable(0))
            assert(util.isNonNullable(false))
        })
    })

    describe('isPromise', () => {
        it('returns true for builtin promise', () => {
            assert(util.isPromise(Promise.resolve(1)))
            assert(util.isPromise(new Promise((res) => res(1))))
        })

        it('returns true for promise-like', () => {
            assert(util.isPromise({
                then: (cb: () => any) => cb(),
                catch: (cb: () => any) => cb(),
            }))
        })

        it('returns false for promise-like ish', () => {
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

    describe('setInstanceFor', () => {
        it('enables instanceof operator for objects returned by f', () => {
            const Foo = Symbol()
            const foo = () => {
                return { x: 1, [Foo]: true }
            }
            util.setInstanceFor(foo, Foo)
            assert(foo() instanceof foo, 'true')
            assert(!({ x: 1 } instanceof foo), 'false')
        })
    })
})
