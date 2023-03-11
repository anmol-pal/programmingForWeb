import * as mongo from 'mongodb';

import { okResult, errResult, Result} from 'cs544-js-utils';

import { User, RegisteredUser } from './user.js';

export async function makeAuthDao(dbUrl: string) {
  return await AuthDao.make(dbUrl);
}

type DbUser = RegisteredUser & { _id?: mongo.ObjectId };

export class AuthDao {
  #client: mongo.MongoClient;
  #users: mongo.Collection;
  #count: number;
  
  constructor(params: { [key: string]: any }) {
    this.#client = params.client;
    this.#users = params.users;
    this.#count = params.count;
  }

  static async make(dbUrl: string) : Promise<Result<AuthDao>> {
    const params: { [key: string]: any } = {};
    try {
      params.client = await (new mongo.MongoClient(dbUrl)).connect();
      const db = params.client.db();
      const users = db.collection(USERS_COLLECTION);
      params.users = users;
      await users.createIndex('userId');
      await users.createIndex('loginId');
      params.count = await users.countDocuments();
      return okResult(new AuthDao(params));
    }
    catch (error) {
      return errResult(error.message, 'DB');
    }
  }

  /** close off this DAO; implementing object is invalid after 
   *  call to close() 
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() {
    try {
      await this.#client.close();
    }
    catch (e) {
      errResult(e.message, 'DB');
    }
  }

  /** add user.
   *  Error Codes: 
   *    EXISTS: user with specific loginId already exists
   *    DB: a database error was encountered.
   */
  async add(user: User) : Promise<Result<RegisteredUser>> {
    const { loginId } = user;
    const result = await this.getByLoginId(loginId);
    if (result.isOk === true) {
      const msg = `there is already a user for login ${loginId}`;
      return errResult(msg, { code: 'EXISTS' });
    }
    else if (result.errors.length > 1 ||
	     result.errors[0].options.code !== 'NOT_FOUND') {
      return result;
    }
    const userId = await this.#nextUserId();
    const dbObj = { userId, ...user };
    try {
      const collection = this.#users;
      await collection.insertOne(dbObj);
    }
    catch (e) {
      return errResult(e.message, 'DB');
    }
    return okResult({userId, ...user} as RegisteredUser);
  }

  /** retrieve user by userId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  async getByUserId(userId: string) : Promise<Result<RegisteredUser>> {
    try {
      const collection = this.#users;
      const dbEntry = await collection.findOne({userId}) as DbUser;
      if (dbEntry) {
	const user = { ...dbEntry };
	delete user._id; //do not expose implementation details
	return okResult(user as RegisteredUser);
      }
      else {
	return errResult(`no user for id '${userId}'`, { code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return errResult(e.message, 'DB');
    }
  }

  /** retrieve user by loginId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  async getByLoginId(loginId: string) {
    try {
      const collection = this.#users;
      const dbEntry = await collection.findOne({loginId});
      if (dbEntry) {
	const user = { ...dbEntry };
	delete user._id; //do not expose implementation details
	return okResult(user);
      }
      else {
	return errResult(`no user for id '${loginId}'`, { code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return errResult(e.message, 'DB');
    }
  }

  /** return list of all users which match filter.  It is not an error
   *  if no users match.
   *
   *  Error codes:
   *    DB: a database error.
   */
  async query(filter: { [key: string]: string|number})
    : Promise<Result<RegisteredUser[]>>
  {
    try {
      const index: number = filter.index as number ?? 0;
      const count: number = filter.count as number ?? DEFAULT_COUNT;
      const collection = this.#users;
      const q = { ...filter };
      delete q.index; delete q.count;
      const cursor = await collection.find(q);
      const dbEntries = await cursor
            .sort({userId: 1}).skip(index).limit(count).toArray();
      const entries = dbEntries.map(d => {
	const e = { ...(d as DbUser)  };
	delete e._id; //do not expose implementation details
	return e;
      });
      return okResult(entries);
    }
    catch (e) {
      return errResult(e.message, 'DB');
    }
  }

  /** remove user specified userId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  async remove(userId: string) : Promise<Result<undefined>> {
    try {
      const collection = this.#users;
      const delResult = await collection.deleteOne({userId});
      if (!delResult) {
	return errResult(`unexpected falsy DeleteResult`, {code: 'DB'});
      }
      else if (delResult.deletedCount === 0) {
	const msg = `no user for userId ${userId}`;
	return errResult(msg, { code: 'NOT_FOUND' });
      }
      else if (delResult.deletedCount !== 1) {
	const msg = `expected 1 deletion; got ${delResult.deletedCount}`;
	return errResult(msg, 'DB');
      }
      else {
	return okResult(undefined);
      }
    }
    catch (e) {
      return errResult(e.message, 'DB');
    }
  }

  /** add updates to user specified userId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  async update(userId: string, updates: {[key:string]: string}) {
    try {
      const collection = this.#users;
      const updateOp = {$set: updates};
      const updateOpts = {returnDocument: mongo.ReturnDocument.AFTER};
      const updateResult =
	await collection.findOneAndUpdate({userId}, updateOp, updateOpts);
      if (!updateResult) {
	return errResult(`unexpected falsy UpdateResult`, {code: 'DB'});
      }
      else if (!updateResult.value) {
	const msg = `no user for userId ${userId}`;
	return errResult(msg, { code: 'NOT_FOUND' });
      }
      else {
	const user = { ... (updateResult.value as DbUser) };
	delete user._id;
	return okResult(user);
      }
    }
    catch (e) {
      console.error(e);
      return errResult(e.message, 'DB');
    }
  }


  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async clear() : Promise<Result<undefined>> {
    try {
      await this.#users.deleteMany({});
      return okResult(undefined);
    }
    catch (e) {
      return errResult(e.message, 'DB');
    }
  }
 
  async #nextUserId() : Promise<string> {
    const query = { userId: NEXT_ID_KEY };
    const update = { $inc: { [NEXT_ID_KEY]: 1 } };
    const options =
      { upsert: true, returnDocument: mongo.ReturnDocument.AFTER };
    const ret =  await this.#users.findOneAndUpdate(query, update, options);
    const seq = ret.value[NEXT_ID_KEY];
    return String(seq) + Math.random().toFixed(RAND_LEN).replace(/^0\./, '_');
  }
 
} //class AuthDao

const USERS_COLLECTION = 'users';
const DEFAULT_COUNT = 5;

const NEXT_ID_KEY = 'count';
const RAND_LEN = 2;