#!/usr/bin/env node

import Path from 'path';

async function main(args) {
  if ((args.length !== 1 && args.length !== 2)
      || (args.length == 2 && steps.indexOf(args[1]) < 0)) {
    usage();
  }
  const [doOrderModule, errStep] = args;
  try {
    const doOrder = (await import(`./${doOrderModule}`)).default;
    const modDesc = Path.basename(doOrderModule, '.mjs');
    const orderer = new AsyncOrderer(errStep);
    await doOrder(orderer, `${modDesc}`);
  }
  catch (err) {
    console.error(err);
  }
}


const steps = [ 'validate', 'order', 'email' ];  
function usage() {
  const prog = Path.basename(process.argv[1]);
  console.error(`usage: ${prog} DO_ORDER_PATH [${steps.join('|')}]`);
  process.exit(1);
}

class AsyncOrderer {
  constructor(errStep) {
    this.errStep = errStep;
  }

  validate(params, cb) {
    return this.#asyncSim(`${params} validated`, 'validate', cb);
  }
  placeOrder(status, cb) {
    return this.#asyncSim(`${status}; order placed`, 'order', cb);
  }
  sendEmail(status, cb) {
    return this.#asyncSim(`${status}; email sent`, 'email', cb);
  }
  
  #asyncSim(succVal, errStep, cb) {
    const err = this.errStep === errStep ? `${errStep} error` : null;
    if (cb) {
      setTimeout(cb, DELAY_MILLIS, succVal, err);
    }
    else {
      return new Promise((resolve, reject) => {
	const fn = () => {
	  if (err) {
	    reject(err);
	  }
	  else {
	    resolve(succVal);
	  }
	};
        setTimeout(fn, DELAY_MILLIS);
      });
    }
  }

}
const DELAY_MILLIS = 2*1000;

main(process.argv.slice(2)).catch(e => console.error(e));
