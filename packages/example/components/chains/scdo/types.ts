type methodType =
  | 'scdo_requestAccounts'
  | 'scdo_disconnect'
  | 'scdo_getAccounts'
  | 'scdo_getBalance'
  | 'scdo_signTransaction'
  | 'scdo_sendTransaction'
  | 'scdo_signMessage'
  | 'scdo_ecRecover'
  | 'scdo_estimateGas';
export interface IProviderApi {
  request<T>({ method, params }: { method: methodType; params?: Array<unknown> }): Promise<T>;
  on(event: string, listener: (args: unknown) => void): void;
  removeListener(event: string, listener: (args: unknown) => void): void;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
