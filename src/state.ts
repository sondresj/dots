import { setInstanceFor } from './util.ts'
import { Thunk, trampoline } from './thunk.ts'

/**
 * The signature of a state monad initializer, similar to the Promise constructor
 * @param s the state
 * @returns a tuple of the new state and the value of the state
 */
export type RunState<S, A> = (s: S) => readonly [state: S, value: A]
/**
 * Extract the type of A from a State<S, A>
 */
export type StateValue<S> = S extends State<any, infer A> ? A : never
/**
 * Extract the type of S from a State<S, _>
 */
export type StateArg<S> = S extends State<infer S, any> ? S : never

const StateSymbol = Symbol('dots.state')

/**
 * TODO: explain
 */
export type State<S, A> = {
    map: <B>(f: (a: A) => B) => State<S, B>
    flatMap: <B>(f: (a: A) => State<S, B>) => State<S, B>
    /**
     * Run the 'program' of the state
     */
    run: RunState<S, A>
    /**
     * convert this state to a thunk of the state.
     * Useful for stack-safe recursive flatMap
     */
    thunk: <B>(f: (a: A) => Thunk<State<S, B>>) => Thunk<State<S, B>>
    [Symbol.iterator]: () => Iterator<State<S, A>, A, any>
    __proto__: null
}

/**
 * Create a new State monad.
 * The State monad allows for pure functions to operate with some "global"/"external" state `S`
 * which has an effect on the functions returned value.
 * @param run
 * @returns
 */
export const State = <S, A>(run: RunState<S, A>): State<S, A> => {
    const state: State<S, A> = {
        run,
        map: (f) => {
            return State((s) => {
                const [nextState, value] = run(s)
                return [nextState, f(value)]
            })
        },
        flatMap: (f) => {
            return State((s) => {
                const [nextState, value] = run(s)
                const res = f(value)
                return res.run(nextState)
            })
        },
        thunk: (f) => {
            return Thunk.of(State((s) => {
                const [ns, v] = run(s)
                return trampoline(f)(v).run(ns)
            }))
        },
        *[Symbol.iterator]() {
            return yield state
        },
        __proto__: null,
        // @ts-ignore private
        [StateSymbol]: true,
    }

    return Object.freeze(state)
}
setInstanceFor(State, StateSymbol)

State.of = <S, A>(a: A): State<S, A> => State((s) => [s, a])
State.get = <S>(): State<S, S> => State((s) => [s, s])
State.set = <S>(s: S): State<S, void> => State((_) => [s, undefined])
State.modify = <S>(f: (s: S) => S): State<S, void> => State((s) => [f(s), undefined])
State.transform = <S, SB>(f: (s: S) => SB): State<SB, void> => State((s) => [f(s as unknown as S), undefined])
