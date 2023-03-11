import { errResult as err, okResult as ok } from 'cs544-js-utils';

import bcrypt from 'bcrypt';
import mongo from 'mongodb';

class Auth {
  constructor(params) {
    Object.assign(this, params);
  }

  //factory method
  static async make(params) {
    try {
      const {  bcryptRounds: _bcryptRounds = 10 } = params;
      const _client = await mongo.connect(params.dbUrl, MONGO_CONNECT_OPTIONS);
      const _auths = _client.db().collection(params.tables.authInfos);
      const authParams = {
	_client, _auths, 
	_bcryptRounds,
	_sessions: new Sessions(params),
      };
      return new Auth(authParams);
    }
    catch (err) {
      const message = `cannot connect to URL "${params.dbUrl}": ${err}`;
      return new AppErrors().add({ message, options: {code: 'DB'}, });
    }
  }

  /** Release all resources held by this instance.  */
  async close() {
    await this._client.close();
    this._sessions.close();
  }

  /** Clear out all courses */
  async clear() {
    try {
      await this._auths.deleteMany({});
      return {};
    }
    catch (err) {
      const message = `cannot clear collections: ${err}`;
      return new AppErrors().add({ message, options: { code: 'DB'} });
    }
  }
  
  async login(params) {
    try {
      const { loginId, pw } = params;
      let errors = new AppErrors();
      if (!loginId) {
	const options = { code: 'BAD_VAL', widget: 'loginId', };
	errors.add({ message: 'missing login id', options });
      }
      if (!pw) {
	const options = { code: 'BAD_VAL', widget: 'pw', };
	errors.add({ message: 'missing password', options });
      }
      if (errors.errors.length > 0) return errors;
      const authInfo = (await this._auths.findOne({_id: loginId}))?.authInfo;
      if (!authInfo || !(await bcrypt.compare(pw, authInfo.hash))) {
	const err = { message: 'invalid login', options: { code: 'AUTH', } };
	throw new AppErrors().add(err);
      }
      const authInfo1 = Object.assign({}, authInfo);
      delete authInfo1.hash;
      return this._sessions.newSession(authInfo1);
    }
    catch (err) {
      return (err.errors) ? err : new AppErrors().add(err);
    }
  }

  /** return authInfo for sessionId; {errors} if none */
  async renew(sessionId) {
    return this._sessions.get(sessionId);
  }

  async logout(sessionId) { return this._sessions.remove(sessionId); }
  
  /** create / update authInfo specified by params */
  async add(params) {
    try {
      const {loginId, pw} = params;
      if (!loginId) {
	const options = { code: 'BAD_VAL' };
	return new AppErrors().add({ message: 'missing login ID', options });
      }
      if (!pw) {
	const options = { code: 'BAD_VAL' };
	return new AppErrors().add({ message: 'missing password', options });
      }
      const hash = await bcrypt.hash(pw, this._bcryptRounds);
      const authInfo = Object.assign({}, params, { hash });
      delete authInfo.pw; //never store password
      const result =
        await this._auths.updateOne({_id: loginId}, { $set:  {authInfo} },
				    { upsert: true });
      return {};
    }
    catch (err) {
      return (err.errors) ? err : new AppErrors().add(err);
    }
  }

}


class Sessions {
  constructor(params) {
    const { timeoutSeconds=15*60, purgePeriodSeconds=1*60, } = params;
    this._timeoutMillis = timeoutSeconds * 1000;
    this._purgePeriodMillis = purgePeriodSeconds * 1000;
    this._idBase = Date.now();
    const purge = this.purge.bind(this);
    this._sessions = {};
    this._purgeId = setInterval(() => this.purge(),  this._purgePeriodMillis);
  }

  close() {
    clearInterval(this._purgeId);
    this._sessions = {};
    return {};
  }

  newSession(info) {
    const sessionId = this._genSessionId();
    const sessionInfo = {
      sessionId, ...info,
      expires: Date.now() + this._purgePeriodMillis,
    };
    this._sessions[sessionId] = sessionInfo;
    return this._xSessionInfo(sessionInfo);
  }

  remove(sessionId) {
    const sessionInfo = this._sessions[sessionId];
    if (sessionInfo) {
      delete this._sessions[sessionId];
      return {};
    }
    else {
      return new AppErrors().add({ message: `no session ${sessionId}`,
				   options: { code: 'NOT_FOUND' } });
    }
  }

  get(sessionId) {
    const sessionInfo = this._sessions[sessionId];
    if (sessionInfo) {
      sessionInfo.expires = Date.now() + this._timeoutMillis;
      return this._xSessionInfo(sessionInfo);
    }
    else {
      const err = {
	message: `no session ${sessionId}`,
	options: { code: 'AUTH' }
      };
      return new AppErrors().add(err);
    }
  }

  // could make more efficient by linking sessions into doubly-linked
  // list ordered by expiry time
  purge() {
    const sessions =
      Object.values(this._sessions).sort((a, b) => a.expires - b.expires);
    const now = Date.now();
    for (const session of sessions) {
      if (session.expires > now) continue;
      delete this._sessions[session.sessionId];
    }
  }
  
  _genSessionId() {
    const id = String(this._idBase) + String(Math.random()).slice(1);
    this._idBase++;
    return id;
  }

  _xSessionInfo(sessionInfo) {
    const xSessionInfo = Object.assign({}, sessionInfo);
    delete xSessionInfo.expires;
    xSessionInfo.maxAgeSeconds = (this._timeoutMillis - 1000)/1000;
    return xSessionInfo;
  }
  
}

export default Auth.make;
