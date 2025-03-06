type Fn = (...args: any[]) => any

// deno-fmt-ignore
type PipeArgs<F extends Fn[], Acc extends Fn[] = []> = F extends [(...args: infer A) => infer B]
    ? [...Acc, (...args: A) => B]
    : F extends [(...args: infer A) => any, ...infer Tail]
    ? Tail extends [(arg: infer B) => any, ...any[]]
    ? PipeArgs<Tail, [...Acc, (...args: A) => B]>
    : Acc
    : Acc

type LastFnReturnType<F extends Array<Fn>, Else = never> = F extends [...any[], (...arg: any) => infer R] ? R : Else

export const pipe = <FirstFn extends Fn, F extends Fn[]>(
    arg: Parameters<FirstFn>[0],
    firstFn: FirstFn,
    ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): LastFnReturnType<F, ReturnType<FirstFn>> => {
    return (fns as Fn[]).reduce((acc, fn) => fn(acc), firstFn(arg))
}

export const compose = <FirstFn extends Fn, F extends Fn[]>(
    firstFn: FirstFn,
    ...fns: PipeArgs<F> extends F ? F : PipeArgs<F>
): (...args: Parameters<FirstFn>) => LastFnReturnType<F, ReturnType<FirstFn>> => {
    return (...args) => (fns as Fn[]).reduce((acc, fn) => fn(acc), firstFn(...args))
}

/**
 * The identity is just itself, ie: x => x
 */
export const identity = <T>(t: T): T => t

export const memoLast = <
    T,
    F extends (...args: any[]) => T,
>(f: F): (...args: Parameters<F>) => T => {
    let cached = null as T | null
    let lastArgs = [] as any as Parameters<F>
    return (...args) => {
        if (cached && args.every((p, i) => lastArgs.at(i) === p)) {
            return cached!
        }
        lastArgs = args
        return (cached = f(...args))
    }
}
