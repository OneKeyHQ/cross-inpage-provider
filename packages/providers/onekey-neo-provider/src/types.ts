export interface IAccount {
  address: string;
}

export interface IN3DapiMethods {
  getProvider(): Promise<{ name: string; website: string; version: string; compatibility: string[] }>;
}
