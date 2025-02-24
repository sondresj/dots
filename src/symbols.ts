import type { Option } from './option.ts'
import type { Result } from './result.ts'
import type { Task } from './task.ts'

export const optionSym = Symbol('$Option')
export const someSym = Symbol('$Some')
export const noneSym = Symbol('$None')
export const resultSym = Symbol('$Result')
export const okSym = Symbol('$Ok')
export const errSym = Symbol('$Err')
export const ofSym = Symbol('$Of')
export const taskSym = Symbol('$Task')
export const taskInitSym = Symbol('$TaskInit')

export const isOption = (obj: unknown): obj is Option<unknown> => !!(obj as any)[optionSym]
export const isSome = (obj: unknown): obj is Option<unknown> => !!(obj as any)[someSym]
export const isNone = (obj: unknown): obj is Option<unknown> => !!(obj as any)[noneSym]
export const isResult = (obj: unknown): obj is Result<unknown> => !!(obj as any)[resultSym]
export const isOk = (obj: unknown): obj is Result<unknown> => !!(obj as any)[okSym]
export const isErr = (obj: unknown): obj is Result<unknown> => !!(obj as any)[errSym]
export const isTask = (obj: unknown): obj is Task<unknown> => !!(obj as any)[taskSym]
