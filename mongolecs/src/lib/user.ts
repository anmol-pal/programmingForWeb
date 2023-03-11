interface UserInfo {
    loginId: string;
    firstName: string;
    lastName: string;
    //allow other properties too
    [key: string]: string,
  };
  
  export interface User extends UserInfo {
    passwordHash: string;
  };
  
  export interface RegisteredUser extends User {
    userId: string;
  };
  