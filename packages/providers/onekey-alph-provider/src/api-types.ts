// Node Provider Types
export interface NodeProvider {
  baseUrl: string;
  apiKey?: string;
  getNodeInfo(): Promise<NodeInfo>;
  getNodeVersion(): Promise<NodeVersion>;
  getChainParams(): Promise<ChainParams>;
  getSelfClique(): Promise<SelfClique>;
  getInterCliquePeerInfo(): Promise<InterCliquePeerInfo[]>;
  getDiscoveredNeighbors(): Promise<BrokerInfo[]>;
  getMisbehaviors(): Promise<PeerMisbehavior[]>;
  postMisbehaviors(action: MisbehaviorAction): Promise<void>;
  getUnreachable(): Promise<string[]>;
  postDiscovery(action: DiscoveryAction): Promise<void>;
  getHistoryHashrate(fromTs: string, toTs?: string): Promise<HashRateResponse>;
  getCurrentHashrate(timespan?: string): Promise<HashRateResponse>;
  getCurrentDifficulty(): Promise<CurrentDifficulty>;
  getMinerAddresses(): Promise<MinerAddresses>;
}

export interface NodeInfo {
  buildInfo: BuildInfo;
  upnp: boolean;
  externalAddress?: {
    addr: string;
    port: string;
  };
}

export interface BuildInfo {
  releaseVersion: string;
  commit: string;
}

export interface NodeVersion {
  version: string;
}

export interface ChainParams {
  networkId: string;
  numZerosAtLeastInHash: string;
  groupNumPerBroker: string;
  groups: string;
}

export interface SelfClique {
  cliqueId: string;
  nodes: Array<PeerAddress>;
  networkId: string;
  selfReady: boolean;
  synced: boolean;
}

export interface PeerAddress {
  address: string;
  restPort: string;
  wsPort: string;
  minerApiPort: string;
}

export interface InterCliquePeerInfo {
  cliqueId: string;
  brokerId: string;
  groupNumPerBroker: string;
  brokerNum: string;
  address: string;
  isSynced: boolean;
}

export interface BrokerInfo {
  cliqueId: string;
  brokerId: string;
  address: string;
}

export interface PeerMisbehavior {
  peer: string;
  status: PeerStatus;
}

export type PeerStatus = Banned | Penalty;

export interface Banned {
  type: 'Banned';
}

export interface Penalty {
  type: 'Penalty';
  value: string;
}

export interface HashRateResponse {
  hashrate: string;
}

export interface CurrentDifficulty {
  value: string;
}

export interface MinerAddresses {
  addresses: string[];
}

export type MisbehaviorAction = Ban | Unban;

export interface Ban {
  type: 'Ban';
  peers: string[];
}

export interface Unban {
  type: 'Unban';
  peers: string[];
}

export type DiscoveryAction = Reachable | Unreachable;

export interface Reachable {
  type: 'Reachable';
  peers: string[];
}

export interface Unreachable {
  type: 'Unreachable';
  peers: string[];
}

// Explorer Provider Types
export interface ExplorerProvider {
  baseUrl: string;
  apiKey?: string;
  getExplorerInfo(): Promise<ExplorerInfo>;
}

export interface ExplorerInfo {
  releaseVersion: string;
  commit: string;
  networkId: string;
}
