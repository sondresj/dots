import { assert } from '@std/assert'
import { Done, Fail, Task } from '../src/task.ts'
import { describe, it } from '@std/testing/bdd'

describe('Task', () => {
    describe('TaskOf', () => {
        it('wraps a promise and returns task', async () => {
            const task = Task(Promise.resolve(1))

            assert(
                await task.switch({
                    done: (v) => v === 1,
                    fail: () => false,
                }).unwrap(),
            )
        })

        it('returns a task from initializer', async () => {
            const task = Task((done, fail) => {
                assert(typeof done === 'function')
                assert(typeof fail === 'function')
                done(1)
            })

            assert(
                await task.switch({
                    done: (v) => v === 1,
                    fail: () => false,
                }).unwrap(),
            )
        })
    })
    describe('[hasInstance]', () => {
        it('instanceof works for all variants', () => {
            assert(Done(() => 1) instanceof Task)
            assert(Fail(() => 1) instanceof Task)
        })
    })
})
