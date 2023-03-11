#!/opt/homebrew/bin/node

//BAD CODE!!
function sleep(seconds) {
  const stop = Date.now() + seconds*1000;
  while (Date.now() < stop) {
    //busy waiting: yuck!
  }
}

setTimeout(() => console.log('timeout'),
	   10000 /*delay in milliseconds*/);

sleep(5);
console.log('sleep done');