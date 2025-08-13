/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Ed25519Signature,
  Ed25519PublicKey,
  Network,
  AccountAddress,
  SimpleTransaction,
  Serializer,
} from '@aptos-labs/ts-sdk';
import {
  APTOS_CHAINS,
  AccountInfo,
  registerWallet,
  UserResponseStatus,
} from '@aptos-labs/wallet-standard';
import { stripHexPrefix, bytesToHex } from '@onekeyfe/cross-inpage-provider-core';

import type {
  Account,
  AccountAuthenticator,
  AnyRawTransaction,
  SigningScheme,
} from '@aptos-labs/ts-sdk';
import type {
  AptosConnectMethod,
  AptosDisconnectMethod,
  AptosGetAccountMethod,
  AptosGetNetworkMethod,
  AptosOnAccountChangeMethod,
  AptosSignMessageInput,
  AptosSignMessageMethod,
  AptosSignMessageOutput,
  AptosSignTransactionMethod,
  AptosWallet,
  IdentifierArray,
  NetworkInfo,
  UserResponse,
  AptosWalletAccount,
  AptosOnNetworkChangeMethod,
  AptosFeatures,
  WalletIcon,
  AptosOnAccountChangeInput,
  AptosOnNetworkChangeInput,
  AptosSignAndSubmitTransactionMethod,
  AptosSignAndSubmitTransactionInput,
  AptosSignAndSubmitTransactionOutput,
  AptosSignInMethod,
  AptosSignInInput,
  AptosSignInOutput,
} from '@aptos-labs/wallet-standard';

import type { ProviderAptos } from './OnekeyAptosProvider';
import type { WalletInfo } from './types';

export class WalletAccount implements AptosWalletAccount {
  address: string;
  publicKey: Uint8Array;

  chains: IdentifierArray = APTOS_CHAINS;
  features: IdentifierArray = [];
  signingScheme: SigningScheme;
  label?: string;
  icon?: WalletIcon | undefined;

  constructor(account: Account) {
    this.address = account.accountAddress.toString();
    this.publicKey = account.publicKey.toUint8Array();
    this.chains = APTOS_CHAINS;
    this.signingScheme = account.signingScheme;
  }
}

export function registerAptosWallet(provider: ProviderAptos, options: WalletInfo) {
  try {
    registerWallet(new AptosStandardProvider(provider, options));
  } catch (error) {
    console.error(error);
  }
}

export class AptosStandardProvider implements AptosWallet {
  readonly url: string = 'https://onekey.so';

  readonly options?: WalletInfo;

  readonly version = '1.0.0';

  readonly name: string = 'OneKey';

  icon: WalletIcon = 'data:image/svg+xml;base64,';
  provider: ProviderAptos;

  constructor(provider: ProviderAptos, options: WalletInfo) {
    this.provider = provider;
    this.name = options.name;
    this.icon = options.logo;
    this.url = options.url ? options.url : this.url;
  }

  chains = APTOS_CHAINS;

  accounts: WalletAccount[] = [];

  get features(): AptosFeatures {
    return {
      'aptos:account': {
        version: '1.0.0',
        account: this.account,
      },
      'aptos:connect': {
        version: '1.0.0',
        connect: this.connect,
      },
      'aptos:disconnect': {
        version: '1.0.0',
        disconnect: this.disconnect,
      },
      'aptos:network': {
        version: '1.0.0',
        network: this.network,
      },
      'aptos:signTransaction': {
        version: '1.0.0',
        signTransaction: this.signTransaction,
      },
      'aptos:signMessage': {
        version: '1.0.0',
        signMessage: this.signMessage,
      },
      'aptos:onAccountChange': {
        version: '1.0.0',
        onAccountChange: this.onAccountChange,
      },
      'aptos:onNetworkChange': {
        version: '1.0.0',
        onNetworkChange: this.onNetworkChange,
      },
      'aptos:signAndSubmitTransaction': {
        version: '1.1.0',
        signAndSubmitTransaction: this.signAndSubmitTransaction,
      },
      'aptos:signIn': {
        version: '1.0.0',
        signIn: this.signIn,
      },
    };
  }

  account: AptosGetAccountMethod = async (): Promise<AccountInfo> => {
    const address = await this.provider.account();
    const account = new AccountInfo({
      address: address.address,
      publicKey: new Ed25519PublicKey(address.publicKey),
    });
    return account;
  };

  connect: AptosConnectMethod = async (): Promise<UserResponse<AccountInfo>> => {
    try {
      const address = await this.provider.connect();

      const account = new AccountInfo({
        address: address.address,
        publicKey: new Ed25519PublicKey(address.publicKey),
      });

      return {
        status: UserResponseStatus.APPROVED,
        args: account,
      };
    } catch (e) {
      return {
        status: UserResponseStatus.REJECTED,
      };
    }
  };

  /**
   * Return the name, chainId, and url of the network connection your wallet is using to connect to the Aptos chain.
   *
   * @returns Which network the connected Wallet is pointing to.
   */
  network: AptosGetNetworkMethod = async (): Promise<NetworkInfo> => {
    const network = await this.provider.getNetwork();
    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      name: network.chainId === 1 ? Network.MAINNET : Network.DEVNET,
      chainId: network.chainId,
      url: network.url,
    };
  };

  disconnect: AptosDisconnectMethod = async (): Promise<void> => {
    return await this.provider.disconnect();
  };

  /**
   * REVISION - Implement this function using your Wallet.
   *
   * @param transaction - A transaction that the user should have the ability to sign if they choose to.
   * @param asFeePayer - Optionally, another this signature is acting as a fee-payer for the transaction being signed.
   * @returns The result of whether the user chose to sign the transaction or not.
   */
  signTransaction: AptosSignTransactionMethod = async (
    transaction: AnyRawTransaction,
    asFeePayer?: boolean,
  ): Promise<UserResponse<AccountAuthenticator>> => {
    let transactionType: 'simple' | 'multi_agent';
    if (transaction.secondarySignerAddresses) {
      transactionType = 'multi_agent';
    } else {
      transactionType = 'simple';
    }

    const signature = await this.provider.signTransactionV2({
      transaction: transaction.bcsToHex().toStringWithoutPrefix(),
      transactionType,
      asFeePayer,
    });

    return Promise.resolve({
      status: UserResponseStatus.APPROVED,
      args: signature,
    });
  };

  signAndSubmitTransaction: AptosSignAndSubmitTransactionMethod = async (
    input: AptosSignAndSubmitTransactionInput,
  ): Promise<UserResponse<AptosSignAndSubmitTransactionOutput>> => {
    // Special case: Only support simple transaction
    if (!!input && 'rawTransaction' in input) {
      // Support standard sign and send transaction 1.0.0
      const serializer = new Serializer();
      (input as unknown as SimpleTransaction).serialize(serializer);
      const payload = serializer.toUint8Array();
      const result = await this.provider.signAndSubmitTransactionStandardV1(bytesToHex(payload));
      return {
        status: UserResponseStatus.APPROVED,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        args: result,
      };
    }

    const result = await this.provider.signAndSubmitTransactionV2(input);

    return Promise.resolve({
      status: UserResponseStatus.APPROVED,
      args: result,
    });
  };

  /**
   * @param input - A message to sign with the private key of the connected account.
   * @returns A user response either with a signed message, or the user rejecting to sign.
   */
  signMessage: AptosSignMessageMethod = async (
    input: AptosSignMessageInput,
  ): Promise<UserResponse<AptosSignMessageOutput>> => {
    try {
      const result = await this.provider.signMessageCompatible({
        address: input.address,
        application: input.application,
        chainId: input.chainId,
        message: input.message,
        nonce: input.nonce,
      });

      return {
        status: UserResponseStatus.APPROVED,
        args: {
          address: result.address,
          fullMessage: result.fullMessage,
          message: result.message,
          nonce: result.nonce,
          prefix: 'APTOS',
          signature: new Ed25519Signature(result.signature),
        },
      };
    } catch (e) {
      return {
        status: UserResponseStatus.REJECTED,
      };
    }
  };

  signIn: AptosSignInMethod = async (
    input: AptosSignInInput,
  ): Promise<UserResponse<AptosSignInOutput>> => {
    try {
      const result = await this.provider.signIn(input);
      const account = new AccountInfo({
        address: result.account.address,
        publicKey: new Ed25519PublicKey(result.account.publicKey),
      });

      const output: AptosSignInOutput = {
        account,
        input: result.input,
        signature: new Ed25519Signature(result.signature),
        type: result.type,
      };

      return {
        status: UserResponseStatus.APPROVED,
        args: output,
      };
    } catch (e) {
      return {
        status: UserResponseStatus.REJECTED,
      };
    }
  };

  onAccountChange: AptosOnAccountChangeMethod = async (
    input: AptosOnAccountChangeInput,
  ): Promise<void> => {
    this.provider.onAccountChangeStandardV2((account) => {
      const address: string = stripHexPrefix(account?.address ?? '');
      if (account && address.length === 64) {
        input(
          new AccountInfo({
            address: new AccountAddress(Buffer.from(address, 'hex')),
            publicKey: new Ed25519PublicKey(account?.publicKey ?? ''),
          }),
        );
      }
    });
    return Promise.resolve();
  };

  onNetworkChange: AptosOnNetworkChangeMethod = async (
    input: AptosOnNetworkChangeInput,
  ): Promise<void> => {
    this.provider.onNetworkChange((network) => {
      const chainId = network === 'Mainnet' ? 1 : 2;
      const name = network === 'Mainnet' ? Network.MAINNET : Network.DEVNET;
      input({
        name,
        chainId,
      });
    });
    return Promise.resolve();
  };
}
