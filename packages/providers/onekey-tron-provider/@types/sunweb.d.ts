declare module 'sunweb' {
  export class SunWeb {
    readonly isTronLink: true;
    constructor(
      mainchain: any,
      sidechain: any,
      mainGatewayAddress: any,
      sideGatewayAddress: any,
      sideChainId: any,
    );
    mainchain: any;
    sidechain: any;
    request<T>(args: any): Promise<T>;
    trx: {
      sign: (
        transaction: any,
        privateKey: any,
        useTronHeader: boolean,
        callback?: any,
      ) => Promise<any>;
      signMessageV2: (message: string | Uint8Array | Array<number>, privateKey?: string | false) => string;
      getNodeInfo: (callback?: any) => Promise<any>;
    };
  }

  export default SunWeb;
}
