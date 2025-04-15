import { isPromise, setInstanceFor } from './util.ts'
import { Err, Ok, type Result } from './result.ts'

const TaskSymbol = Symbol('dots.task')

/**
 * The signature of a task initializer, similar to the Promise constructor
 * @param done the callback to call with the value T when the task completes
 * @param fail the callback to call with the error E if the task fails
 */
export type TaskInit<T, E> = (
    done: (t: T) => void,
    fail: (e: E) => void,
) => void

/**
 * Extract the type of T from a TaskInit<T, E>
 */
export type TaskValue<TInit> = TInit extends TaskInit<infer T, any> ? T : never

/**
 * Extract the type of E from a TaskInit<T, E>
 */
export type TaskError<TInit> = TInit extends TaskInit<any, infer E> ? E : never

/**
 * As opposed to Promise, a Task is lazy, ie a task must be executed in a `Do` or converted to a `Promise` via either `ok()`, `unwrap()`, `unwrapOr(...)` or `fire()`.
 * Note: a Task returned from `Do` must also be executed by converting it to a `Promise`
 */
export type Task<T, E = unknown> = {
    /**
     * Transform the value of a task, similar to Promise.then
     */
    map: <T2>(f: (t: NonNullable<T>) => T2) => Task<T2, E>
    /**
     * Transform the value of a task into a new task, similar to Promise.then
     */
    flatMap: <T2>(f: (t: T) => Task<T2, E>) => Task<T2, E>
    /**
     * Transform the failure variant of the task. similar to Promise.catch
     */
    mapFailure: <E2>(f: (e: E) => E2) => Task<T, E2>
    /**
     * Convert the task to a Promise of Result
     */
    ok: () => Promise<Result<T, E>>
    /**
     * Switch on the outcomes of a task, optionally returning a value for the resulting task. The resulting task will never be of the Fail variant
     */
    switch: <T1, T2>(
        cases: { done: (t: NonNullable<T>) => T1; fail: (err: E | null | undefined) => T2 },
    ) => Task<T1 | T2, never>
    /**
     * Unwrap the task, converting it to a Promise<T>.
     */
    unwrap: () => Promise<NonNullable<T>>
    /**
     * Unwrap the task, providing a fallback in case of the Fail variant, converting it to a Promise<T>. The Promise returned will never be rejected
     */
    unwrapOr: (alt: () => NonNullable<T>) => Promise<NonNullable<T>>
    /**                                                          e
     * Run the task, not caring about the result. Any error is discarded
     */
    fire: () => void

    /**
     * Task initializer
     */
    valueOf: TaskInit<T, E>
    /**
     * Yielder for Do-notation
     */
    [Symbol.iterator]: () => Iterator<Task<T, E>, T, any>
    __proto__: null
}

/**
 * Convert a function that returns a Promise-like (typically async functions) to one that returns a Task
 * @param f the function to convert
 * @returns a function with the same arguments as `f` that returns a Task
 */
export const taskify = <F extends (...args: any[]) => Promise<any>, E = unknown>(
    f: F,
): (...args: Parameters<F>) => Task<ReturnType<F> extends Promise<infer T> ? T : never, E> => {
    return (...args) =>
        Task((done, fail) => {
            try {
                f(...args).then(done, fail)
            } catch (err) {
                fail(err as E)
            }
        })
}

/**
 * Create a new Task
 * @param initOrPromise either a task initializer or a Promise-like.
 */
export const Task = <T, E = unknown>(initOrPromise: TaskInit<T, E> | Promise<T>): Task<T, E> => {
    const init = isPromise(initOrPromise)
        ? (done: (value: T) => void, fail: (error: E) => void) => initOrPromise.then(done, fail)
        : initOrPromise

    const task: Task<T, E> = {
        map: (f) => Task((done, fail) => init((val) => done(f(val!)), fail)) as any,
        flatMap: (f) => Task((done, fail) => init((val) => f(val as any).valueOf(done, fail), fail)),
        mapFailure: (f) => Task((done, fail) => init(done, (e) => fail(f(e)))) as any,
        switch: (cases) => Task((done) => init((val) => done(cases.done(val!)), (err) => done(cases.fail(err)))),
        ok: () => new Promise((resolve) => init((val) => resolve(Ok(val as any)), (err) => resolve(Err(err) as any))),
        unwrap: () => new Promise((resolve, reject) => init((val) => resolve(val!), (err) => reject(err))),
        unwrapOr: (alt) => new Promise((resolve) => init((val) => resolve(val!), () => resolve(alt()!))),
        fire: () => new Promise((resolve) => init(() => resolve(void 0), () => resolve(void 0))),
        valueOf: init,
        *[Symbol.iterator]() {
            return yield task
        },
        __proto__: null,

        // @ts-ignore private
        [TaskSymbol]: true,
    }
    return Object.freeze(task)
}
setInstanceFor(Task, TaskSymbol)

/**
 * Equivalent to Task(...)
 */
Task.of = Task

/**
 * Create a task that will complete with the given value
 * @param t the value to complete the task with
 */
export const Done = <T, E = unknown>(t: T): Task<T, E> => Task((done) => done(t))
/**
 * Create a task that will fail with the given error
 * @param e the error to fail the task with
 */
export const Fail = <T, E>(e: E): Task<T, E> => Task((_, fail) => fail(e))
