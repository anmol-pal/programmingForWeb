//will run the project DAO using an in-memory mongodb server
import AuthDao from './auth-mem-dao.mjs';

import USERS from './test-users.mjs';

import chai from 'chai';
const { expect } = chai;

describe('auth DAO', () => {

  //mocha will run beforeEach() before each test to set up these variables
  let dao;
  beforeEach(async function () {
    dao = await AuthDao.setup();
  });

  //mocha runs this after each test; we use this to clean up the DAO.
  afterEach(async function () {
    await AuthDao.tearDown(dao);
  });
  
  it('should add a user without any errors', async () => {
    const result = await dao.add(USERS[0]);
    expect(result.errors).to.be.undefined;
    expect(result.val.userId).to.be.a('string');
  });

  it('should retrieve previously added users', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    for (const u of added) {
      const result1 = await dao.getByUserId(u.userId);
      expect(result1.errors).to.be.undefined;
      expect(result1.val).to.deep.equal(u);
      const result2 = await dao.getByLoginId(u.loginId);
      expect(result2.errors).to.be.undefined;
      expect(result2.val).to.deep.equal(u);
    }
  });

  it('adding an existing user should result in EXISTS error', async () => {
    const result1 = await dao.add(USERS[0]);
    expect(result1.errors).to.be.undefined;
    expect(result1.val.userId).to.be.a('string');
    const result2 = await dao.add(USERS[0]);
    expect(result2.errors).to.not.be.undefined;
    expect(result2.errors).to.have.length(1);
    expect(result2.errors[0].options.code).to.equal('EXISTS');
  });


  it('should query users respecting index and count', async () => {
    const users = [];
    for (const u of USERS) {
      const addResult = await dao.add(u);
      expect(addResult.errors).to.be.undefined;
      expect(addResult.val.userId).to.be.a('string');
      users.push(addResult.val);
    }
    expect(users.length).to.equal(USERS.length);
    const [index, count] = [2, 4];
    const qResult = await dao.query({index, count});
    expect(qResult.errors).to.be.undefined;
    expect(qResult.val).to.have.length(count);
    expect(qResult.val).to.deep.equal(users.slice(index, index + count));
  });
  
  it('should query users respecting filter', async () => {
    const users = [];
    for (const u of USERS) {
      const addResult = await dao.add(u);
      expect(addResult.errors).to.be.undefined;
      expect(addResult.val.userId).to.be.a('string');
      users.push(addResult.val);
    }
    expect(users.length).to.equal(USERS.length);
    const filter = { lastName: 'smith' };
    const [index, count] = [1, 2];
    const qResult = await dao.query({index, count, ...filter});
    expect(qResult.errors).to.be.undefined;
    expect(qResult.val).to.have.length(count);
    const expected =
      users.filter(u => u.lastName === 'smith').slice(index, index + count);
    expect(qResult.val).to.deep.equal(expected);
  });
  
  it('should not retrieve users after clear', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    await dao.clear();
    for (const u of added) {
      const result1 = await dao.getByUserId(u.userId);
      expect(result1.errors).to.not.be.undefined;
      expect(result1.errors).to.have.length(1);
      expect(result1.errors[0].options.code).to.equal('NOT_FOUND');
      const result2 = await dao.getByLoginId(u.loginId);
      expect(result2.errors).to.have.length(1);
      expect(result2.errors[0].options.code).to.equal('NOT_FOUND');
    }
  });

  
  it('should not retrieve users after remove', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    for (const u of added) {
      const result0 = await dao.remove(u.userId);
      expect(result0.errors).to.be.undefined;
      const result1 = await dao.getByUserId(u.userId);
      expect(result1.errors).to.not.be.undefined;
      expect(result1.errors).to.have.length(1);
      expect(result1.errors[0].options.code).to.equal('NOT_FOUND');
      const result2 = await dao.getByLoginId(u.loginId);
      expect(result2.errors).to.have.length(1);
      expect(result2.errors[0].options.code).to.equal('NOT_FOUND');
    }
  });

  it('removing users with bad userId should result in NOT_FOUND', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    for (const u of added) {
      const result = await dao.remove(u.userId + 'x');
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].options.code).to.equal('NOT_FOUND');
    }
  });  
  
  it('should update users', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    for (const u of added) {
      const result = await dao.update(u.userId, {firstName: u.firstName + 'x'});
      expect(result.errors).to.be.undefined;
    }
    for (const u of added) {
      const result = await dao.getByUserId(u.userId);
      expect(result.errors).to.be.undefined;
      expect(result.val).to.deep.equal({ ...u, firstName : u.firstName + 'x'});
    }
  });  
  
  it('updating users with bad userId should result in NOT_FOUND', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    for (const u of added) {
      const result = await dao.update(u.userId + 'x', {firstName: 'x' });
      expect(result.errors).to.not.be.undefined;
      expect(result.errors).to.have.length(1);
      expect(result.errors[0].options.code).to.equal('NOT_FOUND');
    }
  });  
  
  it('should allow NOP update for users', async () => {
    let added = [];
    for (const user of USERS) {
      const result = await dao.add(user);
      expect(result.errors).to.be.undefined;
      added.push(result.val);
    }
    expect(added.length).to.equal(USERS.length);
    for (const [i, u] of added.entries()) {
      const result = await dao.update(u.userId, USERS[i]);
      expect(result.errors).to.be.undefined;
    }
  });  
  
});

