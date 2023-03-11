//will run the project DAO using an in-memory mongodb server
import AuthDao from './auth-mem-dao.mjs';
import makeAuthServices from '../src/auth-services.mjs';

import testUsers from './test-users.mjs';

import chai from 'chai';
const { expect } = chai;

describe('auth services', () => {

  //mocha will run beforeEach() before each test to set up these variables
  let dao;
  let services;
  beforeEach(async function () {
    dao = await AuthDao.setup();
    services = makeAuthServices(dao);
  });

  //mocha runs this after each test; we use this to clean up the DAO.
  afterEach(async function () {
    await AuthDao.tearDown(dao);
  });
  
  it('should register a user without any errors', async () => {
    const result = await services.register(USERS[0]);
    expect(result.errors).to.be.undefined;
    expect(result.val.userId).to.be.a('string');
  });

  it('should login previously registered users without errors', async () => {
    for (const u of USERS) {
      const result = await services.register(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
    }
    for (const u of USERS) {
      const result = await services.login(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
    }
  });

  it('should retrieve previously registered users without errors', async () => {
    const userIds = [];
    for (const u of USERS) {
      const result = await services.register(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
      userIds.push(result.val.userId);
    }
    for (const userId of userIds) {
      const result = await services.get({userId});
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
    }
  });

  it('should error NOT_FOUND when retrieving with bad userId', async () => {
    const userIds = [];
    for (const u of USERS) {
      const result = await services.register(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
      userIds.push(result.val.userId);
    }
    for (const userId of userIds) {
      const result = await services.get({userId: userId + '1'});
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('NOT_FOUND');
    }
  });

  it('should error NOT_FOUND when removing with bad userId', async () => {
    const userIds = [];
    for (const u of USERS) {
      const result = await services.register(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
      userIds.push(result.val.userId);
    }
    for (const userId of userIds) {
      const result = await services.remove({userId: userId + '1'});
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('NOT_FOUND');
    }
  });

  it('should not login removed users with error BAD_LOGIN', async () => {
    let userIds = [];
    for (const u of USERS) {
      const result = await services.register(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
      userIds.push(result.val.userId);
    }
    for (const userId of userIds) {
      const result = await services.remove({userId});
      expect(result.errors).to.be.undefined;
      expect(result.val).to.be.undefined;
    }
    for (const u of USERS) {
      const result = await services.login(u);
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('BAD_LOGIN');
    }
  });

  it('should not login unregistered users with error BAD_LOGIN', async () => {
    for (const u of USERS) {
      const result = await services.login(u);
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('BAD_LOGIN');
    }
  });
  
  it('should error BAD_REQ on missing fields', async () => {
    for (const field of [ 'loginId', 'firstName', 'lastName', 'password']) {
      const user = { ...USERS[0] };
      delete user[field];
      const result = await services.register(user);
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('BAD_REQ');
    }
  });

  it('should error BAD_VAL on bad fields', async () => {
    for (const [field, val] of BAD_VALS) {
      const user = { ...USERS[0] };
      user[field] = val;
      const result = await services.register(user);
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('BAD_VAL');
    }
  });
  
  it('should error BAD_VAL on bad firstName', async () => {
    const user = { ...USERS[0] };
    user.firstName += '@';
    const result = await services.register(user);
    expect(result.errors).to.not.be.undefined;
    expect(result.errors).to.have.length(1);
    expect(result.errors[0]?.options?.code).to.equal('BAD_VAL');
  });
  
  it('should error BAD_VAL on bad lastName', async () => {
    const user = { ...USERS[0] };
    user.lastName += '&';
    const result = await services.register(user);
    expect(result.errors).to.not.be.undefined;
    expect(result.errors).to.have.length(1);
    expect(result.errors[0]?.options?.code).to.equal('BAD_VAL');
  });
  
  it('should error BAD_VAL on insufficiently strong password', async () => {
    const user = { ...USERS[0] };
    user.password = user.password.replace(/\W/g, '');
    const result = await services.register(user);
    expect(result.errors).to.not.be.undefined;
    expect(result.errors).to.have.length(1);
    expect(result.errors[0]?.options?.code).to.equal('BAD_VAL');
  });
  
  it('should update previously registered users without errors', async () => {
    const users = [];
    for (const u of USERS) {
      const result = await services.register(u);
      expect(result.errors).to.be.undefined;
      expect(result.val.userId).to.be.a('string');
      users.push(result.val);
    }
    for (const user of users) {
      const update = { userId: user.userId, firstName: 'x' };
      const result = await services.update(update);
      expect(result.errors).to.be.undefined;
      expect(result.val).to.deep.equal({...user, firstName: 'x'});
    }
  });

  it('updating forbidden fields should result in BAD_VAL errors', async () => {
    const user = USERS[0];
    const result = await services.register(user);
    expect(result.errors).to.be.undefined;
    const u = result.val;
    expect(u.userId).to.be.a('string');
    for (const prop of ['loginId', 'passwordHash']) {
      const update = { userId: u.userId, [prop]: 'x' };
      const result = await services.update(update);
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('BAD_VAL');
    }
  });

  it('should error BAD_VAL when updating fields with bad values', async () => {
    const user = USERS[0];
    const result = await services.register(user);
    expect(result.errors).to.be.undefined;
    const u = result.val;
    expect(u.userId).to.be.a('string');
    for (const [field, val] of BAD_VALS) {
      const update = { userId: u.userId, [field]: val };
      const result = await services.update(update);
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0]?.options?.code).to.equal('BAD_VAL');
    }
  });
  
  it('should query users respecting index and count', async () => {
    const users = [];
    for (const u of USERS) {
      const addResult = await services.register(u);
      expect(addResult.errors).to.be.undefined;
      expect(addResult.val.userId).to.be.a('string');
      users.push(addResult.val);
    }
    expect(users.length).to.equal(USERS.length);
    const [index, count] = [2, 4];
    const qResult = await services.query({index, count});
    expect(qResult.errors).to.be.undefined;
    expect(qResult.val).to.have.length(count);
    expect(qResult.val).to.deep.equal(users.slice(index, index + count));
  });
  
  it('should query users respecting filter', async () => {
    const users = [];
    for (const u of USERS) {
      const addResult = await services.register(u);
      expect(addResult.errors).to.be.undefined;
      expect(addResult.val.userId).to.be.a('string');
      users.push(addResult.val);
    }
    expect(users.length).to.equal(USERS.length);
    const filter = { lastName: 'smith' };
    const [index, count] = [1, 2];
    const qResult = await services.query({index, count, ...filter});
    expect(qResult.errors).to.be.undefined;
    expect(qResult.val).to.have.length(count);
    const expected =
      users.filter(u => u.lastName === 'smith').slice(index, index + count);
    expect(qResult.val).to.deep.equal(expected);
  });
  

});

const PW = 'Abcd1234!';

const USERS = testUsers.map(u0 => {
  const u = { ...u0 };
  u.password = PW; delete u.passwordHash;
  return u;
});

const BAD_VALS = [
  [ 'loginId', 'zerksis+', ],
  [ 'firstName', 'zerksis(' ],
  [ 'lastName', 'zerksis)' ],
  [ 'password', 'Abcd12344', ],
  [ 'password', 'Abcd12!', ],
  [ 'password', 'abcd1234!' ],
  [ 'password', 'abcdefgh!' ],
];
