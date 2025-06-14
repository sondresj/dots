import { setInstanceFor } from './util.ts'

/**
 * The symbol used to identify thunks
 */
export const thunkSym = Symbol('dots.thunk')
/**
 * The signature of a thunk initializer
 */
export type ThunkFn<T> = () => T
/**
 * A thunk is a function with no parameters, essentially deferring `f`.
 * Thunk can also be thought of as a lazy function.
 * Usefull to make stack-safe recursion possible
 */
export type Thunk<T> = ThunkFn<T> & { [thunkSym]: true }
/**
 * Extract the return type of a thunk
 */
export type ThunkReturn<T> = T extends Thunk<infer R> ? R : never

/**
 * Check if `maybeThunk` is a thunk
 * @param maybeThunk
 * @returns `true` if `maybeThunk` is a thunk
 */
export const isThunk = (maybeThunk: unknown): maybeThunk is ThunkFn<any> =>
    !!maybeThunk && typeof maybeThunk === 'function' && (thunkSym in maybeThunk)

/**
 * call f until it no longer returns a thunk (a function with no arguments returning a value)
 */
export const trampoline = <
    F extends (...args: any[]) => any,
>(f: F): (...args: Parameters<F>) => ThunkReturn<ReturnType<F>> => {
    return (...args) => {
        let g = f(...args)
        while (isThunk(g)) g = g()
        return g
    }
}

/**
 * Create a thunk from a function.
 * A thunk is a function with no parameters, essentially deferring `f`. Thunk can also be thought of as a lazy function.
 * Usefull to make stack-safe recursion possible
 */
export const Thunk = <F extends (...args: any[]) => any>(f: F) => (...args: Parameters<F>): Thunk<ReturnType<F>> => {
    const thunk = () => f(...args)
    thunk[thunkSym] = true
    return thunk as Thunk<ReturnType<F>>
}
setInstanceFor(Thunk, thunkSym)

/**
 * Create a thunk which returns the given value
 */
Thunk.of = <T>(t: T): Thunk<T> => {
    const thunk = () => t
    thunk[thunkSym] = true
    return thunk as Thunk<T>
}
