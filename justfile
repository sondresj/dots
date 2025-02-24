default:
    @just --list

check:
    deno lint ./src
    deno fmt ./src --check
    deno test ./tests

watch:
    deno test ./tests --watch ./tests,./src/
