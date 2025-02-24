// This madman actually did it
// https://gist.github.com/nythrox/bb369026dcecf710233582e7cbe1955b
// The following is an adaptation of his work

type GeneratorReturn<T> = T extends Generator<any, infer R, any> ? R : never

/**
 * NOTE: If any of the yields in the do function scope is a Task, the scope MUST also return a Task!
 */
export const Do = <
    TMonadic extends { flatMap: (t: any) => any },
    TReturn extends { flatMap: (t: any) => any },
    Scope extends () => Generator<TMonadic, TReturn, any>,
>(fun: Scope): GeneratorReturn<ReturnType<Scope>> => {
    const iterator = fun()
    const state = iterator.next()

    function run(s: typeof state): any {
        if (s.done) {
            return s.value
        }
        return s.value.flatMap((val: any) => {
            return run(iterator.next(val))
        })
    }

    return run(state)
}

Do.bind = <
    TMonadic extends { flatMap: (t: any) => any },
    TReturn extends { flatMap: (t: any) => any },
    F extends (...args: any[]) => Generator<TMonadic, TReturn, any>,
>(f: F) => {
    type Scope = () => ReturnType<F>
    return (...args: Parameters<F>) => Do<TMonadic, TReturn, Scope>((() => f(...args)) as Scope)
}
