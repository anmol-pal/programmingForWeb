const TIMEOUT_MIL=2*1000;

export function asyncSucc(fn, ...args){
    setTimeout(fn, TIMEOUT_MIL, ...args);
}

export function asyncErr(msg){
    setTimeout(()=> {throw new Error(msg)},TIMEOUT_MIL)
}

export const p= console.log;
export function t() {return new Date().toTimeString();}