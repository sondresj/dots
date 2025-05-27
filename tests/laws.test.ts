import { assertEquals } from '@std/assert'
import { Do } from '../src/do.ts'
import { describe, test } from '@std/testing/bdd'
import { Option } from '../src/option.ts'
import { Result } from '../src/result.ts'
import { Task } from '../src/task.ts'
import { State } from '../src/state.ts'

type Monadic<T> = T extends {
    flatMap: (f: (v: any) => any) => any
    map: (f: (v: any) => any) => any
    [Symbol.iterator](): Iterator<any, any, any>
} ? T
    : never
type Of<T> = ((arg: any) => T) & {
    of: (arg: any) => T
}

const check = <T>({ of, name }: Of<Monadic<T>>) =>
    describe(`Monad laws of ${name}`, () => {
        test('left identity', () => {
            Do(function* () {
                const f = (n: number) => of(n + 1)
                const a = yield* of(1).flatMap(f)
                const b = yield* f(1)
                assertEquals(a, b)
                return of([])
            })
        })

        test('right identity', () => {
            Do(function* () {
                const a = of(1)
                const b = a.flatMap(of)
                assertEquals(yield* a, yield* b)
                return of([])
            })
        })

        test('associativity', () => {
            Do(function* () {
                const f = (x: number) => of(x + 2)
                const g = (x: number) => of(x * 2)
                const o = of(42)
                const left = yield* o.flatMap(f).flatMap(g)
                const right = yield* o.flatMap((x) => f(x).flatMap(g))
                assertEquals(left, right)
                return of([])
            })
        })
    })

// check(Iter)
check(Option)
check(Result as any)
check(Task)
check(State)
