import { None, type Option, OptionOf, Some } from 'dots'

const parseNum = (s: string): Option<number> => {
    const maybeNum = Number(s)
    return Number.isFinite(maybeNum) ? Some(maybeNum) : None()
}

/**
 * Get the number at nth occurance in a text
 */
const getNthNumber = (text: string, n: number): Option<number> => {
    const nums = text
        .split(' ')
        .map(parseNum)
        .filter((n) => n.isSome())
    return OptionOf(nums.at(n)).flatMap((opt) => opt)
}
