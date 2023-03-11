#!/usr/bin/env node

import authentication from '../src/auth.mjs';

import nodeUtils from 'cs544-node-utils';

import Path from 'path';

const { cwdPath, readJson } = nodeUtils;

//easy for testing; trivial to implement pw policy
const DUMMY_PW = 'asdf';

const SPECIALS = [
  { loginId: 'cs471',
    id: 'x123-456-789',
    pw: DUMMY_PW,
    roles: { cs471: [ 'read', 'write' ] },
  },
  { loginId: 'cs544',
    id: 'x987-654-321',
    pw: DUMMY_PW,
    roles: { cs544: [ 'read', 'write' ] },
  },
  { loginId: 'en101',
    id: 'x987-321-654',
    pw: DUMMY_PW,
    roles: { en101: [ 'read', 'write' ] },
  },
];
  

async function reload(config, peoplePath) {
  let auth;
  try {
    auth = await authentication(config.auth);
    if (auth.errors) errors(auth);
    await auth.clear();
    if (auth.errors) errors(auth);
    for (const special of SPECIALS) await auth.add(special);
    const people = await readJson(peoplePath);
    for (const person of people) {
      const { id, email } = person;
      const loginId = email.match(/^[^@]+/)[0];
      const personAuth = {
	loginId,
	id,
	pw: DUMMY_PW,
	roles: { student: [ 'read' ] },
      };
      const result = await auth.add(personAuth);
      if (result.errors) errors(result);
    }
  }
  catch (err) {
    errors(err);
  }
  finally {
    auth.close();
  }
}



function usage() {
  const prog = Path.basename(process.argv[1]);
  console.error(`usage: ${prog} CONFIG_PATH PEOPLE_PATH`);
  process.exit(1);
}

function errors(result) {
  if (result.errors) {
    for (const err of (result.errors ?? [])) console.error(err.toString());
  }
  else {
    console.error(err);
  }
  process.exit(1);
}

async function go(args) {
  if (args.length !== 2) usage();
  const config = (await import(cwdPath(args[0]))).default;
  await reload(config, args[1]);
}



go(process.argv.slice(2)).catch(err => console.error(err));

