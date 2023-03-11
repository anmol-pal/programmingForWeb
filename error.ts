type Code = string;
export type ErrOptions = {
    code: Code;
    [opt: string]: string;
};

export class Err{
    readonly message: string;
    readonly options?: ErrOptions;
    constructor(message: string, options?: ErrOptions){
        this.message = message;
        this.options = options;
    }
};
export type ErrSpec= string| Err | Error | Object;

export function error (e: ErrSpec, options?:ErrOptions| Code): Err{
    const opts = (typeof options==='string') ? {code: options} : options;
    return (typeof e === 'string')
    ? new Err(e, opts)
    : (e instanceof Err)
    ? e
    : (e instanceof Error)
    ? new Err(e.message, opts)
    : new Err(e.toString(), opts);
}

export class OkResult<T>{
    readonly isOk = true;
    readonly val: T;
    constructor(v:T) {this.val=v;}

    chain<T1>(fn: (v:T) => Result<T1>): Result<T1>{
        return fn(this.val);
    }
}

export class ErrResult{
    readonly isOk= false;
    readonly errors: Err[];
    constructor(errors: Err[]=[]) {this.errors=errors}
    addError(e: ErrSpec, options?:Code| ErrOptions): ErrResult{
        return new ErrResult(this.errors.concat(error(e, options)));
    }
    chain<T1>(_fn: (v: ErrSpec) => Result<T1>): Result<T1>{
        return this;
    }
}

export type Result<T> = OkResult<T> | ErrResult;

export function okResult<T>(v:T) {return new OkResult(v); }

export function errResult(e:ErrSpec, options?: Code|ErrOptions): ErrResult{
    return new ErrResult().addError(e, options);
}

function demo(result: Result<number>): Result<string>{
    if(!result.isOk) return result as Result<string>;
    const v = result.val+1;
    return result.chain((val: number) => okResult('x'.repeat(v*val)));
}

console.log(demo(errResult('errrrr','ERR')));
console.log(demo(okResult(2)));