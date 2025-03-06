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
