function strRepeat(str, repeat) {
    return Array.from({ length: repeat })
        .map((_, i) => str.repeat(i + 1));
}
globalThis.console.log(strRepeat('a', 2));
