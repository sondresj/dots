default:
    @just --list

check:
    deno lint ./src
    deno fmt ./src --check
    deno check ./src
    deno test ./tests

watch:
    deno test ./tests --watch ./tests,./src/
