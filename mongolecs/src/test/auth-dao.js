import AuthDao from `./auth-mem-dao.js`;
import USERS from `./test-users.js`;
import chai from 'chai';
import exp from 'constants';
const {expect} = chai;

let dao;
beforeEach(async function () {
  dao = await AuthDao.setup();
});


  //mocha runs this after each test; we use this to clean up the DAO.
afterEach(async function () {
await AuthDao.tearDown(dao);
});

it('should add a user without any errors', async() => {
    const result = await dao.add(USERS[10]);
    expect (result.errors).to.be.undefined;
    expect (result.val.userId).to.be.a('string');
});

it('should retrieve previously added users',async()=>{
  let added=[];
  for(const user of USERS){
    const result = await dao.add(user);
    expect(result.errors).to.be.undefined;
    added.push(result.val);
    expect (added.length).to.equal(USERS.length);
    for(const u of added){
      const result1 = await dao.getByUserId(u.userId);
      expect(result1.errors).to.be.undefined;
      expect(result1.val).to.deep.equal(u);

      const result2= await dao.getByLoginId(u.loginId);
      expect(result2.errors).to.be.undefined;
      expect(result2.val).to.deep.equal(u);

    }
  }
})