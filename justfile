default:
    @just --list

check:
    deno lint ./src
    deno fmt ./src --check
    deno check ./src
    deno test ./tests
    deno doc --lint ./src/mod.ts

watch:
    deno test ./tests --watch
