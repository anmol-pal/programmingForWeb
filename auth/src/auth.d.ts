interface UserInfo {
  loginId: string;
  firstName: string;
  lastName: string;
  //allow other properties too
  [key: string]: string,
};

interface User extends UserInfo {
  passwordHash: string;
};

interface RegisteredUser extends User {
  userId: string;
};

interface AuthDao {

  /** add user to this.
   *
   *  Error codes:
   *    EXISTS: there is already a user for user.loginId.
   *    DB: a database error.
   */
  add(user: User) : Promise<Result<RegisteredUser>>;

  /** retrieve user by userId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  getByUserId(userId: string) : Promise<Result<RegisteredUser>>;

  /** retrieve user by loginId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  getByLoginId(loginId: string) : Promise<Result<RegisteredUser>>;

  
  /** return list of all users which match filter.  It is not an error
   *  if no users match.
   *
   *  Error codes:
   *    DB: a database error.
   */
  query(filter: {
    userId?: string, loginId?: string, firstName?: string, lastName?: string,
    [key: string]: string }) : Promise<Result<RegisteredUser[]>>;

  /** remove user specified userId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  remove(userId: string) : Promise<Result<undefined>>;
  
  /** update user specified userId.
   *
   *  Error codes:
   *    NOT_FOUND: no user found for userId
   *    DB: a database error.
   */
  update(userId: string, updates: object) : Promise<Result<RegisteredUser>>;
  
  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  clear() : Promise<Result<undefined>>;
}

declare function makeAuthDao(dbUrl: string) : Promise<Result<AuthDao>>;


interface RawUser extends UserInfo {
  password: string;
}

interface AuthService {

  register(params: RawUser) : Promise<Result<RegisteredUser>>;

  login(params: {loginId: string, password: string})
    : Promise<Result<RegisteredUser>>;

  get(params: {userId: string}) : Promise<Result<RegisteredUser>>;

  query(filter: {
    userId?: string, loginId?: string, firstName?: string, lastName?: string,
    [key: string]: string }) : Promise<Result<RegisteredUser[]>>;

  update(params: { userId: string,
		   firstName?: string, lastName?: string, password?: string,
		   [key: string]: string, }) :  Promise<Result<RegisteredUser>>;

  remove(params: {userId: string}) : Promise<Result<undefined>>;
}

declare function makeAuthService(dao: AuthDao) : AuthService;

