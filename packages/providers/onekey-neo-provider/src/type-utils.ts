export type WireStringified<T> = T extends Array<infer P>
  ? Array<WireStringified<P>>
  : T extends object
  ? { [K in keyof T]: WireStringified<T[K]> }
  : T;

export type ResolvePromise<T> = T extends Promise<infer P> ? P : T; 