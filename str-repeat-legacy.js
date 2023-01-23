function strRepeat(str, repeat) {
    return Array.from({ length: repeat })
        .map(function (_, i) { return str.repeat(i + 1); });
}
globalThis.console.log(strRepeat('a', 2));
//tsc --lib es2022 --target es2022 str-repeat.ts
