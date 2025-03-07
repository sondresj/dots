# DoTS

[![JSR](https://jsr.io/badges/@sj/dots)](https://jsr.io/@sj/dots) [![CI](https://github.com/sondresj/dots/actions/workflows/check.yml/badge.svg?branch=main)](https://github.com/sondresj/dots/actions/workflows/check.yml)

Friendly monadic types inspired by Rust.
Fully typed Do-notation.
Misc functional programming utils (such as pipe and combine).

> [!WARNING]
> This project is still a work in progress, breaking changes is likely.
> Semantic versioning does not necessarily apply until a 1.0 release

> [!NOTE]
> Instances of Option, Result, Task and Iter are frozen (immutable) and are [null-prototype objects](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object#null-prototype_objects)

## How does it work?

Do notation in typescript is not natively supported, but can be achieved using generator functions.
However, the typescript types for Generator and Iterator assumes the same type T is yielded from a generator,
to work around this, we can yield a _yielder_ instead, which is a generator function that yields itself.
This is why the monadic types here implements [Symbol.iterator] and also why the `yield*` operator is required in a do-block.

## Example

```typescript
import { Do, Done, Fail, None, type Option, Some, Task, taskify } from 'dots'

export class RequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly content: {
            message: string
            status: string
            body: Option<any>
        },
        public readonly inner: Option<Error>,
    ) {
        super(content.message)
    }
}

const _taskFetch = taskify(fetch)
const taskFetch: typeof _taskFetch = (...args) =>
    _taskFetch(...args).mapFailure((err) => {
        // Fetch rejected with no response from the uri
        return new RequestError(500, {
            message: (err as any)?.message ?? 'Unknown Error',
            status: 'Unknown',
            body: None(),
        }, Some(err as any))
    })

export const request = Do.bind(function* <T>(
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
    uri: string,
    headers: Record<PropertyKey, any> = {},
    body: Record<PropertyKey, any> = {},
) {
    const response = yield* taskFetch(uri, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
    })

    const json = yield* Task(response.json())
        .mapFailure((err) => {
            return new RequestError(500, {
                message: (err as any)?.message ?? 'Invalid JSON Response',
                status: 'Unknown',
                body: None(), // could be response.text() instead
            }, Some(err as any))
        })

    if (response.ok) {
        return Done<T, RequestError>(json as NonNullable<T>)
    }

    return Fail<T, RequestError>(
        new RequestError(response.status, {
            status: response.statusText,
            message: 'Response indicated not OK',
            body: Some(json),
        }, None()),
    )
})
```
