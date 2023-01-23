# programmingForWeb
### install typescript
```
brew install typescript
```
### Convert TypeScript program to JavaScript -> Transpile
```
tsc --lib es2022 --target es2022 str-repeat.ts
tsc --lib es2022 str-repeat.ts --outFile str-repeat-legacy.js
```
#### Execeution 
```
(base) anmolpal@Anmols-Air programmingForWeb % node str-repeat.js 
[ 'a', 'aa' ]
(base) anmolpal@Anmols-Air programmingForWeb % node str-repeat-legacy.js 
[ 'a', 'aa' ]
```
