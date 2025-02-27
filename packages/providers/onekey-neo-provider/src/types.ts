export interface IAccount {
  address: string;
}

export interface INeoGetProviderResponse {
  name: string;
  website: string;
  version: string;
  compatibility: string[]
}

export interface INeoProviderMethods {
  getProvider(): Promise<INeoGetProviderResponse>;
}
