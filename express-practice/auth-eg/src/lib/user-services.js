import {UserInfo, LoginUser, AuthUser, UserId, RegisteringUser, RegisteredUser } from './user.js';
import Ajv , {JSONSchemaType, ValidateFunction } from 'ajv/dist.2020.js'

import bcrypt from 'bcrypt';

import {AuthDao} from './auth-dao.js';

import { OkResult, errResult, ErrResult, Result } from 'cs544-js-utils';

type AsyncUserResult = Promise<Result<RegisteredUser>>;
type AsyncUsersResult = Promise<Result<RegisteredUser[]>>;
type StringToAnyMap = {[key:string]: any};
const DEFAULT_BCRYPT_ROUNDS = 10;
export default class Users{
    private readOnly dao: AuthDao;
    private readOnly bcryptRounds: number;

    constructor(doa: AuthDao, bcryptRounds= DEFAULT_BCRYPT_ROUNDS){
        this.dao=dao;
        this.bcryptRounds = bcryptRounds;
    }
}

async query(filter: {[key:string]: string| number}): AsyncUsersResult {
}


const ajv = new Ajv();
const schemaDefs = {
    name: {
        type: 'string',
        pattern: '^[\\w\\- \\.]+@{CONTENT}#x27'
    }
}