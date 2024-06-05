export interface IProviderApi {
  isOneKey?: boolean;
  enable(): Promise<string[]>;
  isConnected(): Promise<boolean>;
  on(event: string, listener: (...args: any[]) => void): void;
  removeListener(event: string, listener: (...args: any[]) => void): void;
  request<T>({ method, params }: { method: string; params?: any }): Promise<T>;
  send<T>({ method, params }: { method: string; params?: any }): Promise<T>;
  sendAsync<T>(
    { method, params }: { method: string; params?: any },
    handler: (res: T, error: string) => void,
  ): Promise<T>;
}

export interface IProviderInfo {
  uuid: string;
  name: string;
  inject?: string; // window.ethereum
}
