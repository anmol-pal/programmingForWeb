export type UserInfo = {
    firstName: string;
    lastName: string;
    [key: string]: any,
};

export type LoginUser = {
    loginId: string;
    password: string;
};

export type RegisteringdUser = UserInfo & LoginUser;

export type AuthUser = UserInfo & {
    loginId: string;
    passwordHash: string;
};

export type UserId = {
    userId: string;
};

export type RegisteredUser = UserInfo & AuthUser & UserId;

