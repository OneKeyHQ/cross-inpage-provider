export type IKnownWallet = {
  id: string;
  name: string;
  logo?: string;
  tags?: string[];
};
export type IAccountInfo = {
  address: string;
  publicKey: string;
  chainId: string;
};
