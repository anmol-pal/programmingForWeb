type Code = string;
export type ErrOptions = {
    code: Code;
    [opt: string]: string;
};
let x:ErrOptions={code: 'Hello', key:'val'};
console.log(x);