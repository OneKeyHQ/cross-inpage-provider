import { Ed25519Signature, Ed25519PublicKey, Network } from '@aptos-labs/ts-sdk';
import {
  APTOS_CHAINS,
  AccountInfo,
  registerWallet,
  UserResponseStatus,
} from '@aptos-labs/wallet-standard';

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

    // this._events = mitt();
    // this._account = null;
    // this.subscribeEventFromBackend();
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
    // const signature = await this.provider.signTransaction(transaction, asFeePayer);

    // // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    // if (asFeePayer) {
    //   const senderAuthenticator = this.aptos.transaction.signAsFeePayer({
    //     signer: this.signer,
    //     transaction,
    //   });

    //   return Promise.resolve({
    //     status: UserResponseStatus.APPROVED,
    //     args: senderAuthenticator,
    //   });
    // }
    // const senderAuthenticator = this.aptos.transaction.sign({
    //   signer: this.signer,
    //   transaction,
    // });

    const signature = await this.provider.signTransactionV2({
      transaction,
      asFeePayer,
    });

    return Promise.resolve({
      status: UserResponseStatus.APPROVED,
      args: signature,
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
      const result = await this.provider.signMessage({
        address: input.address,
        application: input.application,
        chainId: input.chainId,
        message: input.message,
        nonce: parseInt(input.nonce),
      });

      return {
        status: UserResponseStatus.APPROVED,
        args: {
          address: result.address,
          fullMessage: result.fullMessage,
          message: result.message,
          nonce: result.nonce.toString(),
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

  onAccountChange: AptosOnAccountChangeMethod = async (): Promise<void> => {
    // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    return Promise.resolve();
  };

  onNetworkChange: AptosOnNetworkChangeMethod = async (): Promise<void> => {
    // THIS LOGIC SHOULD BE REPLACED. IT IS FOR EXAMPLE PURPOSES ONLY.
    return Promise.resolve();
  };
}
