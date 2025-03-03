// This madman actually did it
// https://gist.github.com/nythrox/bb369026dcecf710233582e7cbe1955b
// The following is an adaptation of his work

type GeneratorReturn<T> = T extends Generator<any, infer R, any> ? R : never

/**
 * Enter a Do block, where you may use the `yield*` operator on a monadic object (a type that implements flatMap)
 * @example Uncreachable code
 * ```typescript
 * const numbers = [1,42,1337]
 * const result = Do(function*(){
 *     const num = yield* Option.of(numbers.get(3)) // oops, idx 3 is out of bounds, this will result in None
 *     return Some(num*2) // this line is never executed, since none.flatMap returns itself
 * })
 * ```
 * @param fun is the scope for the Do block. must be a generator function that returns a monadic type
 * @return returns the returned monad from the do block, or the Err/None/Fail/etc. if one occured
 */
export const Do = <
    TMonadic extends { flatMap: (t: any) => any },
    TReturn extends { flatMap: (t: any) => any },
    Scope extends () => Generator<TMonadic, TReturn, any>,
>(fun: Scope): GeneratorReturn<ReturnType<Scope>> => {
    const gen = fun()
    const state = gen.next()

    function run(s: typeof state): any {
        if (s.done) {
            return s.value
        }
        return s.value.flatMap((val: any) => {
            return run(gen.next(val))
        })
    }

    return run(state)
}

/**
 * Convert a do-function into a "regular" function
 * Ie. removing the generator signature from the function
 * @param f the do-function
 * @returns a function with the same parameters that returns the monad (not the monad generator)
 */
Do.bind = <
    TMonadic extends { flatMap: (t: any) => any },
    TReturn extends { flatMap: (t: any) => any },
    F extends (...args: any[]) => Generator<TMonadic, TReturn, any>,
>(f: F) => {
    type Scope = () => ReturnType<F>
    return (...args: Parameters<F>) => Do<TMonadic, TReturn, Scope>((() => f(...args)) as Scope)
}
