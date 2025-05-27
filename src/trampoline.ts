const thunkSym = Symbol('dots.thunk')
export type ThunkFn<T> = () => T
export type Thunk<T> = T | (ThunkFn<T> & { [thunkSym]: true })
export type ThunkReturn<T> = T extends Thunk<infer R> ? R : never

export const isThunk = (maybeThunk: unknown): maybeThunk is ThunkFn<any> =>
    !!maybeThunk && typeof maybeThunk === 'function' && (thunkSym in maybeThunk)

/**
 * call f until it no longer returns a thunk (a function with no arguments returning a value)
 */
export const trampoline = <
    F extends (...args: any[]) => any,
>(f: F) => {
    return (...args: Parameters<F>): ThunkReturn<ReturnType<F>> => {
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
export const Thunk = <F extends (...args: any[]) => any>(f: F) => (...args: Parameters<F>) => {
    const thunk = () => f(...args)
    thunk[thunkSym] = true
    return thunk as Thunk<ReturnType<F>>
}
/**
 * Create a thunk which returns the given value
 */
Thunk.of = <T>(t: T): Thunk<T> => {
    const thunk = () => t
    thunk[thunkSym] = true
    return thunk as Thunk<T>
}
