import { NodeProvider as NodeProviderBase, ExplorerProvider as ExplorerProviderBase } from '@alephium/web3';

export class NodeProvider extends NodeProviderBase {
  constructor(baseUrl: string, apiKey?: string) {
    super(baseUrl, apiKey);
  }
}

export class ExplorerProvider extends ExplorerProviderBase {
  constructor(baseUrl: string, apiKey?: string) {
    super(baseUrl, apiKey);
  }
}
