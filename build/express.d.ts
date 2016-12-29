export declare function registerPost<TArg, TRes>(method: <TArg, TRes>(arg: TArg) => Promise<TRes>): void;
export declare function start(port: number): void;
