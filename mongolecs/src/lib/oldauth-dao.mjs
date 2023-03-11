import { MongoClient } from "mongodb";
import { okResult as ok, errResult as err } from "cs544-js-utils";
export default async function makeAuthDao(dbUrl){
    return await AuthDao.make(dbUrl);
}

class AuthDao{
    constructor(params){ Object.assign(this,params); // Storing parameters in self
    }
    static async make(dbUrl){
        const params={};
        try{
            params._client= await(new MongoClient(dbUrl)).connect(); //Not synchronous hence needs await
            const db= params._client.db(); //Synchronous
            const users = db.collection(USERS_COLLECTION);
            params.users=users;
            await users.createIndex('loginId');
            params.count = await users.countDocuments();
            return ok(new AuthDao(params)); //Calling construstor 
            //Calling async factory method when your function invokes an sync method
        }
        catch(error){
            return err(error.message, {code:'DB'})
        }
    }

    async close(){
        try{
            await this._client.close();
        }catch(e){
            err(e.message, {code:'DB'});
        }
    }

    async add(user){
        const {loginId} = user;
        const result = await this.getByLoginId(loginId);
        if(!result.errors){
            const msg= `there is already a user for login ${loginId}`;
            return err(msg, {code: 'EXISTS'});
        }else if(result.errors.length>1 || result.errors[0].options.code !== 'NOT_FOUND' ){
            return result;
        }
        const userId = await this.#nextUserId();
        const dbObj = {_id: userId, ...user };
        try{
            const collection = this.users;
            const insertResult = await collection.insertOne(dbObj);
            const id1 = insertResult.insertedId;
            if (id1 !== userId){
                const msg= `expected inserted id $ '${id1}' to equal '`;
                return err(msg, {code: 'DB'});
            }
        }
        catch(e){
            return err(e.msg, {code: 'DB'})
        }
        return ok({userId, ...user});
    }
    async getByUserId(userId){
        try{
            const collection = this.users;
            const dbEntry = await collection.findOne({_id:userId});
            if (dbEntry){
                const user= {userId, ...dbEntry};
                delete user._id;
                return ok(user);
            }
            else{
                return err(`no user for id '${userId}'`,{code:'NOT FOUND'});
            }
        }
        catch(e){
            return err(e.message, {code:'DB'});
        }
    }

    async getByLoginId(loginId){
        try{
            const collection = this.users;
            const dbEntry = await collection.findOne({loginId});
            if (dbEntry){
                const user= {...dbEntry};
                user.userId = user._id;
                delete user._id;
                return ok(user);
            }else{
                return err(`no user for id '${loginId}'`,{code:'NOT_FOUND'});
            }
        }catch(e){
            return err(e.message, {code: 'DB'});
        }
    }
    async query(filter){
        try{
            const index = filter.index??0;
            const count = filter.count?? DEFAULT_COUNT;
            const collection = this.users;
            const q = {...filter};
            if(q.userId){
                q._id=q.userId;
                delete q.userId;
            }
            delete q.index;
            delete q.count;
            const cursor = await collection.find(q);
            const dbEntries = await cursor.sort({_id:1}).skip(index).limit(count).toArray();
            const entries = dbEntries.map(d => {
                const e = {...d};
                e.userId=e._id;
                delete e._id;
                return e;
            });
            return ok(entries);
        }
        catch(e){
            return err(e.message, 'DB');
        }
    }

    async remove(userId){
        try{
            const collection=this.users;
            const delResult = await collection.deleteOne({_id: userId});
            if(!delResult){
                return err(`unexpected falsy DeleteResult`,{code:'DB'});
            }else if(delResult.deletedCount ===0){
                const msg= `no user for userId ${userId}`;
                return err(msg, {code:'NOT_FOUND'});
            }
            else if(delResult.deletedCount !==1){
                const msg= `expected 1 deletion; get ${delResult.deletedCount}`;
                return err(msg, {code:'DB'});
            }else{
                return ok();
            }
        }catch(e){
            return err(e.message,{code:'DB'});
        }
    }

    async update(userId, updates) {
        try{
            const collection = this.users;
            const dbUpdates = [ {$set: updates}, {returnDocument: 'after'} ];
            const updateResult =
                await collection.findOneAndUpdate({_id: userId}, ...dbUpdates);
            if (!updateResult) {
                return err(`unexpected falsy UpdateResult`, {code: 'DB'});
            }
            else if (!updateResult.value) {
                const msg = `no user for userId ${userId}`;
                return err(msg, { code: 'NOT_FOUND' });
            }
            else {
                const user = { ... updateResult.value };
                user.userId = user._id;
                delete user._id;
                return ok(user);
            }
        }
        catch(e){
            return err(e.message,{code: 'DB'});
        }
    }
    async clear(){
        try{
            await this.users.deleteMany({});
            return ok();
        }catch(e){
            return err(e.message, {code:'DB'});
        }
    }
    async #nextUserId(){
        const query = {_id: NEXT_ID_KEY};
        const update = {$inc: {[NEXT_ID_KEY]:1} };
        const options = {upsert: true,  returnDocument:'after'};
        const ret = await this.users.findOneAndUpdate(query, update, options);
        const seq = ret.value[NEXT_ID_KEY];
        return String(seq)+ Math.random.toFixed(RAND_LEN).replace(/^0\./, '_');
    }
} // AuthDao

const USERS_COLLECTION = 'users';
const DEFAULT_COUNT = 5;

const NEXT_ID_KEY = 'count';
const RAND_LEN = 2;