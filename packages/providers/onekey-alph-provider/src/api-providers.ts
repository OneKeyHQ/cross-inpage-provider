import type {
  NodeInfo,
  NodeVersion,
  ChainParams,
  SelfClique,
  InterCliquePeerInfo,
  BrokerInfo,
  PeerMisbehavior,
  MisbehaviorAction,
  DiscoveryAction,
  HashRateResponse,
  CurrentDifficulty,
  MinerAddresses,
  ExplorerInfo
} from './api-types';
import type { NodeProviderBase, ExplorerProviderBase } from './types';

export class NodeProvider implements NodeProviderBase {
  readonly baseUrl: string;
  readonly apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request<T>(data: unknown): Promise<T> {
    const response = await this.fetchJson<unknown>('/request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response as T;
  }

  async getNodeInfo(): Promise<NodeInfo> {
    const response = await this.fetchJson('/infos/node');
    if (!this.isValidNodeInfo(response)) {
      throw new Error('Invalid NodeInfo response');
    }
    return response;
  }

  async getNodeVersion(): Promise<NodeVersion> {
    const response = await this.fetchJson('/infos/version');
    if (!this.isValidNodeVersion(response)) {
      throw new Error('Invalid NodeVersion response');
    }
    return response;
  }

  async getChainParams(): Promise<ChainParams> {
    const response = await this.fetchJson('/infos/chain-params');
    if (!this.isValidChainParams(response)) {
      throw new Error('Invalid ChainParams response');
    }
    return response;
  }

  async getSelfClique(): Promise<SelfClique> {
    const response = await this.fetchJson('/infos/self-clique');
    if (!this.isValidSelfClique(response)) {
      throw new Error('Invalid SelfClique response');
    }
    return response;
  }

  async getInterCliquePeerInfo(): Promise<InterCliquePeerInfo[]> {
    const response = await this.fetchJson('/infos/inter-clique-peer-info');
    if (!Array.isArray(response) || !response.every((info) => this.isValidInterCliquePeerInfo(info))) {
      throw new Error('Invalid InterCliquePeerInfo[] response');
    }
    return response;
  }

  async getDiscoveredNeighbors(): Promise<BrokerInfo[]> {
    const response = await this.fetchJson('/infos/discovered-neighbors');
    if (!Array.isArray(response) || !response.every((info) => this.isValidBrokerInfo(info))) {
      throw new Error('Invalid BrokerInfo[] response');
    }
    return response;
  }

  async getMisbehaviors(): Promise<PeerMisbehavior[]> {
    const response = await this.fetchJson('/infos/misbehaviors');
    if (!Array.isArray(response) || !response.every((info) => this.isValidPeerMisbehavior(info))) {
      throw new Error('Invalid PeerMisbehavior[] response');
    }
    return response;
  }

  async postMisbehaviors(action: MisbehaviorAction): Promise<void> {
    await this.fetchJson('/infos/misbehaviors', {
      method: 'POST',
      body: JSON.stringify(action)
    });
  }

  async getUnreachable(): Promise<string[]> {
    const response = await this.fetchJson('/infos/unreachable');
    if (!Array.isArray(response) || !response.every(item => typeof item === 'string')) {
      throw new Error('Invalid string[] response');
    }
    return response;
  }

  async postDiscovery(action: DiscoveryAction): Promise<void> {
    await this.fetchJson('/infos/discovery', {
      method: 'POST',
      body: JSON.stringify(action)
    });
  }

  async getHistoryHashrate(fromTs: string, toTs?: string): Promise<HashRateResponse> {
    const params = new URLSearchParams();
    params.append('fromTs', fromTs);
    if (toTs !== undefined) {
      params.append('toTs', toTs);
    }
    const response = await this.fetchJson(`/infos/history-hashrate?${params.toString()}`);
    if (!this.isValidHashRateResponse(response)) {
      throw new Error('Invalid HashRateResponse response');
    }
    return response;
  }

  async getCurrentHashrate(timespan?: string): Promise<HashRateResponse> {
    const params = timespan ? new URLSearchParams({ timespan }) : null;
    const query = params ? `?${params.toString()}` : '';
    const response = await this.fetchJson(`/infos/current-hashrate${query}`);
    if (!this.isValidHashRateResponse(response)) {
      throw new Error('Invalid HashRateResponse response');
    }
    return response;
  }

  async getCurrentDifficulty(): Promise<CurrentDifficulty> {
    const response = await this.fetchJson('/infos/current-difficulty');
    if (!this.isValidCurrentDifficulty(response)) {
      throw new Error('Invalid CurrentDifficulty response');
    }
    return response;
  }

  async getMinerAddresses(): Promise<MinerAddresses> {
    const response = await this.fetchJson('/miners/addresses');
    if (!this.isValidMinerAddresses(response)) {
      throw new Error('Invalid MinerAddresses response');
    }
    return response;
  }

  private isValidNodeInfo = (response: unknown): response is NodeInfo => {
    return typeof response === 'object' && response !== null &&
      'buildInfo' in response && typeof response.buildInfo === 'object' &&
      response.buildInfo !== null && 'releaseVersion' in response.buildInfo &&
      'commit' in response.buildInfo && 'upnp' in response;
  }

  private isValidNodeVersion = (response: unknown): response is NodeVersion => {
    return typeof response === 'object' && response !== null &&
      'version' in response && typeof response.version === 'string';
  }

  private isValidChainParams = (response: unknown): response is ChainParams => {
    return typeof response === 'object' && response !== null &&
      'networkId' in response && 'numZerosAtLeastInHash' in response &&
      'groupNumPerBroker' in response && 'groups' in response;
  }

  private isValidSelfClique = (response: unknown): response is SelfClique => {
    return typeof response === 'object' && response !== null &&
      'cliqueId' in response && 'nodes' in response &&
      'networkId' in response && 'selfReady' in response &&
      'synced' in response;
  }

  private isValidInterCliquePeerInfo = (info: unknown): info is InterCliquePeerInfo => {
    return typeof info === 'object' && info !== null &&
      'cliqueId' in info && 'brokerId' in info &&
      'groupNumPerBroker' in info && 'brokerNum' in info &&
      'address' in info && 'isSynced' in info;
  }

  private isValidBrokerInfo = (info: unknown): info is BrokerInfo => {
    return typeof info === 'object' && info !== null &&
      'cliqueId' in info && 'brokerId' in info && 'address' in info;
  }

  private isValidPeerMisbehavior = (misbehavior: unknown): misbehavior is PeerMisbehavior => {
    return typeof misbehavior === 'object' && misbehavior !== null &&
      'peer' in misbehavior && 'status' in misbehavior;
  }

  private isValidHashRateResponse = (response: unknown): response is HashRateResponse => {
    return typeof response === 'object' && response !== null &&
      'hashrate' in response && typeof response.hashrate === 'string';
  }

  private isValidCurrentDifficulty = (response: unknown): response is CurrentDifficulty => {
    return typeof response === 'object' && response !== null &&
      'value' in response && typeof response.value === 'string';
  }

  private isValidMinerAddresses = (response: unknown): response is MinerAddresses => {
    return typeof response === 'object' && response !== null &&
      'addresses' in response && Array.isArray(response.addresses) &&
      response.addresses.every(addr => typeof addr === 'string');
  }

  private async fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'X-API-KEY': this.apiKey } : {})
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as unknown;
    return data as T;
  }
}

export class ExplorerProvider implements ExplorerProviderBase {
  readonly baseUrl: string;
  readonly apiKey?: string;

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async request<T>(data: unknown): Promise<T> {
    const response = await this.fetchJson<unknown>('/request', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response as T;
  }

  async getExplorerInfo(): Promise<ExplorerInfo> {
    const response = await this.fetchJson<unknown>('/infos');
    if (!this.isValidExplorerInfo(response)) {
      throw new Error('Invalid ExplorerInfo response');
    }
    return response;
  }

  private isValidExplorerInfo = (response: unknown): response is ExplorerInfo => {
    return typeof response === 'object' && response !== null &&
      'releaseVersion' in response && 'commit' in response &&
      'networkId' in response;
  }

  private async fetchJson<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { 'X-API-KEY': this.apiKey } : {})
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as unknown;
    return data as T;
  }
}
