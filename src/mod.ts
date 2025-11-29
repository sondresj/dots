/**
 * DoTS - Do notation, fully Typescript compatible.
 * Together with the Result, Option and Task monad, one can remain in a pure functional (fantasy) land without resorting to untyped exceptions, null handling and unhandled rejections.
 *
 * @example Parse list of strings to numbers
 * ```typescript
 * import { None, Option, Some, identity } from 'dots'
 *
 * const parseNum = (s: string): Option<number> => {
 *     const maybeNum = Number(s)
 *     return Number.isFinite(maybeNum) ? Some(maybeNum) : None()
 * }
 *
 * /// Get the number at nth occurance in a text
 * const getNthNumber = (text: string, n: number): Option<number> => {
 *     const nums = text
 *         .split(' ')
 *         .map(parseNum)
 *         .filter((n) => n.isSome())
 *     return Option.of(nums.at(n)).flatMap(identity)
 * }
 * ```
 *
 * @example Safer `fetch` see {@link [../examples/request.ts]}
 * ```typescript
 * import { Do, Done, Fail, None, type Option, Some, taskify, Task } from 'dots'
 *
 * export class RequestError extends Error {
 *     constructor(
 *         public readonly status: number,
 *         public readonly content: {
 *             message: string
 *             status: string
 *             body: Option<any>
 *         },
 *         public readonly inner: Option<Error>,
 *     ) {
 *         super(content.message)
 *     }
 * }
 *
 * const _taskFetch = taskify(fetch)
 * const taskFetch: typeof _taskFetch = (...args) =>
 *     _taskFetch(...args).mapFailure((err) => {
 *         // Fetch rejected with no response from the uri
 *         return new RequestError(500, {
 *             message: (err as any)?.message ?? 'Unknown Error',
 *             status: 'Unknown',
 *             body: None(),
 *         }, Some(err as any))
 *     })
 *
 * export const request = Do.bind(function* <T>(
 *     method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
 *     uri: string,
 *     headers: Record<PropertyKey, any> = {},
 *     body: Record<PropertyKey, any> = {},
 * ) {
 *     const response = yield* taskFetch(uri, {
 *         method,
 *         headers,
 *         body: method !== 'GET' ? JSON.stringify(body) : undefined,
 *     })
 *
 *     const json = yield* Task(response.json())
 *         .mapFailure((err) => {
 *             return new RequestError(500, {
 *                 message: (err as any)?.message ?? 'Invalid JSON Response',
 *                 status: 'Unknown',
 *                 body: None(), // could be response.text() instead
 *             }, Some(err as any))
 *         })
 *
 *     if (response.ok) {
 *         return Done<T, RequestError>(json as NonNullable<T>)
 *     }
 *
 *     return Fail<T, RequestError>(
 *         new RequestError(response.status, {
 *             status: response.statusText,
 *             message: 'Response indicated not OK',
 *             body: Some(json),
 *         }, None()),
 *     )
 * })
 * ```
 *
 * Note: Instances of Option, Result, Task and Iter are frozen (immutable) and are [null-prototype objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object#null-prototype_objects)
 *
 * @module
 */
export * from './result.ts'
export * from './option.ts'
export * from './task.ts'
export * from './iter.ts'
export * from './range.ts'
export * from './do.ts'
export * from './fp.ts'
export * from './state.ts'
export * from './thunk.ts'
