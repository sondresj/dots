import { describe, test } from '@std/testing/bdd'
import { State } from '../src/state.ts'
import { Do } from '../src/mod.ts'
import { assertEquals } from '@std/assert'

describe('State', () => {
    test('do simply', () => {
        const res = () =>
            Do(function* () {
                const x = yield* State.of(1)
                const y = yield* State.of(2).map((y) => y ** y)
                const z = yield* State.of(3).map((z) => 1 / z).flatMap((z) => State.of(z.toString().length))
                return State((n: number) => [n, x * y * z])
            })
        assertEquals(res().run(0), [0, 72])
    })
    test('multiple runs', () => {
        // this test helped it click for me, what the state monad is useful for
        const program = State((times: number) => [times, ''])
        const getResponse = (prompt: string): State<number, string> => {
            return State<number, string>((temp): [number, string] => {
                switch (temp) {
                    case 0: {
                        return [temp + 1, 'yes?']
                    }
                    case 1: {
                        if (prompt.endsWith('?')) {
                            return [temp + 1, 'no']
                        }
                        return [temp + 1, prompt.toUpperCase()]
                    }
                    default:
                        return [(temp + 1) % 5, 'certainly!']
                }
            })
        }
        const state0 = 0 // initial state

        const [state1, response1] = program
            .flatMap((_) => getResponse('hello'))
            .run(state0)
        const [state2, response2] = program
            .flatMap((_) => getResponse('what?'))
            .run(state1)
        const [state3, response3] = program
            .flatMap((_) => getResponse(response2))
            .run(state2)

        assertEquals([response1, response2, response3], ['yes?', 'no', 'certainly!'])
        assertEquals(state3, 3)
    })
})
