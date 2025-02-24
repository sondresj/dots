import { ofSym, taskInitSym, taskSym } from './symbols.ts'
import { isPromise } from './util.ts'
import { Err, Ok, type Result } from './result.ts'

export type TaskInit<T, E> = (
    done: (t: T) => void,
    fail: (e: E) => void,
) => void

export type DoneTaskValue<TInit> = TInit extends TaskInit<infer T, any> ? T : never
export type FailTaskError<TInit> = TInit extends TaskInit<any, infer E> ? E : never
export type InitializedTask<TInit> = TInit extends TaskInit<infer T, infer E> ? Task<T, E> : never

/**
 * As opposed to Promise, a Task is lazy, meaning nothing is done until it is either executed via `Do` or converted to a `Promise` via `.ok() | .unwrap() | .unwrapOr(...)`.
 * Note: a Task returned from `Do` must also be executed by converting it to a `Promise`
 */
export type Task<T, E = unknown> = {
    map: <T2>(f: (t: NonNullable<T>) => T2) => Task<T2, E>
    flatMap: <T2>(f: (t: T) => Task<T2, E>) => Task<T2, E>
    mapErr: <E2>(f: (e: E) => E2) => Task<T, E2>
    /**
     * Convert the task to a Result that can be awaited
     */
    ok: () => Promise<Result<T, E>>
    switch: <T1, T2>(cases: { done: (t: NonNullable<T>) => T1; fail: (err: E | null | undefined) => T2 }) => Task<T1 | T2, never>
    unwrap: () => Promise<NonNullable<T>>
    unwrapOr: (alt: () => NonNullable<T>) => Promise<NonNullable<T>>
    /**
     * Run the task, not caring about the result. Any error is discarded
     */
    fire: () => void

    [taskSym]: true
    [taskInitSym]: TaskInit<T, E>
    [ofSym]: <T, E>(init: TaskInit<T, E>) => Task<T, E>
    [Symbol.iterator]: () => Iterator<Task<T, E>, T, any>
    __proto__: null
}

export const taskify = <F extends (...args: any[]) => Promise<any>, E = unknown>(f: F) => {
    type T = ReturnType<F> extends Promise<infer T> ? T : never
    return (...args: Parameters<F>): Task<T, E> =>
        TaskOf((done, fail) => {
            try {
                f(...args).then(done, fail)
            } catch (err) {
                fail(err as E)
            }
        })
}

export const TaskOf = <T, E = unknown>(initOrPromise: TaskInit<T, E> | Promise<T>) => {
    const init = isPromise(initOrPromise) ? (done: (value: T) => void, fail: (error: E) => void) => initOrPromise.then(done, fail) : initOrPromise

    const task = {
        map: (f) => TaskOf((done, fail) => init((val) => done(f(val!)), fail)) as any,
        flatMap: (f) => TaskOf((done, fail) => init((val) => f(val as any)[taskInitSym](done, fail), fail)),
        mapErr: (f) => TaskOf((done, fail) => init(done, (e) => fail(f(e)))) as any,
        switch: (cases) => TaskOf((done) => init((val) => done(cases.done(val!)), (err) => done(cases.fail(err)))),
        ok: () => new Promise((resolve) => init((val) => resolve(Ok(val as any)), (err) => resolve(Err(err) as any))),
        unwrap: () => new Promise((resolve, reject) => init((val) => resolve(val!), (err) => reject(err))),
        unwrapOr: (alt) => new Promise((resolve) => init((val) => resolve(val!), () => resolve(alt()!))),
        fire: () => new Promise((resolve) => init(() => resolve(void 0), () => resolve(void 0))),

        [taskSym]: true,
        [taskInitSym]: init,
        [ofSym]: TaskOf,
        [Symbol.iterator]: function* () {
            return (yield task) as any
        },
        __proto__: null,
    } satisfies Task<T, E>
    return Object.freeze(task)
}

export const Done: <T, E = unknown>(t: T) => Task<T, E> = (t) => TaskOf((done) => done(t))
export const Fail: <T, E>(e: E) => Task<T, E> = (e) => TaskOf((_, fail) => fail(e))
