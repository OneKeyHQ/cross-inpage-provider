import { ProviderWeblnBase } from './ProviderWeblnBase';
import type * as TypeUtils from './type-utils';

export interface RequestArguments {
  id?: number | string;
  method: string;
  params?: unknown[] | Record<string, unknown>;
}

export interface GetInfoResponse {
  node: {
    alias: string;
    pubkey: string;
    color?: string;
  },
  // Not supported by all connectors (see webln.request for more info)
  methods: string[]; 
}

export type IProviderWebln = ProviderWeblnBase & WeblnRequeset

export type WeblnRequeset = {
  enable: () => Promise<unknown>
  getInfo: () => Promise<GetInfoResponse>
}

export type JsBridgeRequest = {
  [K in keyof WeblnRequeset]: (params: Parameters<WeblnRequeset[K]>[0]) => Promise<TypeUtils.WireStringified<TypeUtils.ResolvePromise<ReturnType<WeblnRequeset[K]>>>>
}

export type JsBridgeRequestParams<T extends keyof JsBridgeRequest> = Parameters<JsBridgeRequest[T]>[0]

export type JsBridgeRequestResponse<T extends keyof JsBridgeRequest> = ReturnType<JsBridgeRequest[T]>
