export const it = (what: string, fn: () => void | Promise<void>) => {
    Deno.test({
        name: what,
        fn,
    })
}

type Scope = {
    it: (desc: string, cb: () => void | Promise<void>) => void
    test: (desc: string, cb: () => void | Promise<void>) => void
    describe: (what: string, cb: (scope: Scope) => void) => void
}

export const describe = (what: string, cb: (scope: Scope) => void) => {
    cb({
        it: (desc, cb) => {
            Deno.test({
                name: `::${what}: ${desc}`,
                fn: cb,
            })
        },
        test: (desc, cb) => {
            Deno.test({
                name: `::${what} :: ${desc}`,
                fn: cb
            })
        },
        describe: (sub, cb) => describe(`${what}.${sub}`, cb),
    })
}
