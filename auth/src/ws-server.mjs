import cors from 'cors';
import express from 'express';
import assert from 'assert';
import querystring from 'querystring';

import fs from 'fs';
import http from 'http';
import https from 'https';

//HTTP status codes
const OK = 200;
const CREATED = 201;
const NO_CONTENT = 204;
const BAD_REQUEST = 400;
const UNAUTHORIZED = 401;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

export default function serve(model, base='/sessions') {
  const app = express();
  app.locals.base = base;
  app.locals.model = model;
  setupRoutes(app);
  return app;
}


function setupRoutes(app) {
  const base = app.locals.base;
  app.use(cors({exposedHeaders: 'Location'}));
  app.use(express.json());
  app.post(`${base}`, doCreateSession(app));
  app.patch(`${base}/:sessionId`, doRenewSession(app));
  app.delete(`${base}/:sessionId`, doDeleteSession(app));

  //must be last
  app.use(do404(app));
  app.use(doErrors(app));
}


function doCreateSession(app) {
  return (async function(req, res) {
    try {
      const loginInfo = req.body;
      const sessionInfo = await app.locals.model.login(loginInfo);
      if (sessionInfo.errors) throw sessionInfo;
      const { sessionId } = sessionInfo;
      res.location(sessionId);
      res.status(CREATED).json(sessionInfo);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doRenewSession(app) {
  return (async function(req, res) {
    try {
      const sessionId = req.params.sessionId;
      const result = await app.locals.model.renew(sessionId);
      if (result.errors) throw result;
      res.json(result);
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doDeleteSession(app) {
  return (async function(req, res) {
    try {
      const sessionId = req.params.sessionId;
      const result = await app.locals.model.logout(sessionId);
      if (result.errors) throw result;
      res.json({});
    }
    catch(err) {
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}


/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app) {
  return async function(req, res) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result = {
      status: NOT_FOUND,
      errors: [	{ options: { code: 'NOT_FOUND' }, message, }, ],
    };
    res.status(404).json(result);
  };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    const message = err.message ?? err.toString();
    const result = {
      status: SERVER_ERROR,
      errors: [ { options: { code: 'INTERNAL' }, message } ],
    };
    res.status(SERVER_ERROR).json(result);
    console.error(result.errors);
  };
}

/*************************** Mapping Errors ****************************/

//map from domain errors to HTTP status codes.  If not mentioned in
//this map, an unknown error will have HTTP status BAD_REQUEST.
const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND,
  AUTH: UNAUTHORIZED,
  DB: SERVER_ERROR,
  INTERNAL: SERVER_ERROR,
}

/** Return first status corresponding to first option.code in
 *  appErrors, but SERVER_ERROR dominates other statuses.  Returns
 *  BAD_REQUEST if no code found.
 */
function getHttpStatus(appErrors) {
  let status = null;
  for (const appError of appErrors) {
    const errStatus = ERROR_MAP[appError.options?.code];
    if (!status) status = errStatus;
    if (errStatus === SERVER_ERROR) status = errStatus;
  }
  return status ?? BAD_REQUEST;
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapResultErrors(err) {
  const errors = err.errors ?? [ { message: err.message ?? err.toString() } ];
  const status = getHttpStatus(errors);
  if (status === SERVER_ERROR)  console.error(errors);
  return { status, errors, };
} 

