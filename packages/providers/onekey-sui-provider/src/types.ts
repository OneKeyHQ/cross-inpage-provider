import { SuiChain } from '@mysten/wallet-standard';
export const ALL_PERMISSION_TYPES = ['viewAccount', 'suggestTransactions'] as const;
type AllPermissionsType = typeof ALL_PERMISSION_TYPES;

export type PermissionType = AllPermissionsType[number];

export type WalletInfo = {
  name?: string;
  logo: string;
};

export type SuiChainType = SuiChain;

export interface AccountInfo {
  address: string;
  publicKey: string;
}