declare global {
  interface Window {
    web3: any;
    ethereum: any;
    phantom: { solana: any };
    solflare: any;
    glowSolana: any;
    solana: any;
    // starcoin: any;
    aptos: any;
    martian: any;
    conflux: any;
    tronLink: any;
    tronWeb: any;
    sunWeb: any;
    suiWallet: any;
    cardano: any;
    keplr: any;
    webln: any;
    nostr: any;
    $onekey: any;
    ReactNativeWebView?: {
      postMessage: (payload: string) => void;
    };
    ONEKEY_DESKTOP_GLOBALS?: {
      preloadJsUrl: string;
    };
  }
}

export type ConsoleLike = Pick<Console, 'log' | 'warn' | 'error' | 'debug' | 'info' | 'trace'>;

export enum IJsBridgeMessageTypes {
  RESPONSE = 'RESPONSE', // response result or error
  REQUEST = 'REQUEST',
}

export type IJsBridgeMessageTypesStrings = keyof typeof IJsBridgeMessageTypes;

export enum IInjectedProviderNames {
  btc = 'btc',
  ethereum = 'ethereum',
  conflux = 'conflux',
  tron = 'tron',
  solana = 'solana',
  // starcoin = 'starcoin',
  sollet = 'sollet',
  near = 'near',
  aptos = 'aptos',
  martian = 'martian',
  algo = 'algo',
  sui = 'sui',
  cardano = 'cardano',
  cosmos = 'cosmos',
  polkadot = 'polkadot',
  webln = 'webln',
  nostr = 'nostr',
  $private = '$private',
  $privateExternalAccount = '$privateExternalAccount',
  $hardware_sdk = '$hardware_sdk',
  $walletConnect = '$walletConnect' 
}

export type IInjectedProviderNamesStrings = keyof typeof IInjectedProviderNames;

export type IJsonRpcRequest = {
  id?: number | string;
  jsonrpc?: '2.0' | '1.0';
  method: string;
  params?: Record<string, unknown> | Array<unknown> | unknown;
};

export type IJsonRpcResponse<T> = {
  id?: number | string;
  jsonrpc: string;
  result: any | unknown | T;
};

export type IJsBridgeCallback = {
  id: number;
  resolve: (value: unknown) => void;
  reject: (value: unknown) => void;
  created: number;
};

export type IJsBridgeMessagePayload = {
  id?: number;
  data?: unknown | IJsonRpcRequest;
  error?: unknown;
  remoteId?: number | string | null; // remote port id
  type?: IJsBridgeMessageTypesStrings;
  scope?: IInjectedProviderNamesStrings;
  origin?: string;
  peerOrigin?: string;
  resolve?: (value: unknown) => void;
  reject?: (value: unknown) => void;
  created?: number;
  sync?: boolean;
  internal?: boolean;
  isWalletConnectRequest?: boolean;
};

export type IDebugLogger = {
  _externalLogger: ConsoleLike;
  _debug: { enable: (config: string) => void };
  _createDebugInstance: (name: string) => unknown;
  _attachExternalLogger: (logger: ConsoleLike) => void;
  jsBridge: (...args: any[]) => unknown;
  providerBase: (...args: any[]) => unknown;
  extInjected: (...args: any[]) => unknown;
  extContentScripts: (...args: any[]) => unknown;
  webview: (...args: any[]) => unknown;
  desktopInjected: (...args: any[]) => unknown;
  ethereum: (...args: any[]) => unknown;
};

export type IOptionsWithDebugLogger = {
  debugLogger?: IDebugLogger;
};

export type IJsBridgeConfig = {
  sendAsString?: boolean;
  timeout?: number;
  receiveHandler?: IJsBridgeReceiveHandler;
  webviewRef?: unknown;
} & IOptionsWithDebugLogger;

export type IJsBridgeReceiveHandler = (
  payload: IJsBridgeMessagePayload,
  bridge?: any,
) => any | Promise<any>;

export type IElectronWebView = {
  reload: () => void;
  loadURL: (...args: any) => void;
  closeDevTools: () => void;
  openDevTools: () => void;
  getURL: () => string;
  src: string;
  addEventListener: (name: string, callback: unknown) => void;
  removeEventListener: (name: string, callback: unknown) => void;
  executeJavaScript: (code: string) => void;
  send: (channel: string, payload: any) => void;
  insertCSS: (code: string) => void;
};

export type IPostMessageEventData = {
  channel: string;
  direction: string;
  payload: any;
};

export type InpageProviderWebViewProps = {
  src: string;
  onSrcChange?: (src: string) => void;
  receiveHandler?: IJsBridgeReceiveHandler;
  ref?: any;
};
