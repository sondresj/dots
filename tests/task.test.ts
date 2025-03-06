import { assert } from '@std/assert'
import { Task } from '../src/task.ts'
import { describe } from './util.ts'

describe('Task', (s) => {
    s.describe('TaskOf', (s) => {
        s.it('wraps a promise and returns task', async () => {
            const task = Task(Promise.resolve(1))

            assert(
                await task.switch({
                    done: (v) => v === 1,
                    fail: () => false,
                }).unwrap(),
            )
        })

        s.it('returns a task from initializer', async () => {
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
})
