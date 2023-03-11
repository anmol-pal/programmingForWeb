import Path from 'path';

import makeDao from './auth-dao.mjs';
import makeServices from './auth-services.mjs';

export default async function main(args) {
  if (args.length !== 3) {
    usage();
  }
  let dao;
  try {
    const [dbUrl, cmd, paramsJson] = args;
    const daoResult = await makeDao(dbUrl);
    if (daoResult.errors) panic(daoResult);
    dao = daoResult.val;
    const services = makeServices(dao);
    if (CMDS.indexOf(cmd) < 0) {
      panic(`invalid command ${cmd}; must be one of ${CMDS.join('|')}`);
    }
    let params;
    try {
      params = JSON.parse(paramsJson);
    }
    catch (e) {
      panic(`bad data json ${paramsJson}; ${e.message}`);
    }
    const result = await services[cmd].call(services, params);
    if (result.errors) panic(result);
    console.log(result.val);
  }
  catch (e) {
    panic(e);
  }
  finally {
    if (dao) await dao.close();
  }
}

const CMDS = [
  'register', 'login', 'get', 'query', 'update', 'remove', 'clear'
];
function usage() {
  panic(`usage: ${Path.basename(process.argv[1])} DB_URL (${CMDS.join('|')}) 
        PARAMS_JSON`.replace(/\s\s+/g, ' '));
}

function panic(err) {
  if (err.errors) {
    for (const e of err.errors) {
      console.error(e.message);
    }
  }
  else {
    console.error(err.toString());
  }
  process.exit(1);
}
