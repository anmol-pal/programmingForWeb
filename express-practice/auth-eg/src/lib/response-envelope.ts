type HrefMethod={
    href:string,
    method: string
};

export type SelfLink = {
    self: HrefMethod,
};

export type NavLinks = SelfLink & {
    next? : HrefMethod,
    prev? : HrefMethod
};

type LinkedResult<T> = {
    links: SelfLink,
    result: T,
};

type Envelope = {
    isOk: boolean,
    status: number,
};

export type SuccessEnvelope<T> = Envelope & LinkedResult<T> & {
    isOk: true,
};
export type PagedEnvelope<T> = Envelope & {
    isOk: true,
    links: NavLinks,
    result: LinkedResult<T>[],
};

export type ErrorEnvelope = Envelope & {
    isOk: false,
    errors: {message: string, options?: {[key:string]: string}} [],
};