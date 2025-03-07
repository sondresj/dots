import { assert, assertEquals } from '@std/assert'
import { Done, Fail, Task } from '../src/task.ts'
import { describe } from './util.ts'

describe('Monad laws of Task', s => {
    s.test('left identity', () => {
        const f = (n: number) => Done(n + 1)
        const a = Task<number>((d) => d(1)).flatMap(f)
        const b = f(1)
        assertEquals(a.unwrap(), b.unwrap())
    })

    s.test('right identity', () => {
        const a = Done(1)
        const b = a.flatMap(Done)
        assertEquals(a.unwrap(), b.unwrap())
    })

    s.test('associativity', () => {
        const f = (x: number) => Done(x + 2)
        const g = (x: number) => Done(x * 2)
        const o = Done(42)
        const left = o.flatMap(f).flatMap(g)
        const right = o.flatMap(x => f(x).flatMap(g))
        assertEquals(left.unwrap(), right.unwrap())
    })
})

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
    s.describe('[hasInstance]', (s) => {
        s.it('instanceof works for all variants', () => {
            assert(Done(() => 1) instanceof Task)
            assert(Fail(() => 1) instanceof Task)
        })
    })
})
