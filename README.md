# DoTS

[![JSR](https://jsr.io/badges/@sj/dots)](https://jsr.io/@sj/dots) [![CI](https://github.com/sondresj/dots/actions/workflows/check.yml/badge.svg?branch=master)](https://github.com/sondresj/dots/actions/workflows/check.yml)

Friendly monadic types inspired by Rust.
Fully typed Do-notation

## Example

````typescript
import { Do, Done, Fail, None, type Option, Some, taskify, TaskOf } from 'dots'

const _taskFetch = taskify(fetch)
const taskFetch: typeof _taskFetch = (...args) =>
    _taskFetch(...args).mapFailure((err) => {
        // Fetch rejected with no response from the uri
        return new RequestError(500, {
            message: (err as any)?.message ?? 'Unknown Error',
            status: 'Unknown error',
        }, Some(err as any))
    })

export class RequestError extends Error {
    constructor(
        public readonly status: number,
        public readonly content: {
            message: string
            status: string
            body: any
        },
        public readonly inner: Option<Error>,
    ) {
        super(content.message)
    }
}

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

    const json = yield* TaskOf(response.json())
        .mapFailure((err) => {
            // Fetch rejected with no response from the uri
            return new RequestError(500, {
                message: (err as any)?.message ?? 'Invalid json response',
                status: 'Unknown error',
            }, Some(err as any))
        })

    if (response.ok) {
        return Done<T, RequestError>(json as NonNullable<T>)
    }

    // Assuming not-ok responses are well-formed json
    return Fail<T, RequestError>(new RequestError(response.status, {body: json as any}, None()))
})
```

## TODO

- tests
- documentation (<https://jsr.io/docs/writing-docs#symbol-documentation>)
- other useful methods
- other useful monads (list, state, etc?)
- ???
- profit
````
