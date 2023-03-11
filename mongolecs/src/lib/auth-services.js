import {errResult as err, okResult as ok , makeValidator} from 'cs544-js-utils';
import bcrypt from 'bcrypt';

export function makeAuthServices(dao, rounds=DEFAULT_BCRYPT_ROUNDS) {
  return new AuthServices(dao, rounds);
}

export class AuthServices{
    constructor(dao, rounds){
        this.dao = dao;
        this.checker=makeValidator(CMDS);
        this.rounds=rounds;
    }
    async register(user){
        const chk = this.checker.validate('register', user);
        if (chk.errors) return chk;
        const passwordHash = await bcrypt.hash(user.password, this.rounds);
        const u = {passwordHash, ...user};
        delete u.password;
        return await this.dao.add(u);
    }
    async login(params){
        const chk= this.checker.validate('login',params);
        if(chk.errors) return chk;
        const {loginId, password} = params;
        const u = await this.dao.getByLoginId(loginId);
        if(u.errors|| !(await bcrypt.compare(password, u.val.passwordHash))){
            return err(`invalid login`, {code:'BAD_LOGIN'});
        }else{
            return u;
        }
    }
    async get(params){
        const chk= this.checker.validate('get', params);
        if (chk.errors) return chk;
        const {userId} = params;
        return await this.dao.getByUserId(userId);
    }
    async query(params){
        const chk= this.checker.validate('query', params);
        if (chk.errors) return chk;
        const result = await this.dao.query(chk.val);
        return result;
    }
    async update(params){
        const chk= this.checker.validate('update', params);
        if (chk.errors) return chk;
        const updates = {...params};
        delete updates.userId;
    }
    async clear(){
        return await this.dao.clear();
    }
}

const DEFAULT_BCRYPT_ROUNDS = 10;

const PW_RES = [ /\d/, /[A-Z]/, /[a-z]/, /\W/ ];
const MIN_PW_LEN = 8;
function chkPassword(pw) {
    if (/\s/.test(pw)) {
      return 'password cannot contain whitespace';
    }
    else if (pw.length < MIN_PW_LEN) {
      return `password must contain least ${MIN_PW_LEN} characters`;
    }
    else if (!PW_RES.every(re => re.test(pw))) {
      return `
        password must contain a one-or-more lowercase and uppercase
        alphabetic characters, a digit and a special character.
      `.replace(/\s+/g, ' ');
    }
    return '';
  }
  const CMDS = {
    register: {
      fields: {
        _id: { chk: () => `_id cannot be specified`,  },
        passwordHash: { chk: () => `passwordHash cannot be specified`,  },
        loginId: {
      chk: /[\w\-]+/,
      required: true,
        },
        firstName: {
      chk: /[\w\-\`\s\.]+/,
      required: true,
        },
        lastName: {
      chk: /[\w\-\`\s\.]+/,
      required: true,
        },
        password: {
      chk: pw => chkPassword(pw),
      required: true,
        },
      },
    },
    
    login: {
      fields: {
        loginId: { required: true, },
        password: { required: true, },
      },
    },
    
    get: {
      fields: {
        userId: { required: true, },
      },
    },
  
    query: {
      fields: {
        index: {
      chk: /\d+/,
      valFn: v => Number(v),
        },
        count: {
      chk: /\d+/,
      valFn: v => Number(v),
        },
      },
    },	
    
    remove: {
      fields: {
        userId: { required: true, },
      },
    },
  
    update: {
      fields: {
        userId: {	required: true,  },
        _id: { chk: () => `_id cannot be updated`,  },
        loginId: { chk: () => `loginId cannot be updated`,  },
        passwordHash: { chk: () => `passwordHash cannot be updated`,  },
        firstName: { chk: /[\w\-\`\s]+/,  },
        lastName: { chk: /[\w\-\`\s]+/, },
        password: { chk: pw => chkPassword(pw),  },
      },
    },
    
  };
  

